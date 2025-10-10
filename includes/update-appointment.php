<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "Appointment ID is required."]);
    exit;
}

$appointmentId = $data['id'];

// For marking as done, set the date to yesterday so it appears in history
$yesterday = date('Y-m-d', strtotime('-1 day'));

try {
    $stmt = $pdo->prepare("UPDATE appointments SET date = :date WHERE id = :id");
    $stmt->bindParam(':id', $appointmentId, PDO::PARAM_INT);
    $stmt->bindParam(':date', $yesterday);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Appointment marked as completed."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update appointment."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>