<?php
// --- "add" een concert  

// Zijn de nodige parameters meegegeven in de request?
check_required_fields(["username"]);

if(!$stmt = $conn->prepare("
    INSERT INTO users (username) 
    VALUES (?)
")){
    die('{"error":"Prepared Statement failed on prepare",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}


if(!$stmt->bind_param("s",
    htmlentities($postvars['username'])
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
