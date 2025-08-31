<?php
// Разрешить CORS, чтобы GitHub Pages мог к тебе стучаться
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Content-Type: application/json");

// Токен твоего бота
$bot_token = "8244598423:AAFLcheRyzJ7ugj2nfCh-LKAaCCB37CTkdc";

// Читаем initData из POST
$init_data = $_POST['initData'] ?? '';
if (!$init_data) {
    echo json_encode(["ok" => false, "error" => "No initData provided"]);
    exit;
}

// Функция проверки подписи из оф. доков Telegram
function checkTelegramAuthorization($auth_data, $bot_token) {
    $check_hash = $auth_data['hash'];
    unset($auth_data['hash']);
    $data_check_arr = [];
    foreach ($auth_data as $key => $value) {
        $data_check_arr[] = "$key=$value";
    }
    sort($data_check_arr);
    $data_check_string = implode("\n", $data_check_arr);
    $secret_key = hash_hmac('sha256', $bot_token, "WebAppData", true);
    $hash = hash_hmac('sha256', $data_check_string, $secret_key);
    return $hash === $check_hash;
}

// Разбираем initData
parse_str($init_data, $auth_data);

// Проверяем
if (!checkTelegramAuthorization($auth_data, $bot_token)) {
    echo json_encode(["ok" => false, "error" => "Invalid hash"]);
    exit;
}

echo json_encode(["ok" => true, "user" => $auth_data]);

