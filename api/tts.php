<?php
/**
 * StickForge 2D - AI Voiceover & TTS Audio Gateway
 * Proxies Gemini Audio, OpenAI TTS (tts-1), and ElevenLabs
 * Fixes browser CORS restrictions and secures API credentials
 */

require_once __DIR__ . '/config.php';
sf_cors_headers();

$input = sf_get_json_input();
$provider = $input['provider'] ?? 'gemini_31_tts';
$text = trim($input['text'] ?? '');
$voice = trim($input['voice'] ?? 'Puck');
$stylePrompt = trim($input['stylePrompt'] ?? 'Engaging, dramatic YouTube stick-story narrator');
$clientKey = $input['apiKey'] ?? '';

if (empty($text)) {
    sf_json_error('Narration text is required for audio synthesis.');
}

// Clean expressive inline tags for raw speech if needed
$cleanText = preg_replace('/\[[^\]]+\]/', '', $text);

// -----------------------------------------------------------------------------
// Provider: ElevenLabs
// -----------------------------------------------------------------------------
if ($provider === 'elevenlabs') {
    $apiKey = sf_get_api_key('elevenlabs', $clientKey);
    if (empty($apiKey)) {
        sf_json_error('Missing ElevenLabs API Key.', 401);
    }

    $voiceId = !empty($voice) ? $voice : 'JBFqnCBsd6RMkjVDRZzb'; // Default George/Adam
    $url = "https://api.elevenlabs.io/v1/text-to-speech/" . urlencode($voiceId);

    $payload = [
        'text' => $cleanText,
        'model_id' => 'eleven_multilingual_v2',
        'voice_settings' => [
            'stability' => 0.5,
            'similarity_boost' => 0.75
        ]
    ];

    $headers = [
        'xi-api-key' => $apiKey,
        'Content-Type' => 'application/json',
        'Accept' => 'audio/mpeg'
    ];

    $res = sf_curl_request($url, 'POST', $headers, $payload, 60);

    if (!$res['ok']) {
        sf_json_error("ElevenLabs API Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
    }

    $b64 = base64_encode($res['body']);
    sf_json_response([
        'ok' => true,
        'audioDataUrl' => 'data:audio/mpeg;base64,' . $b64,
        'provider' => 'elevenlabs',
        'format' => 'mp3'
    ]);
}

// -----------------------------------------------------------------------------
// Provider: OpenAI Audio (tts-1)
// -----------------------------------------------------------------------------
if ($provider === 'openai_tts') {
    $apiKey = sf_get_api_key('openai', $clientKey);
    if (empty($apiKey)) {
        sf_json_error('Missing OpenAI API Key for TTS.', 401);
    }

    $allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    $selectedVoice = in_array(strtolower($voice), $allowedVoices) ? strtolower($voice) : 'onyx';

    $payload = [
        'model' => 'tts-1',
        'input' => $cleanText,
        'voice' => $selectedVoice,
        'response_format' => 'mp3'
    ];

    $headers = [
        'Authorization' => "Bearer {$apiKey}",
        'Content-Type' => 'application/json'
    ];

    $res = sf_curl_request('https://api.openai.com/v1/audio/speech', 'POST', $headers, $payload, 60);

    if (!$res['ok']) {
        sf_json_error("OpenAI TTS Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
    }

    $b64 = base64_encode($res['body']);
    sf_json_response([
        'ok' => true,
        'audioDataUrl' => 'data:audio/mpeg;base64,' . $b64,
        'provider' => 'openai_tts',
        'format' => 'mp3'
    ]);
}

// -----------------------------------------------------------------------------
// Provider: Google Gemini Audio TTS
// -----------------------------------------------------------------------------
$geminiKey = sf_get_api_key('gemini', $clientKey);
if (empty($geminiKey)) {
    sf_json_error('Missing Gemini API Key for TTS.', 401);
}

$prompt = "# AUDIO PROFILE: StickForge Narrator\n## DIRECTOR'S NOTES\nStyle: {$stylePrompt}\n#### TRANSCRIPT\n{$text}";

$ttsModels = ['gemini-2.0-flash', 'gemini-2.5-flash'];
foreach ($ttsModels as $modelName) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key=" . urlencode($geminiKey);
    $payload = [
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ],
        'generationConfig' => [
            'responseModalities' => ['AUDIO'],
            'speechConfig' => [
                'voiceConfig' => [
                    'prebuiltVoiceConfig' => ['voiceName' => $voice ?: 'Puck']
                ]
            ]
        ]
    ];

    $res = sf_curl_request($url, 'POST', ['Content-Type' => 'application/json'], $payload, 45);

    if ($res['ok']) {
        $data = json_decode($res['body'], true);
        $part = $data['candidates'][0]['content']['parts'][0] ?? null;
        $b64 = $part['inlineData']['data'] ?? null;
        $mime = $part['inlineData']['mimeType'] ?? 'audio/wav';

        if ($b64) {
            sf_json_response([
                'ok' => true,
                'audioDataUrl' => "data:{$mime};base64,{$b64}",
                'provider' => 'gemini_tts',
                'model' => $modelName
            ]);
        }
    }
}

sf_json_error('TTS synthesis failed. Browser speech synthesis fallback will be used.', 502, ['fallback' => true]);
