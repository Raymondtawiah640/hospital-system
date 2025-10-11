<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_connect.php';

try {
    // Get all consultations with patient and doctor details
    $consultationsQuery = $pdo->prepare("
        SELECT
            c.*,
            CONCAT(p.first_name, ' ', p.last_name) as patient_name,
            p.date_of_birth as patient_dob,
            p.gender as patient_gender,
            p.phone_number as patient_phone,
            p.email as patient_email,
            p.residential_address as patient_address,
            COALESCE(s.full_name, CONCAT(d.first_name, ' ', d.last_name)) as doctor_name,
            COALESCE(s.department, d.department) as doctor_department,
            s.staff_id as doctor_staff_id,
            d.specialization as doctor_specialization
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        LEFT JOIN staff s ON c.doctor_id = s.id
        LEFT JOIN doctors d ON s.staff_id = d.doctor_id
        ORDER BY c.created_at DESC
    ");

    $consultationsQuery->execute();
    $consultations = $consultationsQuery->fetchAll(PDO::FETCH_ASSOC);

    // Get symptoms for each consultation
    foreach ($consultations as &$consultation) {
        $symptomQuery = $pdo->prepare("
            SELECT s.name FROM consultation_symptoms cs
            JOIN symptoms s ON cs.symptom_id = s.id
            WHERE cs.consultation_id = ?
        ");
        $symptomQuery->execute([$consultation['id']]);
        $consultation['symptoms'] = $symptomQuery->fetchAll(PDO::FETCH_COLUMN);
    }

    // Get conditions for each consultation
    foreach ($consultations as &$consultation) {
        $conditionQuery = $pdo->prepare("
            SELECT c.name FROM consultation_conditions cc
            JOIN conditions c ON cc.condition_id = c.id
            WHERE cc.consultation_id = ?
        ");
        $conditionQuery->execute([$consultation['id']]);
        $consultation['conditions'] = $conditionQuery->fetchAll(PDO::FETCH_COLUMN);
    }

    // Extract doctor information from notes when doctor_id is null
    foreach ($consultations as &$consultation) {
        if (!$consultation['doctor_name'] && $consultation['notes']) {
            // Look for "Consulting Doctor:" pattern in notes
            if (preg_match('/Consulting Doctor:\s*(.+?)(?:\n|$)/', $consultation['notes'], $matches)) {
                $doctorInfo = trim($matches[1]);

                // If we found doctor info, try to look up the full doctor details
                if ($doctorInfo) {
                    $doctorLookupQuery = $pdo->prepare("
                        SELECT first_name, last_name, specialization, department
                        FROM doctors
                        WHERE CONCAT(first_name, ' ', last_name) LIKE ?
                        OR doctor_id = ?
                        LIMIT 1
                    ");
                    $doctorLookupQuery->execute(["%$doctorInfo%", $doctorInfo]);
                    $doctorDetails = $doctorLookupQuery->fetch(PDO::FETCH_ASSOC);

                    if ($doctorDetails) {
                        $consultation['doctor_name'] = $doctorDetails['first_name'] . ' ' . $doctorDetails['last_name'];
                        $consultation['doctor_department'] = $doctorDetails['department'];
                        $consultation['doctor_specialization'] = $doctorDetails['specialization'];
                        $consultation['doctor_staff_id'] = $doctorInfo; // Store the original doctor_id
                    } else {
                        // If no exact match found, use the extracted info as-is
                        $consultation['doctor_name'] = $doctorInfo;
                        $consultation['doctor_department'] = 'General';
                        $consultation['doctor_staff_id'] = $doctorInfo;
                    }
                }
            }
        }

        // Set default values if still null
        if (!$consultation['doctor_name']) {
            $consultation['doctor_name'] = 'Not assigned';
        }
        if (!$consultation['doctor_department']) {
            $consultation['doctor_department'] = 'General';
        }
    }

    echo json_encode([
        'success' => true,
        'consultations' => $consultations
    ]);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>