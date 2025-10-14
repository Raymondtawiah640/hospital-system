<?php
// ----------------- DEBUG & ERROR -----------------
// Error settings can be enabled during development if needed

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
    http_response_code(500);  // Server error
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

// ----------------- INPUT -----------------
$inputJSON = file_get_contents("php://input");
if ($inputJSON === false) {
    http_response_code(400); // Bad request
    echo json_encode(["success" => false, "message" => "❌ Failed to read request data."]);
    exit;
}

$input = json_decode($inputJSON, true);
if ($input === null) {
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

// Optional: Log received data for debugging (can be removed in production)
error_log("DEBUG add-patient.php - Received data: " . json_encode($input));

// Check for missing required fields (only truly essential fields)
$requiredFields = [
    'first_name' => $first_name,
    'last_name' => $last_name,
    'ghana_card_number' => $ghana_card_number,
    'date_of_birth' => $date_of_birth,
    'gender' => $gender,
    'phone_number' => $phone_number,
    'emergency_name' => $emergency_name,
    'emergency_phone' => $emergency_phone
];

// Optional fields that can be empty
$optionalFields = [
    'blood_group' => $blood_group,
    'email' => $email,
    'residential_addr' => $residential_addr
];

$missingFields = [];
foreach ($requiredFields as $fieldName => $value) {
    if (empty(trim($value))) {
        $missingFields[] = $fieldName;
    }
}

if (!empty($missingFields)) {
    http_response_code(400); // Bad request
    echo json_encode([
        "success" => false,
        "message" => "⚠️ Please fill in all required fields: " . implode(', ', $missingFields) . ". Email, blood group, and address are optional."
    ]);
    exit;
}

try {
    // ----------------- INSERT PATIENT DATA -----------------
    $stmt = $pdo->prepare("INSERT INTO patients (first_name, last_name, ghana_card_number, date_of_birth, gender, blood_group, phone_number, email, residential_address, emergency_name, emergency_phone)
                          VALUES (:first_name, :last_name, :ghana_card_number, :date_of_birth, :gender, :blood_group, :phone_number, :email, :residential_addr, :emergency_name, :emergency_phone)");

    $executeData = [
        ':first_name'        => $first_name,
        ':last_name'         => $last_name,
        ':ghana_card_number' => $ghana_card_number,
        ':date_of_birth'     => $date_of_birth,
        ':gender'            => $gender,
        ':blood_group'       => !empty($blood_group) ? $blood_group : 'N/A',
        ':phone_number'      => $phone_number,
        ':email'             => !empty($email) ? $email : 'N/A',
        ':residential_addr'  => !empty($residential_addr) ? $residential_addr : 'N/A',
        ':emergency_name'    => $emergency_name,
        ':emergency_phone'   => $emergency_phone
    ];

    $stmt->execute($executeData);

    // ----------------- SUCCESS -----------------
    echo json_encode(["success" => true, "message" => "✅ Patient added successfully"]);

} catch(PDOException $e) {
    // Handle database errors
    http_response_code(500); // Internal server error
    echo json_encode(["success" => false, "message" => "❌ Database error occurred."]);
} catch(Exception $e) {
    // Handle general errors
    http_response_code(500); // Internal server error
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
}

?>
