<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'db_connect.php'; // Include database connection

// Get appointment ID from request body or URL parameter
$data = json_decode(file_get_contents('php://input'), true);
$appointmentId = $data['id'] ?? $_GET['id'] ?? null;

if ($appointmentId) {
    try {
        // Prepare SQL to delete the appointment
        $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = :id");
        $stmt->bindParam(':id', $appointmentId, PDO::PARAM_INT);

        // Execute the deletion
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Appointment deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete appointment."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Appointment ID is required."]);
}
?>
