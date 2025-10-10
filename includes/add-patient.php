<?php
// ----------------- DEBUG & ERROR -----------------
ini_set('display_errors', 1); // Keep errors visible during development
ini_set('display_startup_errors', 1); // Show startup errors for troubleshooting
ini_set('log_errors', 1); // Log errors to a file
ini_set('error_log', '/var/log/apache2/php_errors.log'); // Log errors to the Apache error log
error_reporting(E_ALL); // Report all errors

// ----------------- HEADERS -----------------
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// If the request is OPTIONS (pre-flight check), we respond immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No content
    exit;
}

// ----------------- DB CONNECTION -----------------
require_once 'db_connect.php';
if (!isset($pdo)) {
    error_log("DEBUG: PDO not set after db_connect.php");
    http_response_code(500);  // Server error
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

// ----------------- INPUT -----------------
$inputJSON = file_get_contents("php://input");
if ($inputJSON === false) {
    error_log("DEBUG: Failed to read php://input");
    http_response_code(400); // Bad request
    echo json_encode(["success" => false, "message" => "❌ Failed to read request data."]);
    exit;
}

$input = json_decode($inputJSON, true);
if ($input === null) {
    error_log("DEBUG: JSON decode failed: " . json_last_error_msg());
    http_response_code(400); // Bad request
    echo json_encode(["success" => false, "message" => "❌ Invalid JSON input."]);
    exit;
}

// ----------------- EXTRACT PATIENT DATA -----------------
$first_name        = trim($input['first_name'] ?? '');
$last_name         = trim($input['last_name'] ?? '');
$ghana_card_number = trim($input['ghana_card_number'] ?? '');
$date_of_birth     = trim($input['date_of_birth'] ?? '');
$gender            = trim($input['gender'] ?? '');
$blood_group       = trim($input['blood_group'] ?? '');
$phone_number      = trim($input['phone_number'] ?? '');
$email             = trim($input['email'] ?? '');
$residential_addr  = trim($input['residential_addr'] ?? '');
$emergency_name    = trim($input['emergency_name'] ?? '');
$emergency_phone   = trim($input['emergency_phone'] ?? '');

// Check for missing required fields
if (empty($first_name) || empty($last_name) || empty($ghana_card_number) || empty($date_of_birth) || 
    empty($gender) || empty($blood_group) || empty($phone_number) || empty($email) || 
    empty($residential_addr) || empty($emergency_name) || empty($emergency_phone)) {
    http_response_code(400); // Bad request
    echo json_encode(["success" => false, "message" => "⚠️ All fields are required."]);
    exit;
}

try {
    // ----------------- INSERT PATIENT DATA -----------------
    $stmt = $pdo->prepare("INSERT INTO patients (first_name, last_name, ghana_card_number, date_of_birth, gender, blood_group, phone_number, email, residential_address, emergency_name, emergency_phone) 
                          VALUES (:first_name, :last_name, :ghana_card_number, :date_of_birth, :gender, :blood_group, :phone_number, :email, :residential_addr, :emergency_name, :emergency_phone)");

    $stmt->execute([
        ':first_name'        => $first_name,
        ':last_name'         => $last_name,
        ':ghana_card_number' => $ghana_card_number,
        ':date_of_birth'     => $date_of_birth,
        ':gender'            => $gender,
        ':blood_group'       => $blood_group,
        ':phone_number'      => $phone_number,
        ':email'             => $email,
        ':residential_addr'  => $residential_addr,
        ':emergency_name'    => $emergency_name,
        ':emergency_phone'   => $emergency_phone
    ]);

    // ----------------- SUCCESS -----------------
    echo json_encode(["success" => true, "message" => "✅ Patient added successfully"]);

} catch (PDOException $e) {
    // Handle database errors
    error_log("DB ERROR in add-patient.php: " . $e->getMessage());
    http_response_code(500); // Internal server error
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
} catch (Exception $e) {
    // Handle general errors
    error_log("GENERAL ERROR in add-patient.php: " . $e->getMessage());
    http_response_code(500); // Internal server error
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
}
?>
