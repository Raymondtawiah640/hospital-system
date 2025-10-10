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

if (!$staff_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "⚠️ Staff ID is required."]);
    exit;
}

try {
    // Check if staff exists
    $checkStmt = $pdo->prepare("SELECT staff_id FROM staff WHERE staff_id = ?");
    $checkStmt->execute([$staff_id]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "❌ Staff member not found."]);
        exit;
    }

    $action = $input['action'] ?? '';

    if ($action === 'reset_password') {
        // Reset password to empty (will require new password on next login)
        $stmt = $pdo->prepare("UPDATE staff SET password = '' WHERE staff_id = ?");
        $stmt->execute([$staff_id]);
        echo json_encode(["success" => true, "message" => "✅ Password reset successfully."]);
    } elseif ($action === 'delete_staff') {
        // Completely delete staff member from system
        $stmt = $pdo->prepare("DELETE FROM staff WHERE staff_id = ?");
        $stmt->execute([$staff_id]);
        echo json_encode(["success" => true, "message" => "✅ Staff member deleted successfully."]);
    } else {
        // Update department
        $department = trim($input['department'] ?? '');
        if (!$department) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "⚠️ Department is required."]);
            exit;
        }

        $validDepartments = ["administration", "nursing", "surgery", "pharmacy", "pediatrics", "laboratory", "finance", "emergency"];
        if (!in_array(strtolower($department), $validDepartments)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "⚠️ Invalid department."]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE staff SET department = ? WHERE staff_id = ?");
        $stmt->execute([$department, $staff_id]);
        echo json_encode(["success" => true, "message" => "✅ Staff department updated successfully."]);
    }

} catch (PDOException $e) {
    error_log("DB ERROR in update-staff.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
}
?>