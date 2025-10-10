<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// DB connection
require_once 'db_connect.php';

if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (empty($data['doctorId']) || empty($data['ghanaCard']) || empty($data['firstName']) || empty($data['lastName']) ||
    empty($data['dob']) || empty($data['gender']) || empty($data['specialization']) || empty($data['department']) ||
    empty($data['experience']) || empty($data['license']) || empty($data['phone']) || empty($data['email']) || empty($data['address'])) {
    echo json_encode(["success" => false, "message" => "❌ All fields are required."]);
    exit;
}

try {
    // Insert the doctor data into the database
    $stmt = $pdo->prepare("INSERT INTO doctors (doctor_id, ghana_card_number, first_name, last_name, date_of_birth, gender, specialization, department, experience, license_number, phone, email, residential_address)
    VALUES (:doctorId, :ghanaCard, :firstName, :lastName, :dob, :gender, :specialization, :department, :experience, :license, :phone, :email, :address)");

    $stmt->bindParam(':doctorId', $data['doctorId']);
    $stmt->bindParam(':ghanaCard', $data['ghanaCard']);
    $stmt->bindParam(':firstName', $data['firstName']);
    $stmt->bindParam(':lastName', $data['lastName']);
    $stmt->bindParam(':dob', $data['dob']);
    $stmt->bindParam(':gender', $data['gender']);
    $stmt->bindParam(':specialization', $data['specialization']);
    $stmt->bindParam(':department', $data['department']);
    $stmt->bindParam(':experience', $data['experience']);
    $stmt->bindParam(':license', $data['license']);
    $stmt->bindParam(':phone', $data['phone']);
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':address', $data['address']);

    $stmt->execute();

    echo json_encode(["success" => true, "message" => "✔️ Doctor added successfully."]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "❌ Error adding doctor: " . $e->getMessage()]);
}
?>
