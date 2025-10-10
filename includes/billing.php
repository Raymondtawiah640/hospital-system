<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Fetch bills with pagination
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $offset = ($page - 1) * $limit;

            // Get total count
            $countStmt = $pdo->query("SELECT COUNT(*) as total FROM bills");
            $totalItems = $countStmt->fetch()['total'];
            $totalPages = ceil($totalItems / $limit);

            // Get bills
            $stmt = $pdo->prepare("SELECT * FROM bills ORDER BY date DESC LIMIT :limit OFFSET :offset");
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $bills = $stmt->fetchAll();

            echo json_encode([
                'bills' => $bills,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => $totalPages,
                    'totalItems' => $totalItems,
                    'itemsPerPage' => $limit
                ]
            ]);
            break;

        case 'POST':
            // Create new bill
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO bills (invoice_number, patient_name, doctor_name, amount, date, status) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['invoice_number'],
                $data['patient_name'],
                $data['doctor_name'],
                $data['amount'],
                $data['date'],
                $data['status']
            ]);

            echo json_encode(['success' => true, 'message' => 'Bill created successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>