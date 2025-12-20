<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('INDEX', true);

require 'inc/dbcon.php';
require 'inc/base.php';

$input = json_decode(file_get_contents("php://input"), true);

$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if ($username === '' || $password === '') {
    deliver_JSONresponse([
        "code" => 400,
        "status" => 400,
        "data" => "Username en password zijn verplicht"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT user_id, username, password_hash
    FROM users
    WHERE username = ?
    LIMIT 1
");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    deliver_JSONresponse([
        "code" => 401,
        "status" => 401,
        "data" => "Ongeldige login"
    ]);
    exit;
}

$user = $result->fetch_assoc();

deliver_JSONresponse([
  "code" => 999,
  "status" => 200,
  "data" => [
    "received_user" => $username,
    "received_pw_len" => strlen($password),
    "hash_prefix" => substr($user['password_hash'], 0, 4)
  ]
]);
exit;


if (!password_verify($password, $user['password_hash'])) {
    deliver_JSONresponse([
        "code" => 401,
        "status" => 401,
        "data" => "Ongeldige login"
    ]);
    exit;
}

deliver_JSONresponse([
    "code" => 200,
    "status" => 200,
    "data" => [
        "user_id" => (int)$user['user_id'],
        "username" => $user['username']
    ]
]);
exit;
