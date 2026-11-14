<?php
/**
 * StickForge 2D - API & Web Server Health Diagnostic Check
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rds.php';
sf_cors_headers();

$storageDir = sf_get_projects_dir();
$storageWritable = is_writable($storageDir);

$hasGemini = !empty(sf_get_api_key('gemini'));
$hasOpenAI = !empty(sf_get_api_key('openai'));
$hasEleven = !empty(sf_get_api_key('elevenlabs'));

$rdsConfigured = StickForgeRDS::isConfigured();
$rdsTest = $rdsConfigured ? StickForgeRDS::testConnection() : ['ok' => false, 'configured' => false];

sf_json_response([
    'ok' => true,
    'app' => 'StickForge 2D Studio',
    'version' => '5.0-web',
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'CLI / Unknown',
    'curl_installed' => extension_loaded('curl'),
    'json_installed' => extension_loaded('json'),
    'pdo_pgsql_installed' => extension_loaded('pdo_pgsql'),
    'pdo_mysql_installed' => extension_loaded('pdo_mysql'),
    'storage' => [
        'path' => $storageDir,
        'exists' => is_dir($storageDir),
        'writable' => $storageWritable
    ],
    'aurora_rds' => [
        'configured' => $rdsConfigured,
        'connected' => (bool)($rdsTest['ok'] ?? false),
        'engine' => StickForgeRDS::getEngine(),
        'host' => StickForgeRDS::getHost(),
        'port' => StickForgeRDS::getPort(),
        'region' => StickForgeRDS::getRegion(),
        'latency_ms' => $rdsTest['latency_ms'] ?? null,
        'error' => $rdsTest['error'] ?? null
    ],
    'server_keys' => [
        'gemini' => $hasGemini,
        'openai' => $hasOpenAI,
        'elevenlabs' => $hasEleven
    ],
    'timestamp' => date('c')
]);
