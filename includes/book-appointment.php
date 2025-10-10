<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once 'db_connect.php';  // Include the database connection file

// Fetch POST data
$data = json_decode(file_get_contents("php://input"));

// Check if the required data is provided
if (
    isset($data->patientId) && isset($data->doctorId) && isset($data->department) &&
    isset($data->date) && isset($data->time) && isset($data->reason)
) {
    $patientId = $data->patientId;
    $doctorId = $data->doctorId;
    $department = $data->department;
    $date = $data->date;
    $time = $data->time;
    $reason = $data->reason;

    try {
        // Prepare SQL to insert the appointment into the database
        $stmt = $pdo->prepare(
            "INSERT INTO appointments (patient_id, doctor_id, department, date, time, reason) 
             VALUES (:patient_id, :doctor_id, :department, :date, :time, :reason)"
        );

        // Bind parameters to the query
        $stmt->bindParam(':patient_id', $patientId, PDO::PARAM_INT);
        $stmt->bindParam(':doctor_id', $doctorId, PDO::PARAM_INT);
        $stmt->bindParam(':department', $department, PDO::PARAM_STR);
        $stmt->bindParam(':date', $date, PDO::PARAM_STR);
        $stmt->bindParam(':time', $time, PDO::PARAM_STR);
        $stmt->bindParam(':reason', $reason, PDO::PARAM_STR);

        // Execute the query
        if ($stmt->execute()) {
            // Return success response if the appointment is booked
            echo json_encode([
                "success" => true,
                "message" => "Appointment booked successfully!"
            ]);
        } else {
            // Return error message if the insert fails
            echo json_encode([
                "success" => false,
                "message" => "Failed to book the appointment. Please try again."
            ]);
        }
    } catch (PDOException $e) {
        // Return error if there is an issue with the database
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ]);
    }
} else {
    // Return error if required data is not provided
    echo json_encode([
        "success" => false,
        "message" => "Incomplete data. Please provide all required fields."
    ]);
}
?>
