<?php
// --- "Get" alle concerten  
$sql = "select set_id, session_id, exercise_id, set_number, reps, weight, notes FROM sets";

// geen prepared statement nodig, aangezien we geen parameters van de gebruiker verwerken.

$result = $conn->query($sql);

if (!$result) {
    $response['code'] = 7;
    $response['status'] = $api_response_code[$response['code']]['HTTP Response'];
    $response['data'] = $conn->error;
    deliver_response($response);
}

// Vorm de resultset om naar een structuur die we makkelijk kunnen doorgeven
$response['data'] = getJsonObjFromResult($result);

// maak geheugen vrij op de server door de resultset te verwijderen
$result->free();

// sluit de connectie met de databank
$conn->close();

// Return Response to browser
deliver_JSONresponse($response);

exit;
?>
