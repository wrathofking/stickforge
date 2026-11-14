<?php
/**
 * StickForge 2D - API Keys Management & Aurora RDS Persistence Gateway
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rds.php';
sf_cors_headers();

$input = sf_get_json_input();
$action = $_GET['action'] ?? $input['action'] ?? 'status';

switch ($action) {
    // -------------------------------------------------------------------------
    // 1. Get Status: Storage Provider & Stored Keys Summary
    // -------------------------------------------------------------------------
    case 'status':
        $rdsConfigured = StickForgeRDS::isConfigured();
        $rdsTest = $rdsConfigured ? StickForgeRDS::testConnection() : ['ok' => false, 'configured' => false];

        $hasGemini = !empty(sf_get_api_key('gemini'));
        $hasOpenAI = !empty(sf_get_api_key('openai'));
        $hasEleven = !empty(sf_get_api_key('elevenlabs'));

        $rdsKeys = $rdsTest['ok'] ? StickForgeRDS::getAllKeys() : [];

        sf_json_response([
            'ok' => true,
            'storage_mode' => ($rdsTest['ok'] ? 'aurora_rds' : 'local_env'),
            'rds' => [
                'enabled' => $rdsConfigured,
                'connected' => (bool)($rdsTest['ok'] ?? false),
                'engine' => StickForgeRDS::getEngine(),
                'host' => StickForgeRDS::getHost(),
                'port' => StickForgeRDS::getPort(),
                'region' => StickForgeRDS::getRegion(),
                'latency_ms' => $rdsTest['latency_ms'] ?? null,
                'error' => $rdsTest['error'] ?? null
            ],
            'keys_active' => [
                'gemini' => $hasGemini,
                'openai' => $hasOpenAI,
                'elevenlabs' => $hasEleven
            ],
            'rds_stored_keys' => $rdsKeys
        ]);
        break;

    // -------------------------------------------------------------------------
    // 2. Save API Keys to Amazon Aurora RDS
    // -------------------------------------------------------------------------
    case 'save':
        $geminiKey = trim($input['geminiKey'] ?? $input['llmKey'] ?? '');
        $openaiKey = trim($input['openaiKey'] ?? $input['imgKey'] ?? '');
        $elevenKey = trim($input['elevenlabsKey'] ?? $input['ttsKey'] ?? '');

        if (!StickForgeRDS::isConfigured()) {
            sf_json_error(
                'Amazon Aurora RDS is not configured on this server. Please set AURORA_RDS_HOST and credentials in config/.env.',
                400,
                ['storage_mode' => 'local_env']
            );
        }

        $saved = [];
        $errors = [];

        if (!empty($geminiKey)) {
            $ok = StickForgeRDS::setApiKey('gemini', $geminiKey, 'Google Gemini Studio API Key');
            if ($ok) $saved[] = 'gemini';
            else $errors[] = 'Failed to save Gemini key: ' . StickForgeRDS::getLastError();
        }

        if (!empty($openaiKey)) {
            $ok = StickForgeRDS::setApiKey('openai', $openaiKey, 'OpenAI Studio API Key (DALL-E & TTS)');
            if ($ok) $saved[] = 'openai';
            else $errors[] = 'Failed to save OpenAI key: ' . StickForgeRDS::getLastError();
        }

        if (!empty($elevenKey)) {
            $ok = StickForgeRDS::setApiKey('elevenlabs', $elevenKey, 'ElevenLabs AI Voice Key');
            if ($ok) $saved[] = 'elevenlabs';
            else $errors[] = 'Failed to save ElevenLabs key: ' . StickForgeRDS::getLastError();
        }

        if (!empty($errors) && empty($saved)) {
            sf_json_error(implode(', ', $errors), 500);
        }

        sf_json_response([
            'ok' => true,
            'message' => 'API keys successfully saved in Amazon Aurora RDS table stickforge_api_keys.',
            'storage_mode' => 'aurora_rds',
            'saved_providers' => $saved,
            'warnings' => $errors
        ]);
        break;

    // -------------------------------------------------------------------------
    // 3. Test Aurora RDS Database Connection
    // -------------------------------------------------------------------------
    case 'test_rds':
    case 'test_db':
        $result = StickForgeRDS::testConnection();
        sf_json_response($result, $result['ok'] ? 200 : 500);
        break;

    default:
        sf_json_error("Unsupported action '{$action}'");
}
