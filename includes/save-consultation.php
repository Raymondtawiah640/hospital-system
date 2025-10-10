<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_connect.php';

try {
    // Get the posted data
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $requiredFields = ['patient_id', 'doctor_id', 'symptoms', 'conditions', 'diagnosis'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            echo json_encode([
                'success' => false,
                'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
            ]);
            exit;
        }
    }

    $patientId = (int)$input['patient_id'];
    $doctorId = (int)$input['doctor_id'];
    $symptoms = $input['symptoms']; // Array of symptom IDs
    $conditions = $input['conditions']; // Array of condition IDs
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

    // Validate doctor exists
    $doctorCheck = $pdo->prepare("SELECT id FROM staff WHERE id = ? AND role = 'doctor'");
    $doctorCheck->execute([$doctorId]);
    if (!$doctorCheck->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Doctor not found'
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
        $patientId, $doctorId, $diagnosis, $treatmentPlan,
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
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            s.first_name as doctor_first_name, s.last_name as doctor_last_name
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        JOIN staff s ON c.doctor_id = s.id
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
            'patient_name' => $consultation['patient_first_name'] . ' ' . $consultation['patient_last_name'],
            'doctor_id' => $consultation['doctor_id'],
            'doctor_name' => $consultation['doctor_first_name'] . ' ' . $consultation['doctor_last_name'],
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
