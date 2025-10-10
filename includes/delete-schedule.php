<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$response = ["success" => false];

try {
    if (!isset($_GET['id'])) {
        $response["message"] = "Schedule ID is required.";
        echo json_encode($response);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM doctor_schedules WHERE id = :id");
    $success = $stmt->execute([":id" => $_GET['id']]);

    if ($success) {
        $response["success"] = true;
        $response["message"] = "Schedule deleted successfully.";
    } else {
        $response["message"] = "Failed to delete schedule.";
    }
} catch (PDOException $e) {
    $response["message"] = "Database error: " . $e->getMessage();
}

echo json_encode($response);
