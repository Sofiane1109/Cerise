<?php
// --- "update" een concert  
// user_id", "date", "notes
check_required_fields(["user_id","date","notes"]);

if(!$stmt = $conn->prepare("
    UPDATE workout_sessions 
    SET user_id = ?, date = ?, notes = ?
    WHERE id = ?
")){
    die('{"error":"Prepared Statement failed on prepare",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}

// bind parameters
if(!$stmt->bind_param("ssssdii",
    htmlentities($postvars['artiest']),
    $postvars['datum'],
    $postvars['uur'],
    htmlentities($postvars['locatie']),
    $postvars['kostprijs'],
    $postvars['capaciteit'],
    $postvars['id']
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
