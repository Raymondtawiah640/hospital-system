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
            'message' => 'Symptom name is required'
        ]);
        exit;
    }

    $symptomName = trim($input['name']);

    if (empty($symptomName)) {
        echo json_encode([
            'success' => false,
            'message' => 'Symptom name cannot be empty'
        ]);
        exit;
    }

    // Check if symptom already exists
    $checkStmt = $pdo->prepare("SELECT id FROM symptoms WHERE name = ?");
    $checkStmt->execute([$symptomName]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        echo json_encode([
            'success' => false,
            'message' => 'Symptom already exists'
        ]);
        exit;
    }

    // Insert new symptom
    $insertStmt = $pdo->prepare("INSERT INTO symptoms (name, created_at) VALUES (?, NOW())");
    $result = $insertStmt->execute([$symptomName]);

    if ($result) {
        $newId = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Symptom added successfully',
            'symptom' => [
                'id' => $newId,
                'name' => $symptomName,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to add symptom'
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