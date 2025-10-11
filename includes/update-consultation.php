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
    if (!isset($input['consultation_id']) || empty($input['consultation_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Consultation ID is required'
        ]);
        exit;
    }

    $consultationId = (int)$input['consultation_id'];

    // Validate consultation exists
    $checkQuery = $pdo->prepare("SELECT id FROM consultations WHERE id = ?");
    $checkQuery->execute([$consultationId]);
    if (!$checkQuery->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Consultation not found'
        ]);
        exit;
    }

    // Build update query dynamically based on provided fields
    $updateFields = [];
    $params = [];

    if (isset($input['diagnosis']) && $input['diagnosis'] !== null) {
        $updateFields[] = 'diagnosis = ?';
        $params[] = trim($input['diagnosis']);
    }

    if (isset($input['treatment_plan']) && $input['treatment_plan'] !== null) {
        $updateFields[] = 'treatment_plan = ?';
        $params[] = trim($input['treatment_plan']);
    }

    if (isset($input['status']) && $input['status'] !== null) {
        $updateFields[] = 'status = ?';
        $params[] = trim($input['status']);
    }

    if (isset($input['notes']) && $input['notes'] !== null) {
        $updateFields[] = 'notes = ?';
        $params[] = trim($input['notes']);
    }

    if (empty($updateFields)) {
        echo json_encode([
            'success' => false,
            'message' => 'No fields to update'
        ]);
        exit;
    }

    // Add consultation ID to params
    $params[] = $consultationId;

    // Execute update
    $updateQuery = $pdo->prepare("
        UPDATE consultations
        SET " . implode(', ', $updateFields) . ", updated_at = NOW()
        WHERE id = ?
    ");

    $result = $updateQuery->execute($params);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Consultation updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update consultation'
        ]);
    }

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