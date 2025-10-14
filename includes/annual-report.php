<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $year = isset($_GET['year']) ? $_GET['year'] : null; // Expected format: YYYY

    try {
        // Get total patients for the year
        $query = "SELECT COUNT(DISTINCT patient_id) as total FROM laboratory_tests WHERE YEAR(date) = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $totalPatients = $stmt->fetch()['total'];

        // Get total lab tests for the year
        $query = "SELECT COUNT(*) as total FROM laboratory_tests WHERE YEAR(date) = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $totalLabTests = $stmt->fetch()['total'];

        // Get total prescriptions for the year
        $query = "SELECT COUNT(*) as total FROM prescriptions WHERE YEAR(created_at) = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $totalPrescriptions = $stmt->fetch()['total'];

        // Get total bills for the year
        $query = "SELECT COUNT(*) as total FROM bills WHERE YEAR(date) = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $totalBills = $stmt->fetch()['total'];

        // Get total revenue for the year (paid bills only)
        $query = "SELECT SUM(amount) as total FROM bills WHERE status = 'paid' AND YEAR(date) = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $totalRevenue = $stmt->fetch()['total'] ?? 0;

        // Get yearly totals by month for charts
        $query = "
            SELECT
                DATE_FORMAT(date, '%Y-%m') as month,
                COUNT(*) as bills_count,
                SUM(amount) as monthly_revenue
            FROM bills
            WHERE YEAR(date) = ?
            GROUP BY DATE_FORMAT(date, '%Y-%m')
            ORDER BY month
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $yearlyTotals = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get lab tests details for the year
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
            WHERE YEAR(lab.date) = ?
            ORDER BY lab.date DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $labTests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get prescriptions details for the year
        $query = "
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                COUNT(pr.id) as medicines,
                DATE_FORMAT(pr.created_at, '%Y-%m') as prescription_month
            FROM prescriptions pr
            LEFT JOIN patients p ON pr.patient_id = p.id
            LEFT JOIN doctors d ON pr.doctor_id = d.id
            WHERE YEAR(pr.created_at) = ?
            GROUP BY pr.patient_id, pr.doctor_id, DATE_FORMAT(pr.created_at, '%Y-%m')
            ORDER BY pr.created_at DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get bills details for the year
        $query = "
            SELECT
                patient_name,
                amount,
                status,
                DATE_FORMAT(date, '%Y-%m-%d') as bill_date
            FROM bills
            WHERE YEAR(date) = ?
            ORDER BY date DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$year]);
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'totalPatients' => (int)$totalPatients,
                'totalLabTests' => (int)$totalLabTests,
                'totalPrescriptions' => (int)$totalPrescriptions,
                'totalBills' => (int)$totalBills,
                'totalRevenue' => (float)$totalRevenue,
                'yearlyTotals' => $yearlyTotals,
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