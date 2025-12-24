<?php
define('INDEX', true);

require 'inc/dbcon.php';
require 'inc/base.php';

// On attend un body JSON: { "user_id": 1, "exercise_id": 3, "metric": "max_weight" }
check_required_fields(["user_id", "exercise_id"]);

$user_id = intval($postvars["user_id"]);
$exercise_id = intval($postvars["exercise_id"]);
$metric = $postvars["metric"] ?? "max_weight"; // max_weight | best_1rm | volume

// Choix de la métrique
if ($metric === "best_1rm") {
    // Epley 1RM approx : weight * (1 + reps/30) ; on prend le max par date
    $valueExpr = "MAX(s.weight * (1 + (s.reps / 30)))";
} elseif ($metric === "volume") {
    // volume = somme(weight*reps) par date
    $valueExpr = "SUM(s.weight * s.reps)";
} else {
    // défaut : meilleur poids (max weight) par date
    $valueExpr = "MAX(s.weight)";
}

// Query : un point par date
$sql = "
SELECT 
    ws.date AS label,
    $valueExpr AS value
FROM workout_sessions ws
JOIN sets s ON s.session_id = ws.session_id
WHERE ws.user_id = ?
  AND s.exercise_id = ?
GROUP BY ws.date
ORDER BY ws.date ASC
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    $response['code'] = 7;
    $response['status'] = $api_response_code[$response['code']]['HTTP Response'];
    $response['data'] = json_encode($conn->error);
    deliver_response($response);
}

$stmt->bind_param("ii", $user_id, $exercise_id);
$stmt->execute();
$result = $stmt->get_result();

$response['data'] = getJsonObjFromResult($result);

$result->free();
$stmt->close();
$conn->close();

deliver_JSONresponse($response);
exit;
?>