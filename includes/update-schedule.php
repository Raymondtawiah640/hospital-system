<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$response = ["success" => false];

try {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['id'])) {
        $response["message"] = "Schedule ID is required.";
        echo json_encode($response);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE doctor_schedules 
        SET day = :day, start_time = :start_time, end_time = :end_time, department = :department
        WHERE id = :id
    ");

    $success = $stmt->execute([
        ':day' => $input['day'],
        ':start_time' => $input['start_time'],
        ':end_time' => $input['end_time'],
        ':department' => $input['department'],
        ':id' => $input['id']
    ]);

    if ($success) {
        $response["success"] = true;
        $response["message"] = "Schedule updated successfully.";
    } else {
        $response["message"] = "Failed to update schedule.";
    }
} catch (PDOException $e) {
    $response["message"] = "Database error: " . $e->getMessage();
}

echo json_encode($response);
