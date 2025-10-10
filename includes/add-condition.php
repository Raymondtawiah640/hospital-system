<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_connect.php';

try {
    // Get the posted data
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['name'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Condition name is required'
        ]);
        exit;
    }

    $conditionName = trim($input['name']);

    if (empty($conditionName)) {
        echo json_encode([
            'success' => false,
            'message' => 'Condition name cannot be empty'
        ]);
        exit;
    }

    // Check if condition already exists
    $checkStmt = $pdo->prepare("SELECT id FROM conditions WHERE name = ?");
    $checkStmt->execute([$conditionName]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        echo json_encode([
            'success' => false,
            'message' => 'Condition already exists'
        ]);
        exit;
    }

    // Insert new condition
    $insertStmt = $pdo->prepare("INSERT INTO conditions (name, created_at) VALUES (?, NOW())");
    $result = $insertStmt->execute([$conditionName]);

    if ($result) {
        $newId = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Condition added successfully',
            'condition' => [
                'id' => $newId,
                'name' => $conditionName,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to add condition'
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