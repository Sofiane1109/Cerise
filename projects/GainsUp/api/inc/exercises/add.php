<?php
// --- "add" een sets  

// Zijn de nodige parameters meegegeven in de request?
check_required_fields(["name", "muscle_group"]);

if(!$stmt = $conn->prepare("
    INSERT INTO sets (session_id, exercise_id, set_number, reps, weight) 
    VALUES (?, ?, ?, ?, ?)
")){
    die('{"error":"Prepared Statement failed on prepare",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}


if(!$stmt->bind_param("iiiid",
    $postvars['session_id'],
    $postvars['exercise_id'],
    $postvars['set_number'],
    $postvars['reps'],
    $postvars['weight']
)){
    die('{"error":"Prepared Statement bind failed on bind",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}

$stmt->execute();

if($conn->affected_rows == 0) {
    $stmt->close();
    die('{"error":"Prepared Statement failed on execute : no rows affected",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}

$stmt->close();

// laatst toegevoegde ID
$id = $conn->insert_id;

die('{"data":"ok","message":"Record added successfully","status":200, "id": ' . $id . '}');
?>
