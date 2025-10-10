<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// DB connection
require_once 'db_connect.php';

if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (empty($data['name']) || empty($data['patientId']) || empty($data['doctor']) || empty($data['date']) ||
    empty($data['status'])) {
    echo json_encode(["success" => false, "message" => "❌ All fields are required."]);
    exit;
}

try {
    // Insert the laboratory test data into the database
    $stmt = $pdo->prepare("INSERT INTO laboratory_tests (name, patient_id, doctor, date, status, type)
    VALUES (:name, :patientId, :doctor, :date, :status, :type)");

    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':patientId', $data['patientId']);
    $stmt->bindParam(':doctor', $data['doctor']);
    $stmt->bindParam(':date', $data['date']);
    $stmt->bindParam(':status', $data['status']);
    $stmt->bindParam(':type', $data['type']);

    $stmt->execute();

    echo json_encode(["success" => true, "message" => "✔️ Laboratory test added successfully."]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "❌ Error adding laboratory test: " . $e->getMessage()]);
}
?>
