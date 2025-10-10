<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

try {
    // Get the incoming POST data
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if the necessary parameters are provided
    if (isset($data['id']) && isset($data['stock_quantity'])) {
        $medicineId = $data['id'];
        $newStockQuantity = $data['stock_quantity'];

        // Validate that the stock quantity is a valid number (must be non-negative)
        if ($newStockQuantity >= 0) {
            // Prepare the SQL query to update the stock quantity
            $stmt = $pdo->prepare("UPDATE medicines SET stock_quantity = ? WHERE id = ?");

            // Execute the query
            if ($stmt->execute([$newStockQuantity, $medicineId])) {
                // Return success response
                echo json_encode(["success" => true, "message" => "Stock updated successfully."]);
            } else {
                // Error in execution
                echo json_encode(["success" => false, "message" => "Failed to update stock."]);
            }
        } else {
            // Invalid stock quantity
            echo json_encode(["success" => false, "message" => "Invalid stock quantity. It should be a non-negative number."]);
        }
    } else {
        // Missing parameters
        echo json_encode(["success" => false, "message" => "Missing required parameters (id, stock_quantity)."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
