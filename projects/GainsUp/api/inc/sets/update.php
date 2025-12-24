<?php
// --- "update" een concert  
// session_id", "exercise_id", "set_number", "reps", "weight
check_required_fields(["session_id", "exercise_id","set_number","reps","weight", "notes"]);

if(!$stmt = $conn->prepare("
    UPDATE sets 
    SET session_id = ?, exercise_id = ?, set_number = ?, reps = ?, weight = ?, notes = ?
    WHERE id = ?
")){
    die('{"error":"Prepared Statement failed on prepare",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}

// bind parameters
if(!$stmt->bind_param("iiiids",
    $postvars['session_id'],
    $postvars['exercise_id'],
    $postvars['set_number'],
    $postvars['reps'],
    $postvars['weight'],
    $postvars['notes']
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

die('{"data":"ok","message":"Record updated successfully","status":200}');
?>
