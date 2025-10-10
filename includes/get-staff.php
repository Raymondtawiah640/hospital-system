<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// DB connection
require_once 'db_connect.php';

if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

try {
    // Fetch all staff
    $stmt = $pdo->prepare("SELECT staff_id, full_name, department FROM staff ORDER BY staff_id");
    $stmt->execute();
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "staff" => $staff]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "❌ Error fetching staff: " . $e->getMessage()]);
}
?>