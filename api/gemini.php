<?php
/**
 * StickForge 2D - Google Gemini API Gateway & Proxy
 * Handles Script Writing, Style DNA Analysis, and Stick Rig/Prop Forging
 */

require_once __DIR__ . '/config.php';
sf_cors_headers();

$input = sf_get_json_input();
$action = isset($_GET['action']) ? $_GET['action'] : ($input['action'] ?? 'generate_script');
$clientKey = $input['apiKey'] ?? '';
$apiKey = sf_get_api_key('gemini', $clientKey);

if (empty($apiKey)) {
    sf_json_error(
        'Missing Gemini API Key. Please configure GEMINI_API_KEY on the web server or enter your API key in StickForge Settings.',
        401,
        ['code' => 'NO_API_KEY']
    );
}

// Model resolution (defaults to gemini-2.5-flash or gemini-2.0-flash)
$model = !empty($input['model']) ? trim($input['model']) : sf_env('GEMINI_MODEL', 'gemini-2.5-flash');

// Normalize model name (remove models/ prefix if present)
$model = preg_replace('#^models/#', '', $model);
if (in_array($model, ['gemini-3-flash-preview', 'gemini-3.0-flash'])) {
    $model = 'gemini-2.5-flash';
}

$geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

switch ($action) {
    // -------------------------------------------------------------------------
    // 1. Analyze YouTube URL or Script Sample to Clone Style DNA
    // -------------------------------------------------------------------------
    case 'analyze_style':
        $sourceInput = trim($input['source'] ?? '');
        $customStyleName = trim($input['customStyleName'] ?? '');

        if (empty($sourceInput)) {
            sf_json_error('Source text or YouTube URL is required for style analysis.');
        }

        $isUrl = preg_match('#^https?://(www\.)?(youtube\.com|youtu\.be)/#i', $sourceInput);

        $sysPrompt = "You are an elite YouTube Script Analyst. Analyze the provided YouTube premise or script sample and extract a reusable Writing Style DNA profile.
Return ONLY valid JSON matching this schema:
{
  \"name\": \"Short descriptive style name\",
  \"tone\": \"Emotional & narrative tone\",
  \"hookFormula\": \"How the first 15 seconds hook the viewer\",
  \"pacing\": \"Sentence length, rhythm, and scene transitions\",
  \"vocabulary\": \"Word choice and inline expressive voice tags\",
  \"twistStructure\": \"How the story builds to a climax and moral twist\"
}";

        $userPrompt = $isUrl
            ? "Analyze the storytelling style, pacing, tone, and hook of this YouTube video concept: {$sourceInput}"
            : "Analyze the storytelling style, pacing, tone, and hook of this script sample:\n\n{$sourceInput}";

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $userPrompt]]]
            ],
            'systemInstruction' => [
                'parts' => [['text' => $sysPrompt]]
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.4
            ]
        ];

        $res = sf_curl_request($geminiEndpoint, 'POST', ['Content-Type' => 'application/json'], $payload, 45);

        if (!$res['ok']) {
            sf_json_error("Gemini API Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
        }

        $decoded = json_decode($res['body'], true);
        $rawText = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $parsed = json_decode($rawText, true);

        if (!$parsed || !is_array($parsed)) {
            sf_json_error('Failed to parse structured JSON from Gemini.', 500, ['raw' => $rawText]);
        }

        $styleObj = [
            'id' => 'style_' . time(),
            'name' => $customStyleName ?: ($parsed['name'] ?? 'Cloned YouTube Style'),
            'source' => substr($sourceInput, 0, 80),
            'tone' => $parsed['tone'] ?? 'Dramatic first-person story',
            'hookFormula' => $parsed['hookFormula'] ?? 'High-contrast opening premise',
            'pacing' => $parsed['pacing'] ?? 'Fast-paced 2-sentence paragraphs',
            'vocabulary' => $parsed['vocabulary'] ?? 'Conversational with [shocked] and [excitedly] tags',
            'twistStructure' => $parsed['twistStructure'] ?? 'Unexpected reveal and moral takeaway'
        ];

        sf_json_response(['ok' => true, 'style' => $styleObj]);
        break;

    // -------------------------------------------------------------------------
    // 2. Generate Multi-Shot Script with Duration & Style Profile
    // -------------------------------------------------------------------------
    case 'generate_script':
        $topic = trim($input['topic'] ?? 'What if you could see everyone\'s IQ?');
        $targetMinutes = max(0.5, min(60, floatval($input['targetMinutes'] ?? 1.0)));
        $styleProfile = $input['styleProfile'] ?? [
            'name' => 'ConChaser Viral What-If',
            'tone' => 'First-person high-school anomaly drama with moral twist',
            'hookFormula' => 'Immediate contrast between an unfair status symbol and protagonist hidden metric',
            'pacing' => 'Fast 2-sentence paragraphs, constant numeric comparisons',
            'twistStructure' => 'The metric measures raw potential, not discipline or kindness; rivals team up'
        ];

        $targetShots = max(3, (int)round($targetMinutes * 9));
        $targetWords = (int)round($targetMinutes * 150);

        $sysPrompt = "You are an expert YouTube stick-story scriptwriter.
Write an engaging first-person script composed of exactly {$targetShots} distinct paragraphs (~{$targetWords} words total, for a {$targetMinutes}-minute video) about the user premise.
Follow this Writing Style DNA:
- Style Name: " . ($styleProfile['name'] ?? 'Custom') . "
- Tone: " . ($styleProfile['tone'] ?? 'Engaging') . "
- Hook Formula: " . ($styleProfile['hookFormula'] ?? 'Immediate contrast') . "
- Pacing: " . ($styleProfile['pacing'] ?? 'Punchy') . "
- Twist: " . ($styleProfile['twistStructure'] ?? 'Moral realization') . "
Rules:
- Include floating overhead numbers/metrics (e.g. '160 IQ', '70 IQ', 'YES', 'NO', '$10M').
- Start paragraphs with Gemini 3.1 TTS expressive tags: [shocked], [whispers], [excitedly], [thoughtful], [awe].
Return ONLY valid JSON matching this schema:
{
  \"paragraphs\": [
    \"[shocked] Paragraph 1 text...\",
    \"[whispers] Paragraph 2 text...\"
  ]
}";

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => "Topic: {$topic}\nTarget Length: {$targetMinutes} minutes ({$targetShots} paragraphs)."]]]
            ],
            'systemInstruction' => [
                'parts' => [['text' => $sysPrompt]]
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.7
            ]
        ];

        $res = sf_curl_request($geminiEndpoint, 'POST', ['Content-Type' => 'application/json'], $payload, 60);

        if (!$res['ok']) {
            sf_json_error("Gemini Script API Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
        }

        $decoded = json_decode($res['body'], true);
        $rawText = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $parsed = json_decode($rawText, true);

        if (!$parsed || empty($parsed['paragraphs']) || !is_array($parsed['paragraphs'])) {
            sf_json_error('Failed to parse script paragraphs from Gemini output.', 500, ['raw' => $rawText]);
        }

        sf_json_response(['ok' => true, 'paragraphs' => $parsed['paragraphs']]);
        break;

    // -------------------------------------------------------------------------
    // 3. Forge Custom 2D Stick Character Models or Prop Sockets
    // -------------------------------------------------------------------------
    case 'forge_model':
        $kind = $input['kind'] ?? 'character';
        $promptText = trim($input['promptText'] ?? 'Cyber Ninja');
        $subType = trim($input['subType'] ?? 'humanoid');

        if ($kind === 'character') {
            $sys = "You generate a 2D stick-style character rig JSON for StickForge Studio.
Return ONLY valid JSON:
{
  \"name\": \"{$promptText}\",
  \"category\": \"" . ($subType === 'animal' ? 'animal' : 'humanoid') . "\",
  \"species\": \"" . ($subType === 'animal' ? 'dog' : 'human') . "\",
  \"headScale\": 1.0,
  \"headShape\": \"circle\",
  \"torsoLength\": 64,
  \"limbLength\": 50,
  \"hasHands\": true,
  \"hasFeet\": true,
  \"ears\": \"" . ($subType === 'animal' ? 'floppy' : 'none') . "\",
  \"tail\": \"" . ($subType === 'animal' ? 'wag' : 'none') . "\",
  \"antenna\": false,
  \"defaultColor\": \"#38bdf8\"
}";
            $userText = "Create a {$subType} stick-style character model for: {$promptText}";
        } else {
            $slot = $subType ?: 'hand';
            $sys = "You generate 2D vector prop/clothing geometry for a stick figure attachment socket ({$slot}).
Coordinates are relative to the socket anchor (0,0) within -25..25.
Return ONLY valid JSON:
{
  \"name\": \"{$promptText}\",
  \"slot\": \"{$slot}\",
  \"shapes\": [
    { \"type\": \"roundRect\", \"x\": -12, \"y\": -14, \"w\": 24, \"h\": 28, \"r\": 6, \"fill\": \"#6366f1\", \"stroke\": \"#0f172a\" },
    { \"type\": \"text\", \"x\": 0, \"y\": 1, \"text\": \"ITEM\", \"color\": \"#ffffff\", \"size\": 11 }
  ]
}";
            $userText = "Create a 2D vector object \"{$promptText}\" for socket: {$slot}";
        }

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $userText]]]
            ],
            'systemInstruction' => [
                'parts' => [['text' => $sys]]
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'temperature' => 0.5
            ]
        ];

        $res = sf_curl_request($geminiEndpoint, 'POST', ['Content-Type' => 'application/json'], $payload, 45);

        if (!$res['ok']) {
            sf_json_error("Gemini Forge API Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
        }

        $decoded = json_decode($res['body'], true);
        $rawText = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $parsed = json_decode($rawText, true);

        if (!$parsed || !is_array($parsed)) {
            sf_json_error('Failed to parse forged model JSON.', 500, ['raw' => $rawText]);
        }

        sf_json_response(['ok' => true, 'result' => $parsed, 'kind' => $kind]);
        break;

    // -------------------------------------------------------------------------
    // 4. List All Available Models for Provided API Key
    // -------------------------------------------------------------------------
    case 'list_models':
        $listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($apiKey);
        $res = sf_curl_request($listUrl, 'GET', [], null, 30);

        if (!$res['ok']) {
            sf_json_error("Gemini Models API Error ({$res['status']}): " . ($res['body'] ?: $res['error']), $res['status'] ?: 500);
        }

        $decoded = json_decode($res['body'], true);
        $rawModels = $decoded['models'] ?? [];
        $models = [];

        foreach ($rawModels as $m) {
            $rawName = $m['name'] ?? '';
            $id = preg_replace('#^models/#', '', $rawName);
            $methods = $m['supportedGenerationMethods'] ?? [];
            $models[] = [
                'id' => $id,
                'name' => $rawName,
                'displayName' => $m['displayName'] ?? $id,
                'description' => $m['description'] ?? '',
                'inputTokenLimit' => $m['inputTokenLimit'] ?? null,
                'outputTokenLimit' => $m['outputTokenLimit'] ?? null,
                'supportedMethods' => $methods,
                'supportsGenerate' => in_array('generateContent', $methods)
            ];
        }

        // Sort: models supporting generateContent first, then alphabetically by displayName
        usort($models, function ($a, $b) {
            if ($a['supportsGenerate'] !== $b['supportsGenerate']) {
                return $b['supportsGenerate'] <=> $a['supportsGenerate'];
            }
            return strcasecmp($a['displayName'], $b['displayName']);
        });

        sf_json_response([
            'ok' => true,
            'count' => count($models),
            'models' => $models
        ]);
        break;

    default:
        sf_json_error("Unsupported action '{$action}'");
}
