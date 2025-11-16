<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

define('INDEX', true);

// --- Step 0 : connect to db
require 'inc/dbcon.php';
require 'inc/base.php';


if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require 'inc/users/get.php';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require 'inc/users/add.php';
    exit;
}

?>
