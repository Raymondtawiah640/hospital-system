<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'db_connect.php';  // Include the database connection file

try {
    // Check if this is a request for appointment history
    $history = isset($_GET['history']) ? $_GET['history'] : null;

    if ($history === 'true') {
        // For appointment history, return ALL appointments including past ones
        $stmt = $pdo->prepare("SELECT a.id, p.first_name AS patient_name, p.last_name AS patient_lastname, d.first_name AS doctor_name, d.last_name AS doctor_lastname, a.department, a.date, a.time, a.reason
                               FROM appointments a
                               JOIN patients p ON a.patient_id = p.id
                               JOIN doctors d ON a.doctor_id = d.id
                               ORDER BY a.date DESC, a.time DESC");
        $stmt->execute();
    } else {
        // For current appointments, only return current and future appointments
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT a.id, p.first_name AS patient_name, p.last_name AS patient_lastname, d.first_name AS doctor_name, d.last_name AS doctor_lastname, a.department, a.date, a.time, a.reason
                               FROM appointments a
                               JOIN patients p ON a.patient_id = p.id
                               JOIN doctors d ON a.doctor_id = d.id
                               WHERE a.date >= :today
                               ORDER BY a.date ASC, a.time ASC");
        $stmt->execute([':today' => $today]);
    }

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
