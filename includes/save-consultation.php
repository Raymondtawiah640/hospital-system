<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_connect.php';

try {
    // Get the posted data
    $input = json_decode(file_get_contents('php://input'), true);

    // Debug: Log what we received
    error_log('=== BACKEND CONSULTATION DEBUG ===');
    error_log('Raw input received: ' . print_r($input, true));
    error_log('Doctor ID received: ' . ($input['doctor_id'] ?? 'NOT SET'));

    // Validate required fields
    $requiredFields = ['patient_id', 'diagnosis'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            echo json_encode([
                'success' => false,
                'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
            ]);
            exit;
        }
    }

    // Optional fields - provide defaults if not set
    $patientId = (int)$input['patient_id'];
    $doctorIdInput = isset($input['doctor_id']) ? $input['doctor_id'] : null; // Keep original doctor_id for validation

    // If doctor_id is provided, validate it exists in doctors table and find corresponding staff.id
    $actualDoctorId = null;
    if ($doctorIdInput !== null) {
        // First check if the doctor_id exists in the doctors table
        $doctorCheckQuery = $pdo->prepare("SELECT id, first_name, last_name FROM doctors WHERE doctor_id = ?");
        $doctorCheckQuery->execute([$doctorIdInput]);
        $doctorResult = $doctorCheckQuery->fetch();

        if (!$doctorResult) {
            // Get available doctors for debugging
            $doctorsQuery = $pdo->prepare("SELECT doctor_id, first_name, last_name, specialization FROM doctors ORDER BY doctor_id");
            $doctorsQuery->execute();
            $availableDoctors = $doctorsQuery->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => false,
                'message' => 'Doctor not found. The doctor_id "' . $doctorIdInput . '" does not exist in the doctors table.',
                'debug' => [
                    'requested_doctor_id' => $doctorIdInput,
                    'available_doctor_ids' => array_column($availableDoctors, 'doctor_id'),
                    'doctors_count' => count($availableDoctors)
                ]
            ]);
            exit;
        }

        // Doctor exists, now try to find corresponding staff record
        $staffIdQuery = $pdo->prepare("SELECT id FROM staff WHERE staff_id = ?");
        $staffIdQuery->execute([$doctorIdInput]);
        $staffResult = $staffIdQuery->fetch();
        $actualDoctorId = $staffResult ? (int)$staffResult['id'] : null;

        if (!$actualDoctorId) {
            // Doctor exists in doctors table but no staff record found
            // For now, we'll proceed without a doctor_id rather than using incorrect fallback
            error_log("Doctor '$doctorIdInput' found in doctors table but no matching staff record. Saving consultation without doctor link.");

            // Store doctor information in notes or handle differently
            // For now, we'll save with null doctor_id but could enhance this later
        } else {
            error_log("Mapped doctor_id '$doctorIdInput' to staff.id: $actualDoctorId");
        }
    }
    $symptoms = isset($input['symptoms']) ? $input['symptoms'] : [];
    $conditions = isset($input['conditions']) ? $input['conditions'] : [];
    $diagnosis = trim($input['diagnosis']);
    $treatmentPlan = isset($input['treatment_plan']) ? trim($input['treatment_plan']) : '';
    $notes = isset($input['notes']) ? trim($input['notes']) : '';
    $followUpDate = isset($input['follow_up_date']) ? $input['follow_up_date'] : null;
    $status = isset($input['status']) ? trim($input['status']) : 'completed';


    // Validate patient exists
    $patientCheck = $pdo->prepare("SELECT id FROM patients WHERE id = ?");
    $patientCheck->execute([$patientId]);
    if (!$patientCheck->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Patient not found'
        ]);
        exit;
    }


    // Validate symptoms exist
    if (!empty($symptoms)) {
        foreach ($symptoms as $symptomId) {
            $symptomCheck = $pdo->prepare("SELECT id FROM symptoms WHERE id = ?");
            $symptomCheck->execute([(int)$symptomId]);
            if (!$symptomCheck->fetch()) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid symptom ID: ' . $symptomId
                ]);
                exit;
            }
        }
    }

    // Validate conditions exist
    if (!empty($conditions)) {
        foreach ($conditions as $conditionId) {
            $conditionCheck = $pdo->prepare("SELECT id FROM conditions WHERE id = ?");
            $conditionCheck->execute([(int)$conditionId]);
            if (!$conditionCheck->fetch()) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid condition ID: ' . $conditionId
                ]);
                exit;
            }
        }
    }

    // Start transaction
    $pdo->beginTransaction();

    // Insert consultation record
    $insertStmt = $pdo->prepare("
        INSERT INTO consultations (
            patient_id, doctor_id, consultation_date, diagnosis,
            treatment_plan, notes, follow_up_date, status, created_at
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, NOW())
    ");

    $insertResult = $insertStmt->execute([
        $patientId, $actualDoctorId, $diagnosis, $treatmentPlan,
        $notes, $followUpDate, $status
    ]);

    if (!$insertResult) {
        throw new Exception('Failed to save consultation');
    }

    $consultationId = $pdo->lastInsertId();

    // Insert consultation symptoms
    if (!empty($symptoms)) {
        $symptomStmt = $pdo->prepare("
            INSERT INTO consultation_symptoms (consultation_id, symptom_id)
            VALUES (?, ?)
        ");
        foreach ($symptoms as $symptomId) {
            $symptomStmt->execute([$consultationId, (int)$symptomId]);
        }
    }

    // Insert consultation conditions
    if (!empty($conditions)) {
        $conditionStmt = $pdo->prepare("
            INSERT INTO consultation_conditions (consultation_id, condition_id)
            VALUES (?, ?)
        ");
        foreach ($conditions as $conditionId) {
            $conditionStmt->execute([$consultationId, (int)$conditionId]);
        }
    }

    // Commit transaction
    $pdo->commit();

    // Get the saved consultation with details
    $consultationQuery = $pdo->prepare("
        SELECT
            c.*,
            CONCAT(p.first_name, ' ', p.last_name) as patient_name,
            COALESCE(s.full_name, CONCAT(d.first_name, ' ', d.last_name)) as doctor_name,
            COALESCE(s.department, d.department) as doctor_department,
            s.staff_id as doctor_staff_id,
            d.specialization as doctor_specialization
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        LEFT JOIN staff s ON c.doctor_id = s.id
        LEFT JOIN doctors d ON s.staff_id = d.doctor_id
        WHERE c.id = ?
    ");
    $consultationQuery->execute([$consultationId]);
    $consultation = $consultationQuery->fetch(PDO::FETCH_ASSOC);

    // Get consultation symptoms
    $symptomQuery = $pdo->prepare("
        SELECT s.name FROM consultation_symptoms cs
        JOIN symptoms s ON cs.symptom_id = s.id
        WHERE cs.consultation_id = ?
    ");
    $symptomQuery->execute([$consultationId]);
    $consultationSymptoms = $symptomQuery->fetchAll(PDO::FETCH_COLUMN);

    // Get consultation conditions
    $conditionQuery = $pdo->prepare("
        SELECT c.name FROM consultation_conditions cc
        JOIN conditions c ON cc.condition_id = c.id
        WHERE cc.consultation_id = ?
    ");
    $conditionQuery->execute([$consultationId]);
    $consultationConditions = $conditionQuery->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'message' => 'Consultation saved successfully',
        'consultation' => [
            'id' => $consultation['id'],
            'patient_id' => $consultation['patient_id'],
            'patient_name' => $consultation['patient_name'],
            'doctor_id' => $consultation['doctor_id'],
            'doctor_name' => $consultation['doctor_name'] ? $consultation['doctor_name'] . ' - ' . ($consultation['doctor_department'] || 'General') : 'Not assigned',
            'consultation_date' => $consultation['consultation_date'],
            'diagnosis' => $consultation['diagnosis'],
            'treatment_plan' => $consultation['treatment_plan'],
            'notes' => $consultation['notes'],
            'follow_up_date' => $consultation['follow_up_date'],
            'status' => $consultation['status'],
            'symptoms' => $consultationSymptoms,
            'conditions' => $consultationConditions,
            'created_at' => $consultation['created_at']
        ]
    ]);

} catch(PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
