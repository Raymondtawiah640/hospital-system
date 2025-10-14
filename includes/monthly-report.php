<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $month = isset($_GET['month']) ? $_GET['month'] : null; // Expected format: YYYY-MM

    try {
        // Get total patients for the month
        $query = "SELECT COUNT(DISTINCT patient_id) as total FROM laboratory_tests WHERE DATE_FORMAT(date, '%Y-%m') = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $totalPatients = $stmt->fetch()['total'];

        // Get total lab tests for the month
        $query = "SELECT COUNT(*) as total FROM laboratory_tests WHERE DATE_FORMAT(date, '%Y-%m') = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $totalLabTests = $stmt->fetch()['total'];

        // Get total prescriptions for the month
        $query = "SELECT COUNT(*) as total FROM prescriptions WHERE DATE_FORMAT(created_at, '%Y-%m') = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $totalPrescriptions = $stmt->fetch()['total'];

        // Get total bills for the month
        $query = "SELECT COUNT(*) as total FROM bills WHERE DATE_FORMAT(date, '%Y-%m') = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $totalBills = $stmt->fetch()['total'];

        // Get total revenue for the month (paid bills only)
        $query = "SELECT SUM(amount) as total FROM bills WHERE status = 'paid' AND DATE_FORMAT(date, '%Y-%m') = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $totalRevenue = $stmt->fetch()['total'] ?? 0;

        // Get monthly totals by day for charts
        $query = "
            SELECT
                DATE_FORMAT(date, '%Y-%m-%d') as date,
                COUNT(*) as bills_count,
                SUM(amount) as daily_revenue
            FROM bills
            WHERE DATE_FORMAT(date, '%Y-%m') = ?
            GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
            ORDER BY date
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $monthlyTotals = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get lab tests details for the month
        $query = "
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                lab.name as test_name,
                lab.status,
                lab.type,
                DATE_FORMAT(lab.date, '%Y-%m-%d') as test_date
            FROM laboratory_tests lab
            LEFT JOIN patients p ON lab.patient_id = p.id
            LEFT JOIN doctors d ON lab.doctor = d.id
            WHERE DATE_FORMAT(lab.date, '%Y-%m') = ?
            ORDER BY lab.date DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $labTests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get prescriptions details for the month
        $query = "
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                COUNT(pr.id) as medicines,
                DATE_FORMAT(pr.created_at, '%Y-%m-%d') as prescription_date
            FROM prescriptions pr
            LEFT JOIN patients p ON pr.patient_id = p.id
            LEFT JOIN doctors d ON pr.doctor_id = d.id
            WHERE DATE_FORMAT(pr.created_at, '%Y-%m') = ?
            GROUP BY pr.patient_id, pr.doctor_id, DATE_FORMAT(pr.created_at, '%Y-%m-%d')
            ORDER BY pr.created_at DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get bills details for the month
        $query = "
            SELECT
                patient_name,
                amount,
                status,
                DATE_FORMAT(date, '%Y-%m-%d') as bill_date
            FROM bills
            WHERE DATE_FORMAT(date, '%Y-%m') = ?
            ORDER BY date DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$month]);
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'totalPatients' => (int)$totalPatients,
                'totalLabTests' => (int)$totalLabTests,
                'totalPrescriptions' => (int)$totalPrescriptions,
                'totalBills' => (int)$totalBills,
                'totalRevenue' => (float)$totalRevenue,
                'monthlyTotals' => $monthlyTotals,
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