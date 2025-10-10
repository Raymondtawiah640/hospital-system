<?php
require_once 'db_connect.php'; 
header('Content-Type: application/json');

$response = ["success" => false, "message" => "An unexpected error occurred"];

try {
    // 🔹 Get doctorId from GET (optional for all doctors)
    $doctorId = isset($_GET['doctorId']) ? intval($_GET['doctorId']) : null;

    // 🔹 Build base query
    $sql = "
        SELECT 
            ds.id, 
            ds.day, 
            ds.schedule_date AS date,  
            ds.start_time, 
            ds.end_time, 
            ds.department, 
            d.first_name, 
            d.last_name, 
            d.id AS doctor_id,
            CASE
                WHEN ds.schedule_date <= CURDATE()
                THEN 1 ELSE 0
            END AS is_active,
            CASE 
                WHEN da.id IS NOT NULL THEN 1 ELSE 0
            END AS is_attended
        FROM doctor_schedules ds
        JOIN doctors d ON ds.doctor_id = d.id
        LEFT JOIN doctor_attendance da 
            ON da.schedule_id = ds.id";

    // 🔹 Add WHERE clause if doctorId is provided
    if ($doctorId) {
        $sql .= " AND da.doctor_id = :attendanceDoctorId WHERE ds.doctor_id = :scheduleDoctorId";
    }

    $sql .= " ORDER BY ds.id DESC";

    $stmt = $pdo->prepare($sql);

    // 🔹 Execute with or without parameters
    if ($doctorId) {
        $stmt->execute([
            ':attendanceDoctorId' => $doctorId,
            ':scheduleDoctorId'   => $doctorId
        ]);
    } else {
        $stmt->execute();
    }

    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($appointments) {
        $response["success"] = true;
        $response["appointments"] = $appointments;
        $response["schedules"] = $appointments;
    } else {
        $response["message"] = "No schedules or appointments found.";
    }

} catch (PDOException $e) {
    $response["message"] = "Database error: " . $e->getMessage();
}

echo json_encode($response);
?>
