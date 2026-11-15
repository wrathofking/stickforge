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
$selectedModel = $input['model'] ?? $input['imgModel'] ?? 'auto';
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

// Strictly enforce 2D cartoon stickman animation backdrop aesthetic
$visualPrompt = "Vibrant 2D flat cartoon illustration of {$cleanDesc}. Authentic stick-figure animation background art style, clean bold ink outlines, flat cel-shading, vibrant minimalist color palette, unobstructed flat floor in bottom 25% of the frame for 2D stickman characters to stand and move on, open negative space in center stage, high contrast against thin stick figures, atmospheric lighting, empty scene with zero people, no humans, no photorealistic faces, text-free, clean 2D animation art plate, 16:9 widescreen";

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
    $wantsImagenFirst = str_starts_with($selectedModel, 'imagen-');

    // Function: Try Google Imagen 4 Predict API
    $tryImagen = function() use ($geminiKey, $selectedModel, $visualPrompt, $aspectRatio) {
        $imagenModels = ['imagen-4.0-generate-001', 'imagen-4.0-fast-generate-001'];
        if (in_array($selectedModel, $imagenModels)) {
            $imagenModels = array_merge([$selectedModel], array_diff($imagenModels, [$selectedModel]));
        }
        foreach ($imagenModels as $im) {
            $imagenUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$im}:predict?key=" . urlencode($geminiKey);
            $imagenPayload = [
                'instances' => [
                    ['prompt' => $visualPrompt]
                ],
                'parameters' => [
                    'sampleCount' => 1,
                    'aspectRatio' => $aspectRatio,
                    'negativePrompt' => 'photorealistic, realistic humans, human faces, 3D CGI, photo, noisy textures, cluttered, text, watermark, people in background'
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
        return false;
    };

    // Function: Try Google Gemini & Nano Banana Native Image Generation
    $tryGemini = function() use ($geminiKey, $selectedModel, $visualPrompt) {
        $geminiImageModels = [
            'gemini-nano-banana-2.1',
            'gemini-3-pro-image',
            'gemini-3.1-flash-image',
            'gemini-3.1-flash-lite-image',
            'gemini-2.5-flash-image-preview'
        ];
        if (in_array($selectedModel, $geminiImageModels)) {
            $geminiImageModels = array_merge([$selectedModel], array_diff($geminiImageModels, [$selectedModel]));
        } elseif (str_starts_with($selectedModel, 'gemini-') || str_contains($selectedModel, 'banana')) {
            array_unshift($geminiImageModels, $selectedModel);
        }

        foreach ($geminiImageModels as $gm) {
            // Attempt 1: generateContent API with responseModalities
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
                            'provider' => 'google_nano_banana',
                            'model' => $gm
                        ]);
                    }
                }
            }

            // Attempt 2: Interactions API (Dedicated for Nano Banana 2.1 & Pro)
            $interactionsUrl = "https://generativelanguage.googleapis.com/v1beta/interactions?key=" . urlencode($geminiKey);
            $interactPayload = [
                'model' => $gm,
                'input' => [
                    ['type' => 'text', 'text' => $visualPrompt]
                ]
            ];
            $headers = [
                'Content-Type' => 'application/json',
                'x-goog-api-key' => $geminiKey,
                'Api-Revision' => '2026-05-20'
            ];
            $res = sf_curl_request($interactionsUrl, 'POST', $headers, $interactPayload, 45);
            if ($res['ok']) {
                $data = json_decode($res['body'], true);
                $b64 = $data['output_image']['data'] ?? $data['outputs'][0]['data'] ?? null;
                if ($b64) {
                    sf_json_response([
                        'ok' => true,
                        'dataUrl' => "data:image/png;base64,{$b64}",
                        'provider' => 'google_nano_banana',
                        'model' => $gm
                    ]);
                }
            }
        }
        return false;
    };

    // Execute in requested order
    if ($wantsImagenFirst) {
        $tryImagen();
        $tryGemini();
    } else {
        $tryGemini();
        $tryImagen();
    }

    // 3. Google Interactions API (Interactions image model fallback)
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
// If Gemini / Imagen generation could not be completed
// -----------------------------------------------------------------------------
if (!empty($geminiKey)) {
    sf_json_error('Google Gemini API did not return an image for this prompt. Please check your Gemini API quota or model availability.', 502);
} else {
    sf_json_error('Missing Google Gemini API key. Please enter your Gemini API key in API Settings.', 401);
}
