<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// DB connection
require_once 'db_connect.php';

if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

$inputJSON = file_get_contents("php://input");
if ($inputJSON === false) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "❌ Failed to read request data."]);
    exit;
}

$input = json_decode($inputJSON, true);
if ($input === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "❌ Invalid JSON input."]);
    exit;
}

$staff_id = trim($input['staff_id'] ?? '');
$full_name = trim($input['full_name'] ?? '');
$department = trim($input['department'] ?? '');

if (!$staff_id || !$full_name || !$department) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "⚠️ Staff ID, Full Name, and Department are required."]);
    exit;
}

$validDepartments = ["administration", "nursing", "surgery", "pharmacy", "pediatrics", "laboratory", "finance", "emergency"];
if (!in_array(strtolower($department), $validDepartments)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "⚠️ Invalid department."]);
    exit;
}

try {
    // Check if staff already exists
    $checkStmt = $pdo->prepare("SELECT staff_id FROM staff WHERE staff_id = ?");
    $checkStmt->execute([$staff_id]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "⚠️ Staff ID already exists."]);
        exit;
    }

    // Insert new staff with empty password (will be set on first login)
    $stmt = $pdo->prepare("INSERT INTO staff (staff_id, full_name, department, password) VALUES (?, ?, ?, '')");
    $stmt->execute([$staff_id, $full_name, $department]);

    echo json_encode(["success" => true, "message" => "✅ Staff member added successfully."]);

} catch (PDOException $e) {
    error_log("DB ERROR in add-staff.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
}
?>