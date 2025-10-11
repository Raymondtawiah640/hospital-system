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

    // Start transaction
    $pdo->beginTransaction();

    // Delete related records first (foreign key constraints)
    $deleteSymptomsQuery = $pdo->prepare("DELETE FROM consultation_symptoms WHERE consultation_id = ?");
    $deleteSymptomsQuery->execute([$consultationId]);

    $deleteConditionsQuery = $pdo->prepare("DELETE FROM consultation_conditions WHERE consultation_id = ?");
    $deleteConditionsQuery->execute([$consultationId]);

    // Delete the consultation
    $deleteConsultationQuery = $pdo->prepare("DELETE FROM consultations WHERE id = ?");
    $result = $deleteConsultationQuery->execute([$consultationId]);

    if ($result) {
        // Commit transaction
        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Consultation deleted successfully'
        ]);
    } else {
        // Rollback transaction
        $pdo->rollBack();

        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete consultation'
        ]);
    }

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