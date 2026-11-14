<?php
/**
 * StickForge 2D - Central API Configuration & Helper Utilities
 * Compatible with PHP 7.4+ through PHP 8.4+
 */

// Disable direct HTML error rendering for clean JSON output
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Load environment variables from .env if present
function sf_load_env() {
    $envFiles = [
        dirname(__DIR__) . '/.env',
        dirname(__DIR__) . '/config/.env'
    ];

    foreach ($envFiles as $file) {
        if (file_exists($file) && is_readable($file)) {
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || $line[0] === '#') continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $val = trim($parts[1]);
                    // Strip surrounding quotes
                    $val = preg_replace('/^([\'"])(.*)\1$/', '$2', $val);
                    if (!isset($_SERVER[$key]) && !isset($_ENV[$key])) {
                        putenv("{$key}={$val}");
                        $_ENV[$key] = $val;
                        $_SERVER[$key] = $val;
                    }
                }
            }
            break;
        }
    }
}
sf_load_env();

// Get an environment variable with default fallback
function sf_env($key, $default = '') {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    return $default;
}

// Send standard CORS headers
function sf_cors_headers() {
    $origin = sf_env('CORS_ALLOWED_ORIGIN', '*');
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With");
    header("Access-Control-Max-Age: 86400");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Standard JSON response
function sf_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Standard JSON error response
function sf_json_error($message, $statusCode = 400, $extra = []) {
    $response = array_merge([
        'ok' => false,
        'error' => $message,
        'status' => $statusCode
    ], $extra);
    sf_json_response($response, $statusCode);
}

// Extract JSON payload from incoming POST request
function sf_get_json_input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

// Resolve API Key: Checks client request headers/params first (BYOK), then Amazon Aurora RDS, then local .env
function sf_get_api_key($provider, $clientProvidedKey = '') {
    $allowByok = filter_var(sf_env('ALLOW_CLIENT_BYOK', 'true'), FILTER_VALIDATE_BOOLEAN);

    // 1. Check client-supplied key if BYOK is allowed
    if ($allowByok) {
        $customHeader = '';
        if (isset($_SERVER['HTTP_X_API_KEY']) && !empty(trim($_SERVER['HTTP_X_API_KEY']))) {
            $customHeader = trim($_SERVER['HTTP_X_API_KEY']);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
            $customHeader = trim($m[1]);
        }

        if (!empty($clientProvidedKey)) return trim($clientProvidedKey);
        if (!empty($customHeader)) return $customHeader;
    }

    // 2. Check Amazon Aurora RDS database if configured
    if (file_exists(__DIR__ . '/rds.php')) {
        require_once __DIR__ . '/rds.php';
        if (StickForgeRDS::isConfigured()) {
            $rdsKey = StickForgeRDS::getApiKey($provider);
            if (!empty($rdsKey)) {
                return $rdsKey;
            }
        }
    }

    // 3. Fall back to local server configured keys (.env)
    switch (strtolower($provider)) {
        case 'gemini':
        case 'google':
            return sf_env('GEMINI_API_KEY', sf_env('GOOGLE_API_KEY', ''));
        case 'openai':
            return sf_env('OPENAI_API_KEY', '');
        case 'elevenlabs':
            return sf_env('ELEVENLABS_API_KEY', '');
        default:
            return '';
    }
}

// Robust cURL Request Helper
function sf_curl_request($url, $method = 'GET', $headers = [], $body = null, $timeout = 45) {
    if (!extension_loaded('curl')) {
        return [
            'ok' => false,
            'status' => 500,
            'error' => 'cURL PHP extension is not installed or enabled on this server.',
            'body' => null
        ];
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $formattedHeaders = [];
    foreach ($headers as $k => $v) {
        if (is_numeric($k)) {
            $formattedHeaders[] = $v;
        } else {
            $formattedHeaders[] = "{$k}: {$v}";
        }
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $formattedHeaders);

    $method = strtoupper($method);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($body) ? json_encode($body) : $body);
        }
    } elseif ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($body) ? json_encode($body) : $body);
        }
    }

    $responseBody = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);

    if ($curlErrno !== 0) {
        return [
            'ok' => false,
            'status' => 0,
            'error' => "cURL Network Error ({$curlErrno}): {$curlError}",
            'body' => null
        ];
    }

    return [
        'ok' => ($httpCode >= 200 && $httpCode < 300),
        'status' => $httpCode,
        'error' => ($httpCode >= 400) ? "HTTP Error {$httpCode}" : null,
        'body' => $responseBody
    ];
}

// Storage path resolver
function sf_get_projects_dir() {
    $configured = sf_env('PROJECTS_STORAGE_PATH', '../data/projects');
    $path = ($configured[0] === '/' || (strlen($configured) > 2 && $configured[1] === ':'))
        ? $configured
        : __DIR__ . '/' . $configured;

    if (!is_dir($path)) {
        @mkdir($path, 0755, true);
    }
    return realpath($path) ?: $path;
}
