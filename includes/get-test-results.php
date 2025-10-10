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
    // SQL query to fetch the test results from the database, excluding patients who already have prescriptions
    $stmt = $pdo->prepare("SELECT lab.id,
                                  lab.patient_id,
                                  lab.name,
                                  p.first_name AS patient_first_name,
                                  p.last_name AS patient_last_name,
                                  d.first_name AS doctor_first_name,
                                  d.last_name AS doctor_last_name,
                                  lab.date,
                                  lab.status,
                                  lab.type
                           FROM laboratory_tests lab
                           LEFT JOIN patients p ON lab.patient_id = p.id
                           LEFT JOIN doctors d ON lab.doctor = d.id
                           WHERE lab.patient_id NOT IN (
                               SELECT DISTINCT patient_id FROM prescriptions
                           )");

    // Execute the query
    $stmt->execute();

    // Fetch all the results
    $testResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if any results were fetched
    if ($testResults) {
        // Return the results in JSON format
        echo json_encode(["success" => true, "testResults" => $testResults]);
    } else {
        // No test results found
        echo json_encode(["success" => true, "testResults" => []]);
    }

} catch (PDOException $e) {
    // Log the error for debugging purposes (optional)
    error_log("Error fetching test results: " . $e->getMessage());

    // Return an error message in JSON format
    echo json_encode(["success" => false, "message" => "❌ Error fetching test results: " . $e->getMessage()]);
}
?>
