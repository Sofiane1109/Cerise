<?php
// ==========================================
// login.php - Backend API voor login (GainsUp)
// ==========================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('INDEX', true);
require_once __DIR__ . '/inc/dbcon.php';

// Alleen POST toelaten
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 405,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// JSON body lezen
$input = json_decode(file_get_contents('php://input'), true);

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'status' => 400,
        'message' => 'Username en wachtwoord zijn verplicht'
    ]);
    exit;
}

// User ophalen (case-insensitive)
$stmt = $conn->prepare("
    SELECT user_id, username, password_hash
    FROM users
    WHERE LOWER(username) = LOWER(?)
    LIMIT 1
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => 'Database error',
        'error' => $conn->error
    ]);
    exit;
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    http_response_code(401);
    echo json_encode([
        'status' => 401,
        'message' => 'Ongeldige inloggegevens'
    ]);
    exit;
}

$user = $result->fetch_assoc();

// Wachtwoord check
if (!password_verify($password, $user['password_hash'])) {
    $stmt->close();
    http_response_code(401);
    echo json_encode([
        'status' => 401,
        'message' => 'Ongeldige inloggegevens'
    ]);
    exit;
}

// Succes: geen hash terugsturen
unset($user['password_hash']);

// (optioneel) token
$token = bin2hex(random_bytes(32));

$stmt->close();

// OK
http_response_code(200);
echo json_encode([
    'status' => 200,
    'message' => 'Login succesvol',
    'user' => [
        'user_id' => (int)$user['user_id'],
        'username' => $user['username']
    ],
    'token' => $token
]);
exit;
