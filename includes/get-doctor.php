<?php
require_once 'db_connect.php'; // Include the database connection file

header('Content-Type: application/json');

// Fetch all doctors from the database, including doctor_id
$doctorStmt = $pdo->prepare("SELECT id, doctor_id, first_name, last_name FROM doctors");
$doctorStmt->execute();
$doctors = $doctorStmt->fetchAll(PDO::FETCH_ASSOC);  // Fetch data as an associative array

if ($doctors) {
    // If doctors are found, return them as JSON
    echo json_encode(["success" => true, "doctors" => $doctors]);
} else {
    // If no doctors are found, return an error message
    echo json_encode(["success" => false, "message" => "No doctors found."]);
}
?>
