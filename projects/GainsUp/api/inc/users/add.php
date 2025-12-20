<?php
check_required_fields(["username", "password"]);

$username = trim($postvars['username']);
$password = trim($postvars['password']);

if ($username === '' || $password === '') {
    die('{"error":"Username en password mogen niet leeg zijn","status":"fail"}');
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);

if(!$stmt = $conn->prepare("
    INSERT INTO users (username, password_hash)
    VALUES (?, ?)
")){
    die('{"error":"Prepared Statement failed on prepare",
         "errNo":' . json_encode($conn->errno) . ',
         "mysqlError":' . json_encode($conn->error) . ',
         "status":"fail"}');
}

if(!$stmt->bind_param("ss", $username, $password_hash)){
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
$id = $conn->insert_id;

die('{"data":"ok","message":"User added successfully","status":200, "id": ' . $id . '}');
?>
