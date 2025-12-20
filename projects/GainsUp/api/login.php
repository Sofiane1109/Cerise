<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

define('INDEX', true);

require 'inc/dbcon.php';
require 'inc/base.php';

$input = json_decode(file_get_contents("php://input"), true);

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    $response = [
        "code" => 400,
        "status" => 400,
        "data" => "Username en password zijn verplicht"
    ];
    deliver_JSONresponse($response);
    exit;
}

$stmt = $conn->prepare(
    "SELECT user_id, username, password_hash
     FROM users
     WHERE username = ?
     LIMIT 1"
);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $response = [
        "code" => 401,
        "status" => 401,
        "data" => "Ongeldige login"
    ];
    deliver_JSONresponse($response);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password_hash'])) {
    $response = [
        "code" => 401,
        "status" => 401,
        "data" => "Ongeldige login"
    ];
    deliver_JSONresponse($response);
    exit;
}

// ✅ Login OK
$response = [
    "code" => 200,
    "status" => 200,
    "data" => [
        "user_id" => (int)$user['user_id'],
        "username" => $user['username']
    ]
];

deliver_JSONresponse($response);
exit;
