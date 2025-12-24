<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('INDEX', true);

require_once __DIR__ . '/inc/dbcon.php'; // -> fournit $conn (mysqli)
require_once __DIR__ . '/inc/base.php';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$action = $_GET['action'] ?? '';

try {

    // 1) GROUPES MUSCULAIRES
    if ($action === 'muscles') {
        $sql = "SELECT id, name FROM muscle_groups ORDER BY name";
        $res = mysqli_query($conn, $sql);
        if (!$res) respond(["error" => mysqli_error($conn)], 500);

        $rows = [];
        while ($row = mysqli_fetch_assoc($res)) $rows[] = $row;
        respond($rows);
    }

    // 2) EXERCICES PAR GROUPE
    if ($action === 'exercises') {
        $muscleGroupId = $_GET['muscle_group_id'] ?? '';
        if ($muscleGroupId === '') respond(["error" => "muscle_group_id required"], 400);

        $stmt = mysqli_prepare($conn, "SELECT id, name FROM exercises WHERE muscle_group_id = ? ORDER BY name");
        if (!$stmt) respond(["error" => mysqli_error($conn)], 500);

        mysqli_stmt_bind_param($stmt, "i", $muscleGroupId);
        mysqli_stmt_execute($stmt);
        $res = mysqli_stmt_get_result($stmt);

        $rows = [];
        while ($row = mysqli_fetch_assoc($res)) $rows[] = $row;
        respond($rows);
    }

    // 3) PROGRESSION
    if ($action === 'progress') {
        $exerciseId = $_GET['exercise_id'] ?? '';
        $metric = $_GET['metric'] ?? 'poids_max';
        if ($exerciseId === '') respond(["error" => "exercise_id required"], 400);

        if ($metric === 'poids_max') {
            $sql = "
                SELECT DATE(created_at) AS d, MAX(weight) AS v
                FROM sets
                WHERE exercise_id = ?
                GROUP BY DATE(created_at)
                ORDER BY d ASC
            ";
        } elseif ($metric === 'reps_max') {
            $sql = "
                SELECT DATE(created_at) AS d, MAX(reps) AS v
                FROM sets
                WHERE exercise_id = ?
                GROUP BY DATE(created_at)
                ORDER BY d ASC
            ";
        } elseif ($metric === 'volume') {
            $sql = "
                SELECT DATE(created_at) AS d, SUM(weight * reps) AS v
                FROM sets
                WHERE exercise_id = ?
                GROUP BY DATE(created_at)
                ORDER BY d ASC
            ";
        } else {
            respond(["error" => "metric invalid (poids_max|reps_max|volume)"], 400);
        }

        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) respond(["error" => mysqli_error($conn)], 500);

        mysqli_stmt_bind_param($stmt, "i", $exerciseId);
        mysqli_stmt_execute($stmt);
        $res = mysqli_stmt_get_result($stmt);

        $labels = [];
        $values = [];
        while ($row = mysqli_fetch_assoc($res)) {
            $labels[] = $row['d'];
            $values[] = (float)$row['v'];
        }

        respond(["labels" => $labels, "values" => $values]);
    }

    respond(["error" => "Unknown action"], 400);

} catch (Throwable $e) {
    respond(["error" => $e->getMessage()], 500);
}
