<?php
require_once 'db_connect.php'; // Include database connection

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// Check if the method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method. Requested method: " . $_SERVER['REQUEST_METHOD']]);
    exit;
}

// Read the raw POST data
$inputData = json_decode(file_get_contents('php://input'), true);

// Check if data is received
if (!$inputData) {
    echo json_encode(["success" => false, "message" => "No data received in the POST request"]);
    exit;
}

// Gather input data
$doctorId = isset($inputData['doctorId']) ? $inputData['doctorId'] : '';
$day = isset($inputData['day']) ? $inputData['day'] : '';
$date = isset($inputData['date']) ? $inputData['date'] : '';
$startTime = isset($inputData['startTime']) ? $inputData['startTime'] : '';
$endTime = isset($inputData['endTime']) ? $inputData['endTime'] : '';
$department = isset($inputData['department']) ? $inputData['department'] : '';

// Validate input
if (empty($doctorId) || empty($day) || empty($date) || empty($startTime) || empty($endTime) || empty($department)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

// Insert the schedule into the database including the date
$stmt = $pdo->prepare("INSERT INTO doctor_schedules (doctor_id, day, schedule_date, start_time, end_time, department) 
                       VALUES (:doctorId, :day, :scheduleDate, :startTime, :endTime, :department)");
$stmt->execute([
    ':doctorId' => $doctorId,
    ':day' => $day,
    ':scheduleDate' => $date,
    ':startTime' => $startTime,
    ':endTime' => $endTime,
    ':department' => $department
]);

// Check if insertion was successful
if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => true, "message" => "Schedule added successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to add schedule."]);
}
?>
