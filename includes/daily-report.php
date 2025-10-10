<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $date = isset($_GET['date']) ? $_GET['date'] : null;

    try {
        // Get total patients (unique patients with activities)
        $query = "SELECT COUNT(DISTINCT patient_id) as total FROM laboratory_tests";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(date) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $totalPatients = $stmt->fetch()['total'];

        // Get total lab tests
        $query = "SELECT COUNT(*) as total FROM laboratory_tests";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(date) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $totalLabTests = $stmt->fetch()['total'];

        // Get total prescriptions
        $query = "SELECT COUNT(*) as total FROM prescriptions";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(created_at) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $totalPrescriptions = $stmt->fetch()['total'];

        // Get total bills
        $query = "SELECT COUNT(*) as total FROM bills";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(date) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $totalBills = $stmt->fetch()['total'];

        // Get total revenue
        $query = "SELECT SUM(amount) as total FROM bills WHERE status = 'paid'";
        $params = [];
        if ($date) {
            $query .= " AND DATE(date) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $totalRevenue = $stmt->fetch()['total'] ?? 0;

        // Get lab tests details
        $query = "
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                lab.name as test_name,
                lab.status,
                lab.type
            FROM laboratory_tests lab
            LEFT JOIN patients p ON lab.patient_id = p.id
            LEFT JOIN doctors d ON lab.doctor = d.id
        ";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(lab.date) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $labTests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get prescriptions details
        $query = "
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                COUNT(pr.id) as medicines
            FROM prescriptions pr
            LEFT JOIN patients p ON pr.patient_id = p.id
            LEFT JOIN doctors d ON pr.doctor_id = d.id
        ";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(pr.created_at) = ?";
            $params[] = $date;
        }
        $query .= " GROUP BY pr.patient_id, pr.doctor_id";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get bills details
        $query = "
            SELECT
                patient_name,
                amount,
                status
            FROM bills
        ";
        $params = [];
        if ($date) {
            $query .= " WHERE DATE(date) = ?";
            $params[] = $date;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'totalPatients' => (int)$totalPatients,
                'totalLabTests' => (int)$totalLabTests,
                'totalPrescriptions' => (int)$totalPrescriptions,
                'totalBills' => (int)$totalBills,
                'totalRevenue' => (float)$totalRevenue,
                'labTests' => $labTests,
                'prescriptions' => $prescriptions,
                'bills' => $bills
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>