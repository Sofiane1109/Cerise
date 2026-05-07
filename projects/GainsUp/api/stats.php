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

// Connexion DB + base (⚠️ inchangé)
require 'inc/dbcon.php';
require 'inc/base.php';

/**
 * ⚠️ IMPORTANT
 * base.php attend que $response['data'] soit une STRING
 * Donc on encode les arrays en JSON ici
 */
function deliver_stats_response($conn, $response)
{
    if (isset($response['data']) && is_array($response['data'])) {
        $response['data'] = json_encode($response['data'], JSON_UNESCAPED_UNICODE);
    }

    if ($conn) {
        $conn->close();
    }

    deliver_JSONresponse($response);
    exit;
}

// Init response
$response = [
    'code' => 0,
    'status' => 200,
    'data' => null
];

// Only GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $response['code'] = 1;
    $response['status'] = 405;
    $response['data'] = "Method not allowed";
    deliver_stats_response($conn, $response);
}

$action = $_GET['action'] ?? '';

/* =========================
   ACTION: muscles
   ========================= */
if ($action === 'muscles') {

    $sql = "
        SELECT DISTINCT muscle_group AS id, muscle_group AS name
        FROM exercises
        WHERE muscle_group IS NOT NULL AND muscle_group <> ''
        ORDER BY muscle_group
    ";

    $result = $conn->query($sql);
    if (!$result) {
        $response['code'] = 7;
        $response['status'] = 500;
        $response['data'] = $conn->error;
        deliver_stats_response($conn, $response);
    }

    $response['data'] = getJsonObjFromResult($result);
    $result->free();

    deliver_stats_response($conn, $response);
}

/* =========================
   ACTION: exercises
   Param: muscle_group
   ========================= */
if ($action === 'exercises') {

    $muscleGroup = $_GET['muscle_group'] ?? '';
    if ($muscleGroup === '') {
        $response['code'] = 2;
        $response['status'] = 400;
        $response['data'] = "muscle_group required";
        deliver_stats_response($conn, $response);
    }

    $sql = "
        SELECT exercise_id AS id, name
        FROM exercises
        WHERE muscle_group = ?
        ORDER BY name
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        $response['code'] = 7;
        $response['status'] = 500;
        $response['data'] = $conn->error;
        deliver_stats_response($conn, $response);
    }

    $stmt->bind_param("s", $muscleGroup);
    $stmt->execute();
    $result = $stmt->get_result();

    $response['data'] = getJsonObjFromResult($result);

    $result->free();
    $stmt->close();

    deliver_stats_response($conn, $response);
}

/**
 * ACTION: progress
 * Params: exercise_id, user_id, metric (poids_max|reps_max|volume)
 */
if ($action === 'progress') {

    $exerciseId = (int)($_GET['exercise_id'] ?? 0);
    $userId = (int)($_GET['user_id'] ?? 0);
    $metric = $_GET['metric'] ?? 'poids_max';

    if ($exerciseId <= 0) {
        $response['code'] = 2;
        $response['status'] = 400;
        $response['data'] = "exercise_id required";
        deliver_stats_response($conn, $response);
    }

    if ($userId <= 0) {
        $response['code'] = 2;
        $response['status'] = 400;
        $response['data'] = "user_id required";
        deliver_stats_response($conn, $response);
    }

    if ($metric === 'poids_max') {
        $sql = "
            SELECT ws.date AS d, MAX(s.weight) AS v
            FROM sets s
            JOIN workout_sessions ws ON ws.session_id = s.session_id
            WHERE s.exercise_id = ? AND ws.user_id = ?
            GROUP BY ws.date
            ORDER BY ws.date
        ";
    } elseif ($metric === 'reps_max') {
        $sql = "
            SELECT ws.date AS d, MAX(s.reps) AS v
            FROM sets s
            JOIN workout_sessions ws ON ws.session_id = s.session_id
            WHERE s.exercise_id = ? AND ws.user_id = ?
            GROUP BY ws.date
            ORDER BY ws.date
        ";
    } elseif ($metric === 'volume') {
        $sql = "
            SELECT ws.date AS d, SUM(s.weight * s.reps) AS v
            FROM sets s
            JOIN workout_sessions ws ON ws.session_id = s.session_id
            WHERE s.exercise_id = ? AND ws.user_id = ?
            GROUP BY ws.date
            ORDER BY ws.date
        ";
    } else {
        $response['code'] = 2;
        $response['status'] = 400;
        $response['data'] = "metric invalid";
        deliver_stats_response($conn, $response);
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        $response['code'] = 7;
        $response['status'] = 500;
        $response['data'] = $conn->error;
        deliver_stats_response($conn, $response);
    }

    $stmt->bind_param("ii", $exerciseId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $labels = [];
    $values = [];

    while ($row = $result->fetch_assoc()) {
        $labels[] = $row['d'];
        $values[] = (float)$row['v'];
    }

    $response['data'] = [
        'labels' => $labels,
        'values' => $values
    ];

    $result->free();
    $stmt->close();

    deliver_stats_response($conn, $response);
}

/* =========================
   UNKNOWN ACTION
   ========================= */
$response['code'] = 2;
$response['status'] = 400;
$response['data'] = "Unknown action";
deliver_stats_response($conn, $response);
