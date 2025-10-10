<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || empty($data['name']) || !isset($data['price']) || !isset($data['stock_quantity'])) {
    echo json_encode(['success' => false, 'message' => 'ID, name, price, and stock_quantity are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE medicines SET name = :name, price = :price, stock_quantity = :stock_quantity, description = :description WHERE id = :id");
    $stmt->bindParam(':id', $data['id']);
    $stmt->bindParam(':name', $data['name']);
    $stmt->bindParam(':price', $data['price']);
    $stmt->bindParam(':stock_quantity', $data['stock_quantity']);
    $stmt->bindParam(':description', $data['description']);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Medicine updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update medicine.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>