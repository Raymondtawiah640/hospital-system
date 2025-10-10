<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Fetch prescriptions with medicine details and prices
            $patient_id = isset($_GET['patient_id']) ? $_GET['patient_id'] : null;
            $patient_name = isset($_GET['patient_name']) ? $_GET['patient_name'] : null;
            $all = isset($_GET['all']) ? $_GET['all'] : null;

            $sql = "SELECT prescriptions.id, prescriptions.doctor_id, prescriptions.patient_id,
                           prescriptions.dosage, prescriptions.instructions,
                           medicines.id as medicine_id, medicines.name AS medicine_name,
                           medicines.price, medicines.stock_quantity,
                           COALESCE(CONCAT(patients.first_name, ' ', patients.last_name), CONCAT('Patient ', prescriptions.patient_id)) as patient_name,
                           COALESCE(CONCAT(doctors.first_name, ' ', doctors.last_name), CONCAT('Doctor ', prescriptions.doctor_id)) as doctor_name
                     FROM `prescriptions`
                     JOIN `medicines` ON prescriptions.medicine_id = medicines.id
                     LEFT JOIN `patients` ON prescriptions.patient_id = patients.id
                     LEFT JOIN `doctors` ON prescriptions.doctor_id = doctors.doctor_id";

            $params = [];
            $conditions = [];

            if ($patient_id && is_numeric($patient_id)) {
                $conditions[] = "prescriptions.patient_id = ?";
                $params[] = $patient_id;
            } elseif ($patient_name) {
                $conditions[] = "CONCAT(patients.first_name, ' ', patients.last_name) = ?";
                $params[] = $patient_name;
            }

            if (!empty($conditions)) {
                $sql .= " WHERE " . implode(" AND ", $conditions);
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug: Log prescriptions data
            error_log("Prescriptions fetched: " . json_encode($prescriptions));

            // Group prescriptions by patient for billing
            $grouped_prescriptions = [];
            foreach ($prescriptions as $prescription) {
                $patient_id = $prescription['patient_id'];
                if (!isset($grouped_prescriptions[$patient_id])) {
                    $grouped_prescriptions[$patient_id] = [
                        'patient_id' => $patient_id,
                        'patient_name' => $prescription['patient_name'],
                        'doctor_name' => $prescription['doctor_name'],
                        'prescriptions' => [],
                        'total_amount' => 0
                    ];
                }
                $grouped_prescriptions[$patient_id]['prescriptions'][] = [
                    'id' => $prescription['id'],
                    'medicine_id' => $prescription['medicine_id'],
                    'medicine_name' => $prescription['medicine_name'],
                    'price' => $prescription['price'],
                    'dosage' => $prescription['dosage'],
                    'instructions' => $prescription['instructions'],
                    'stock_quantity' => $prescription['stock_quantity']
                ];
                $grouped_prescriptions[$patient_id]['total_amount'] += $prescription['price'];
            }

            // Filter out prescriptions for patients who already have bills only when no specific patient_id is requested and not all
            if (!$patient_id && !$all) {
                $filtered_prescriptions = array_filter($grouped_prescriptions, function($prescription) use ($pdo) {
                    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM bills WHERE patient_name = ?");
                    $stmt->execute([$prescription['patient_name']]);
                    $result = $stmt->fetch();
                    return $result['count'] == 0;
                });
                echo json_encode(array_values($filtered_prescriptions));
            } else {
                // For specific patient requests or all, return all prescriptions
                echo json_encode(array_values($grouped_prescriptions));
            }
            break;

        case 'POST':
            // Create new prescription
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
                exit;
            }

            // If medicine name is provided instead of medicine_id, look up the medicine_id
            $medicine_id = $data['medicine_id'] ?? null;
            if (!$medicine_id && isset($data['medicine'])) {
                // Look up medicine by name
                $stmt = $pdo->prepare("SELECT id FROM medicines WHERE name = ?");
                $stmt->execute([$data['medicine']]);
                $medicine = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($medicine) {
                    $medicine_id = $medicine['id'];
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Medicine not found: ' . $data['medicine']]);
                    exit;
                }
            }

            // Use default doctor_id if not provided (you may want to get this from session/auth)
            $doctor_id = $data['doctor_id'] ?? 1; // Default doctor ID

            $stmt = $pdo->prepare("INSERT INTO prescriptions (doctor_id, patient_id, medicine_id, dosage, instructions) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $doctor_id,
                $data['patientId'], // Note: frontend sends patientId, not patient_id
                $medicine_id,
                $data['dosage'],
                $data['instructions']
            ]);

            echo json_encode(['success' => true, 'message' => 'Prescription created successfully']);
            break;

        case 'DELETE':
            // Delete prescription
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Prescription ID required']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM prescriptions WHERE id = ?");
            $stmt->execute([$data['id']]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Prescription deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Prescription not found']);
            }
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
