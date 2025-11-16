<?php
// Volgende stukje is om de CORS Preflight te laten werken
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
		// may also be using PUT, PATCH, HEAD etc
		header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
	if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
		header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
	exit(0);
}

// Met de volgende if kan je een test doen om te zien of de request uit je app komt.
// Voor dit voorbeeld is de 'die' uitgeschakeld
if(empty($_SERVER['HTTP_X_REQUESTED_WITH']) || !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
	(strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'be.stevenop'  &&
	strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'be.ophalvens.mijnfantastischeapp')) { 
	// niet van de app
	// zet de volgende lijn in commentaar als je dit in de browser wilt testen
	//die('ID-10T');
} 

if (!defined('INDEX')) {
   die('Error : ID-10T');
}
// --- Step 1: Initialize variables and functions

// Define API response codes and their related HTTP response
$api_response_code = array(0 => array('HTTP Response' => 400, 'Message' => 'Unknown Error'), 1 => array('HTTP Response' => 200, 'Message' => 'Success'), 2 => array('HTTP Response' => 403, 'Message' => 'HTTPS Required'), 3 => array('HTTP Response' => 401, 'Message' => 'Authentication Required'), 4 => array('HTTP Response' => 401, 'Message' => 'Authentication Failed'), 5 => array('HTTP Response' => 404, 'Message' => 'Invalid Request'), 6 => array('HTTP Response' => 400, 'Message' => 'Invalid Response Format'), 7 => array('HTTP Response' => 400, 'Message' => 'DB problems'), 8 => array('HTTP Response' => 400, 'Message' => 'Empty Resultset'));

// Set default HTTP response of 'Unknown Error'
$response['code'] = 0;
$response['status'] = 404;
$response['data'] = NULL;

if (!$conn) {
	// geen DB verbinding, antwoorden naar client!
	$response['code'] = 7;
	$response['status'] = $api_response_code[$response['code']]['HTTP Response'];
	$response['data'] = mysqli_connect_error();
	deliver_response($response);
}

// --- Step 2: Authorization

// Require connections to be made via HTTPS
// Disable this if your server is not using HTTPS
if ($_SERVER['HTTPS'] != 'on') {
	$response['code'] = 2;
	$response['status'] = $api_response_code[$response['code']]['HTTP Response'];
	$response['data'] = $api_response_code[$response['code']]['Message'];
	deliver_response($response);
}
// gegevens ophalen uit de body!

$body = file_get_contents('php://input');
$postvars = json_decode($body, true);


// Voorlopig gaat de request goed, we zetten de response code hier op 1
// Hier kan je eventueel eerst controle doen op meegeleverde credentials, als je dat wilt.
// In dat geval de $response['code] pas zetten na die test!
$response['code'] = 1;
$response['status'] = $api_response_code[$response['code']]['HTTP Response'];

function deliver_response(&$api_response) {
	// Define HTTP responses
	$http_response_code = array(200 => 'OK', 400 => 'Bad Request', 401 => 'Unauthorized', 403 => 'Forbidden', 404 => 'Not Found');
	// Set HTTP Response
	header('HTTP/1.1 ' . $api_response['status'] . ' ' . $http_response_code[$api_response['status']]);
	// Set HTTP Response Content Type
	header('Content-Type: application/json; charset=utf-8');
	// Format data into a JSON response
	$json_response = json_encode($api_response, JSON_UNESCAPED_UNICODE);
	// Deliver formatted data
	echo $json_response;
	// End script process
	exit;
}

function deliver_JSONresponse(&$api_response) {
	// Define HTTP responses
	$http_response_code = array(200 => 'OK', 400 => 'Bad Request', 401 => 'Unauthorized', 403 => 'Forbidden', 404 => 'Not Found');
	// Set HTTP Response
	header('HTTP/1.1 ' . $api_response['status'] . ' ' . $http_response_code[$api_response['status']]);
	// Set HTTP Response Content Type
	header('Content-Type: application/json; charset=utf-8');
	// Format data into a JSON response
	$json_response =  '{"code":'.$api_response['code'].', "status":'.$api_response['status'].', "data":'.$api_response['data'].'}';
	//$json_response = json_encode($api_response, JSON_UNESCAPED_UNICODE);
	// Deliver formatted data
	echo $json_response;
	// End script process
	exit;
}

/*
	getJsonObjFromResult krijgt een resultset (by reference) en forceert alle
	nummerieke velden naan numerieke waarden, zodat clientside niet nog eens
	moet worden omgezet naar getallen voor velden met getalwaarden.
*/
function getJsonObjFromResult(&$result){
	$fixed = array();
	$typeArray = array(
		MYSQLI_TYPE_TINY, MYSQLI_TYPE_SHORT, MYSQLI_TYPE_INT24,    
		MYSQLI_TYPE_LONG, MYSQLI_TYPE_LONGLONG,
		MYSQLI_TYPE_DECIMAL, 
		MYSQLI_TYPE_FLOAT, MYSQLI_TYPE_DOUBLE );
	$fieldList = array();
	// haal de veldinformatie van de velden in deze resultset op
	while($info = $result->fetch_field()){
		$fieldList[] = $info;
	}
	// haal de data uit de result en pas deze aan als het veld een
	// getaltype zou moeten bevatten
	while ($row = $result -> fetch_assoc()) {
		$fixedRow = array();
		$teller = 0;
		foreach ($row as $key => $value) {
			if (in_array($fieldList[$teller] -> type, $typeArray )) {
				$fixedRow[$key] = 0 + $value;
			} else {
				$fixedRow[$key] = $value;
			}
			$teller++;
		}
		$fixed[] = $fixedRow;
	}
	// geef een json object terug
	return json_encode($fixed, JSON_UNESCAPED_UNICODE);
}

function check_required_field($value, $key) {
	// functie waarmee een globale variabele $missing_fields
	// wordt gevuld met velden die niet in $postvars zitten

	if (!array_key_exists($value, $GLOBALS['postvars'])) {
		array_push($GLOBALS['missing_fields'], $value);
	}
}

// $missing_fields wordt gebruikt om de verplichte parameters
// na te kijken in check_required_field en check_required_fields
$missing_fields = [];

function check_required_fields($required_fields) {
	// functie waarmee een globale variabele $missing_fields
	// wordt gevuld met velden die niet in $postvars zitten

	if (!isset($GLOBALS['postvars'])) {
		die('{"status":400, "ok":false, "message":"Fields missing in request. Send parameters as JSON, within the request body. Refer to the documentation for more information."}');
	}

	array_walk($required_fields, "check_required_field");

	if (count($GLOBALS['missing_fields']) > 0) {
		// neen : die met de melding van de ontbrekende velden
		die('{"status":400, "ok":false, "message":"Fields missing in request", "missing_fields":' . json_encode($GLOBALS['missing_fields']) . '}');
	}
}

/** 
 * Get header Authorization
 * */
function getAuthorizationHeader()
{
	$headers = null;
	if (isset($_SERVER['Authorization'])) {
		$headers = trim($_SERVER["Authorization"]);
	} else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
		$headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
	} elseif (function_exists('apache_request_headers')) {
		$requestHeaders = apache_request_headers();
		// Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
		$requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
		//print_r($requestHeaders);
		if (isset($requestHeaders['Authorization'])) {
			$headers = trim($requestHeaders['Authorization']);
		}
	}
	return $headers;
}

/**
 * get access token from header
 * */
function getBearerToken()
{
	$headers = getAuthorizationHeader();
	// HEADER: Get the access token from the header
	if (!empty($headers)) {
		if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
			return $matches[1];
		}
	}
	return null;
}



?>