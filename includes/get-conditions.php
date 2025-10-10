<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_connect.php';

try {
    // Get all conditions from database
    $stmt = $pdo->prepare("SELECT * FROM conditions ORDER BY name ASC");
    $stmt->execute();
    $conditions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [
        'success' => true,
        'conditions' => $conditions
    ];

    echo json_encode($response);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>