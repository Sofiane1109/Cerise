<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('INDEX', true);
require 'inc/dbcon.php';
require 'inc/base.php';

$input = json_decode(file_get_contents("php://input"), true);

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    deliver_JSONresponse([
        "status" => 400,
        "data" => "Username en password zijn verplicht"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT user_id, username, password_hash
    FROM users
    WHERE LOWER(username) = LOWER(?)
    LIMIT 1
");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    deliver_JSONresponse([
        "status" => 401,
        "data" => "Ongeldige login"
    ]);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password_hash'])) {
    deliver_JSONresponse([
        "status" => 401,
        "data" => "Ongeldige login"
    ]);
    exit;
}

deliver_JSONresponse([
    "status" => 200,
    "data" => [
        "user_id" => (int)$user['user_id'],
        "username" => $user['username']
    ]
]);
exit;
