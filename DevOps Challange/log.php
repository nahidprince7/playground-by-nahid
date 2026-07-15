<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$logEntry = [
    'timestamp'  => date('Y-m-d H:i:s'),
    'ip'         => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'referer'    => $_SERVER['HTTP_REFERER'] ?? 'direct',
    'action'     => $input['action'] ?? 'play',
    'stage'      => $input['stage'] ?? 'unknown',
];

$logFile = __DIR__ . '/plays.log';
$line = json_encode($logEntry) . "\n";
file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

echo json_encode(['status' => 'logged']);