<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'db_connect.php';  // Include the database connection file

try {
    // Prepare the SQL query to get all appointments
    $stmt = $pdo->prepare("SELECT a.id, p.first_name AS patient_name, p.last_name AS patient_lastname, d.first_name AS doctor_name, d.last_name AS doctor_lastname, a.department, a.date, a.time, a.reason
                           FROM appointments a
                           JOIN patients p ON a.patient_id = p.id
                           JOIN doctors d ON a.doctor_id = d.id");
    $stmt->execute();

    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($appointments) {
        echo json_encode([
            "success" => true,
            "appointments" => $appointments
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No appointments found."
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
