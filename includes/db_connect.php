<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$dbhost = "localhost"; 
$dbport = "3306";
$dbuser = "dbuser";          
$dbpass = "kilnpassword1";   
$dbname = "Presbyterian_Hospital";

try {
    $pdo = new PDO(
        "mysql:host=$dbhost;port=$dbport;dbname=$dbname;charset=utf8mb4", 
        $dbuser, 
        $dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    // echo "Connected successfully"; // optional for testing
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $e->getMessage()]);
    exit;
}
?>
