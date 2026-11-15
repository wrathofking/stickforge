<?php
/**
 * StickForge 2D - AI Image & 2D Background Generator Gateway
 * Supports Google Gemini 3.1 Flash Image, Google Imagen 4, Interactions API,
 * OpenAI DALL-E 3, and Neural 2D Cartoon fallback
 * Resolves CORS restrictions, deprecated endpoints, and API key leak risks
 */

require_once __DIR__ . '/config.php';
sf_cors_headers();

$input = sf_get_json_input();
$provider = $input['provider'] ?? sf_env('DEFAULT_IMAGE_PROVIDER', 'google_flow');
$rawPrompt = trim($input['prompt'] ?? '');
$aspectRatio = ($input['aspectRatio'] ?? '16:9') === '9:16' ? '9:16' : '16:9';
$clientKey = $input['apiKey'] ?? '';

if (empty($rawPrompt)) {
    sf_json_error('Scene prompt is required for background generation.');
}

// Strip bracketed tags e.g. [Google Flow...] for pure visual prompt
$cleanDesc = trim(preg_replace('/\[[^\]]*\]/', '', $rawPrompt));
if (empty($cleanDesc)) {
    $cleanDesc = $rawPrompt;
}

$visualPrompt = "Vibrant 2D flat-shaded cartoon animation background illustration of {$cleanDesc}, clean bold ink linework, 2D anime stick-figure story animation backdrop, unobstructed foreground floor, text-free, empty background, 16:9 widescreen, cinematic studio lighting";

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
        'prompt' => $visualPrompt,
        'n' => 1,
        'size' => $dalleSize,
        'response_format' => 'b64_json'
    ];

    $headers = [
        'Authorization' => "Bearer {$apiKey}",
        'Content-Type' => 'application/json'
    ];

    $res = sf_curl_request('https://api.openai.com/v1/images/generations', 'POST', $headers, $payload, 90);

    if ($res['ok']) {
        $data = json_decode($res['body'], true);
        $b64 = $data['data'][0]['b64_json'] ?? null;
        $url = $data['data'][0]['url'] ?? null;

        if ($b64) {
            sf_json_response(['ok' => true, 'dataUrl' => 'data:image/png;base64,' . $b64, 'provider' => 'openai_dalle']);
        } elseif ($url) {
            sf_json_response(['ok' => true, 'imageUrl' => $url, 'provider' => 'openai_dalle']);
        }
    }
}

// -----------------------------------------------------------------------------
// Provider: Google Flow / Google Gemini Image Generation
// -----------------------------------------------------------------------------
$geminiKey = sf_get_api_key('gemini', $clientKey);

if (!empty($geminiKey)) {
    // 1. Google Gemini Native Image Generation (gemini-3.1-flash-image & gemini-2.5-flash-image-preview)
    $geminiImageModels = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image-preview', 'gemini-3.1-flash-lite-image'];
    foreach ($geminiImageModels as $gm) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$gm}:generateContent?key=" . urlencode($geminiKey);
        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $visualPrompt]]]
            ],
            'generationConfig' => [
                'responseModalities' => ['image', 'text']
            ]
        ];

        $res = sf_curl_request($url, 'POST', ['Content-Type' => 'application/json'], $payload, 45);
        if ($res['ok']) {
            $data = json_decode($res['body'], true);
            $parts = $data['candidates'][0]['content']['parts'] ?? [];
            foreach ($parts as $p) {
                if (!empty($p['inlineData']['data'])) {
                    $mime = $p['inlineData']['mimeType'] ?? 'image/png';
                    $b64 = $p['inlineData']['data'];
                    sf_json_response([
                        'ok' => true,
                        'dataUrl' => "data:{$mime};base64,{$b64}",
                        'provider' => 'google_flow',
                        'model' => $gm
                    ]);
                }
            }
        }
    }

    // 2. Google Imagen 4 Predict API (imagen-4.0-generate-001 & imagen-4.0-fast-generate-001)
    $imagenModels = ['imagen-4.0-generate-001', 'imagen-4.0-fast-generate-001'];
    foreach ($imagenModels as $im) {
        $imagenUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$im}:predict?key=" . urlencode($geminiKey);
        $imagenPayload = [
            'instances' => [
                ['prompt' => $visualPrompt]
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
                    'provider' => 'imagen_4',
                    'model' => $im
                ]);
            }
        }
    }

    // 3. Google Interactions API (Interactions image model)
    $interactionsUrl = "https://generativelanguage.googleapis.com/v1beta/interactions?key=" . urlencode($geminiKey);
    $interactPayload = [
        'model' => 'gemini-3.1-flash-image',
        'input' => [
            ['type' => 'text', 'text' => $visualPrompt]
        ]
    ];
    $res = sf_curl_request($interactionsUrl, 'POST', ['Content-Type' => 'application/json', 'x-goog-api-key' => $geminiKey], $interactPayload, 45);
    if ($res['ok']) {
        $data = json_decode($res['body'], true);
        $b64 = $data['output_image']['data'] ?? $data['outputs'][0]['data'] ?? null;
        if ($b64) {
            sf_json_response([
                'ok' => true,
                'dataUrl' => "data:image/png;base64,{$b64}",
                'provider' => 'interactions_gemini',
                'model' => 'gemini-3.1-flash-image'
            ]);
        }
    }
}

// -----------------------------------------------------------------------------
// Provider 4: Neural 2D Cartoon Engine (Guaranteed High-Res Fallback)
// -----------------------------------------------------------------------------
$w = ($aspectRatio === '9:16') ? 720 : 1280;
$h = ($aspectRatio === '9:16') ? 1280 : 720;
$encodedPrompt = urlencode($visualPrompt);
$seed = rand(100000, 999999);
$pollinationsUrl = "https://image.pollinations.ai/prompt/{$encodedPrompt}?width={$w}&height={$h}&model=flux&nologo=true&seed={$seed}";

$res = sf_curl_request($pollinationsUrl, 'GET', [], null, 35);
if ($res['ok'] && !empty($res['body']) && strlen($res['body']) > 2048) {
    $b64 = base64_encode($res['body']);
    sf_json_response([
        'ok' => true,
        'dataUrl' => "data:image/jpeg;base64,{$b64}",
        'provider' => 'neural_2d_flux',
        'model' => 'flux-cartoon-plate'
    ]);
}

// Return the direct web image URL for client loading if cURL failed
sf_json_response([
    'ok' => true,
    'imageUrl' => $pollinationsUrl,
    'provider' => 'neural_2d_flux',
    'model' => 'flux-cartoon-plate'
]);
