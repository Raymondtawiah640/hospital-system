<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// DB connection
require 'db_connect.php';

// Check if PDO is set (successful connection)
if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

try {
    // SQL query to fetch patients from the database
    $stmt = $pdo->prepare("
        SELECT
            id,
            first_name,
            last_name,
            ghana_card_number,
            date_of_birth,
            gender,
            blood_group,
            phone_number,
            email,
            residential_address,
            emergency_name,
            emergency_phone,
            created_at
        FROM patients
        ORDER BY created_at DESC
    ");

    // Execute the query
    $stmt->execute();

    // Fetch all the results
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Debug: Check if any results were fetched
    error_log("Fetched patients: " . json_encode($patients));

    // Check if any results were fetched
    if ($patients) {
        // Return the results in JSON format
        echo json_encode(["success" => true, "patients" => $patients]);
    } else {
        // No patients found
        echo json_encode(["success" => true, "patients" => []]);
    }

} catch (PDOException $e) {
    // Log the error for debugging purposes (optional)
    error_log("Error fetching patients: " . $e->getMessage());

    // Return an error message in JSON format
    echo json_encode(["success" => false, "message" => "❌ Error fetching patients: " . $e->getMessage()]);
}
?>
