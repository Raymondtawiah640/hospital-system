<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$doctorId = isset($input['doctor_id']) ? $input['doctor_id'] : null;
$scheduleId = isset($input['schedule_id']) ? $input['schedule_id'] : null;

if (!$doctorId || !$scheduleId) {
    echo json_encode(["success" => false, "message" => "Doctor ID and Schedule ID are required"]);
    exit;
}

// Insert attendance for real schedules
try {
    $stmt = $pdo->prepare("
        INSERT INTO doctor_attendance (doctor_id, schedule_id, attended_at) 
        VALUES (:doctorId, :scheduleId, NOW())
    ");
    $stmt->execute([
        ':doctorId' => $doctorId,
        ':scheduleId' => $scheduleId
    ]);

    echo json_encode(["success" => true, "message" => "Attendance recorded successfully"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
