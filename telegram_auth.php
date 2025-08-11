<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Content-Type: application/json");

$bot_token = "8244598423:AAEOFyBM3ljSJO2S6mSIBFpuDAuv5LN4Bfk";

// Тут можно хранить авторизованных пользователей в сессии или БД
session_start();

// Получаем user_id (должен быть после проверки в telegram_web_auth.php)
$user_id = $_POST['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(["ok" => false, "error" => "No user ID"]);
    exit;
}

// В реальном приложении тут проверка в базе
$_SESSION['user_id'] = $user_id;

echo json_encode(["ok" => true, "message" => "User authenticated"]);
