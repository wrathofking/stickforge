<?php
/**
 * StickForge 2D - AI Image & 2D Background Generator Gateway
 * Supports Google Imagen 3, Gemini 2.5 Flash Image, and OpenAI DALL-E 3
 * Resolves CORS restrictions and client API key leak risks
 */

require_once __DIR__ . '/config.php';
sf_cors_headers();

$input = sf_get_json_input();
$provider = $input['provider'] ?? sf_env('DEFAULT_IMAGE_PROVIDER', 'google_flow');
$prompt = trim($input['prompt'] ?? '');
$aspectRatio = ($input['aspectRatio'] ?? '16:9') === '9:16' ? '9:16' : '16:9';
$clientKey = $input['apiKey'] ?? '';

if (empty($prompt)) {
    sf_json_error('Scene prompt is required for background generation.');
}

// -----------------------------------------------------------------------------
// Provider: OpenAI DALL-E 3
// -----------------------------------------------------------------------------
if ($provider === 'openai_dalle') {
    $apiKey = sf_get_api_key('openai', $clientKey);
    if (empty($apiKey)) {
        sf_json_error('Missing OpenAI API Key for DALL·E 3.', 401);
    }

    $dalleSize = ($aspectRatio === '9:16') ? '1024x1792' : '1792x1024';
    $payload = [
        'model' => 'dall-e-3',
        'prompt' => $prompt,
        'n' => 1,
        'size' => $dalleSize,
        'response_format' => 'b64_json'
    ];

    $headers = [
        'Authorization' => "Bearer {$apiKey}",
        'Content-Type' => 'application/json'
    ];

    $res = sf_curl_request('https://api.openai.com/v1/images/generations', 'POST', $headers, $payload, 90);

    if (!$res['ok']) {
        sf_json_error("OpenAI DALL·E API Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
    }

    $data = json_decode($res['body'], true);
    $b64 = $data['data'][0]['b64_json'] ?? null;
    $url = $data['data'][0]['url'] ?? null;

    if ($b64) {
        sf_json_response(['ok' => true, 'dataUrl' => 'data:image/png;base64,' . $b64, 'provider' => 'openai_dalle']);
    } elseif ($url) {
        sf_json_response(['ok' => true, 'imageUrl' => $url, 'provider' => 'openai_dalle']);
    } else {
        sf_json_error('No image returned from OpenAI.', 500);
    }
}

// -----------------------------------------------------------------------------
// Provider: Google Flow / Google Imagen 3 (Default)
// -----------------------------------------------------------------------------
$geminiKey = sf_get_api_key('gemini', $clientKey);
if (empty($geminiKey)) {
    sf_json_error('Missing Gemini API Key for Google Flow / Imagen.', 401);
}

// 1. Try Imagen 3 Predict API (imagen-3.0-generate-002)
$imagenModel = sf_env('IMAGEN_MODEL', 'imagen-3.0-generate-002');
$imagenUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$imagenModel}:predict?key=" . urlencode($geminiKey);

$imagenPayload = [
    'instances' => [
        ['prompt' => $prompt]
    ],
    'parameters' => [
        'sampleCount' => 1,
        'aspectRatio' => $aspectRatio
    ]
];

$res = sf_curl_request($imagenUrl, 'POST', ['Content-Type' => 'application/json'], $imagenPayload, 60);

if ($res['ok']) {
    $data = json_decode($res['body'], true);
    $b64 = $data['predictions'][0]['bytesBase64Encoded'] ?? null;
    $mime = $data['predictions'][0]['mimeType'] ?? 'image/png';
    if ($b64) {
        sf_json_response([
            'ok' => true,
            'dataUrl' => "data:{$mime};base64,{$b64}",
            'provider' => 'imagen_3',
            'model' => $imagenModel
        ]);
    }
}

// 2. Try Gemini Flash Image generation (e.g. gemini-2.0-flash with image modality)
$flashModels = ['gemini-2.0-flash', 'gemini-2.5-flash'];
foreach ($flashModels as $fm) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$fm}:generateContent?key=" . urlencode($geminiKey);
    $payload = [
        'contents' => [
            ['role' => 'user', 'parts' => [['text' => $prompt]]]
        ],
        'generationConfig' => [
            'responseModalities' => ['IMAGE'],
            'imageConfig' => ['aspectRatio' => $aspectRatio]
        ]
    ];

    $flashRes = sf_curl_request($url, 'POST', ['Content-Type' => 'application/json'], $payload, 45);
    if ($flashRes['ok']) {
        $fData = json_decode($flashRes['body'], true);
        $part = null;
        if (!empty($fData['candidates'][0]['content']['parts'])) {
            foreach ($fData['candidates'][0]['content']['parts'] as $p) {
                if (!empty($p['inlineData']['data'])) {
                    $part = $p;
                    break;
                }
            }
        }
        if ($part) {
            $mime = $part['inlineData']['mimeType'] ?? 'image/png';
            $b64 = $part['inlineData']['data'];
            sf_json_response([
                'ok' => true,
                'dataUrl' => "data:{$mime};base64,{$b64}",
                'provider' => 'google_flow',
                'model' => $fm
            ]);
        }
    }
}

// If all external AI image generators failed or quota was exceeded, notify client to use procedural plates
sf_json_error(
    'AI Image API call failed or rate limit reached. Procedural 2D cartoon plate fallback will be used.',
    502,
    ['fallback' => true, 'lastError' => $res['body'] ?? $res['error']]
);
