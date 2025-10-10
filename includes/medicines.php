<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';  // Include the PDO database connection

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Get pagination parameters
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countStmt = $pdo->query("SELECT COUNT(*) as total FROM medicines");
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        $totalPages = ceil($total / $limit);

        // Prepare the SQL query to fetch medicines with pagination
        $sql = "SELECT * FROM `medicines` LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);

        // Execute the query
        $stmt->execute();

        // Check if any results were found
        if ($stmt->rowCount() > 0) {
            // Initialize an array to hold the results
            $medicines = [];

            // Fetch all rows and store in the array
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $medicines[] = [
                    'id' => $row["id"],
                    'name' => $row["name"],
                    'price' => $row["price"],
                    'stock_quantity' => $row["stock_quantity"],
                    'description' => $row["description"] ?? null,  // Handle NULL values for description
                    'created_at' => $row["created_at"]
                ];
            }

            // Return the JSON response with pagination info
            echo json_encode([
                'medicines' => $medicines,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => $totalPages,
                    'totalItems' => $total,
                    'itemsPerPage' => $limit
                ]
            ]);
        } else {
            echo json_encode([
                'medicines' => [],
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => $totalPages,
                    'totalItems' => $total,
                    'itemsPerPage' => $limit
                ]
            ]);
        }
    } catch (PDOException $e) {
        // Return the error in JSON format
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Add new medicine
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['name']) || !isset($data['price']) || !isset($data['stock_quantity'])) {
        echo json_encode(['success' => false, 'message' => 'Name, price, and stock_quantity are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO medicines (name, price, stock_quantity, description) VALUES (:name, :price, :stock_quantity, :description)");
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':price', $data['price']);
        $stmt->bindParam(':stock_quantity', $data['stock_quantity']);
        $stmt->bindParam(':description', $data['description']);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Medicine added successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add medicine.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Method not allowed.']);
}
?>
