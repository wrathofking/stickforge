<?php
/**
 * StickForge 2D - Server-Side Project Persistence API
 * Allows saving, listing, loading, and managing projects on the web server
 */

require_once __DIR__ . '/config.php';
sf_cors_headers();

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';
$storageDir = sf_get_projects_dir();

if (!is_dir($storageDir) || !is_writable($storageDir)) {
    @mkdir($storageDir, 0755, true);
    if (!is_writable($storageDir)) {
        sf_json_error("Project storage directory is not writable by PHP: {$storageDir}", 500);
    }
}

// Helper to sanitize project ID/filename preventing directory traversal attacks
function sf_sanitize_project_id($id) {
    $clean = preg_replace('/[^a-zA-Z0-9_\-]/', '', $id);
    return substr($clean, 0, 64);
}

switch ($action) {
    // -------------------------------------------------------------------------
    // 1. Save Project to Server
    // -------------------------------------------------------------------------
    case 'save':
        $input = sf_get_json_input();
        $projectData = $input['project'] ?? $input;

        if (empty($projectData) || !is_array($projectData)) {
            sf_json_error('Invalid project payload.', 400);
        }

        $id = !empty($projectData['id']) ? sf_sanitize_project_id($projectData['id']) : 'proj_' . time();
        if (empty($id)) $id = 'proj_' . time();

        $title = !empty($projectData['projectTitle']) ? trim($projectData['projectTitle']) : 'Untitled Stick Story';
        $fileName = "{$id}.json";
        $filePath = "{$storageDir}/{$fileName}";

        // Wrap or ensure metadata exists
        $projectData['id'] = $id;
        $projectData['savedAt'] = date('c');

        $encoded = json_encode($projectData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            sf_json_error('Failed to encode project JSON.', 500);
        }

        $bytes = @file_put_contents($filePath, $encoded, LOCK_EX);
        if ($bytes === false) {
            sf_json_error("Failed to write project file to {$filePath}.", 500);
        }

        sf_json_response([
            'ok' => true,
            'message' => 'Project saved successfully to server.',
            'id' => $id,
            'title' => $title,
            'fileName' => $fileName,
            'size' => $bytes,
            'savedAt' => $projectData['savedAt']
        ]);
        break;

    // -------------------------------------------------------------------------
    // 2. List Projects from Server
    // -------------------------------------------------------------------------
    case 'list':
        $files = glob("{$storageDir}/*.json");
        $projects = [];

        if ($files) {
            foreach ($files as $file) {
                $baseName = basename($file);
                $id = sf_sanitize_project_id(pathinfo($baseName, PATHINFO_FILENAME));
                $mtime = filemtime($file);

                $metaTitle = $id;
                $shotCount = 0;

                // Read header snippet to get title quickly
                $content = @file_get_contents($file, false, null, 0, 2048);
                if ($content) {
                    if (preg_match('/"projectTitle"\s*:\s*"([^"]+)"/', $content, $m)) {
                        $metaTitle = $m[1];
                    }
                    if (preg_match_all('/"duration"/', $content, $m)) {
                        $shotCount = count($m[0]);
                    }
                }

                $projects[] = [
                    'id' => $id,
                    'title' => $metaTitle,
                    'fileName' => $baseName,
                    'size' => filesize($file),
                    'shotsCount' => $shotCount,
                    'updatedAt' => date('c', $mtime),
                    'updatedTimestamp' => $mtime
                ];
            }

            // Sort newest first
            usort($projects, function ($a, $b) {
                return $b['updatedTimestamp'] - $a['updatedTimestamp'];
            });
        }

        sf_json_response([
            'ok' => true,
            'storagePath' => basename($storageDir),
            'count' => count($projects),
            'projects' => $projects
        ]);
        break;

    // -------------------------------------------------------------------------
    // 3. Load Project from Server
    // -------------------------------------------------------------------------
    case 'load':
        $id = sf_sanitize_project_id($_GET['id'] ?? ($_POST['id'] ?? ''));
        if (empty($id)) {
            sf_json_error('Project ID is required to load.', 400);
        }

        $filePath = "{$storageDir}/{$id}.json";
        if (!file_exists($filePath) || !is_readable($filePath)) {
            sf_json_error("Project '{$id}' not found on server.", 404);
        }

        $raw = file_get_contents($filePath);
        $project = json_decode($raw, true);

        if (!$project) {
            sf_json_error("Project file exists but contains invalid JSON.", 500);
        }

        sf_json_response([
            'ok' => true,
            'id' => $id,
            'project' => $project
        ]);
        break;

    // -------------------------------------------------------------------------
    // 4. Delete Project from Server
    // -------------------------------------------------------------------------
    case 'delete':
        $id = sf_sanitize_project_id($_GET['id'] ?? ($_POST['id'] ?? ''));
        if (empty($id)) {
            sf_json_error('Project ID is required to delete.', 400);
        }

        $filePath = "{$storageDir}/{$id}.json";
        if (file_exists($filePath)) {
            @unlink($filePath);
            sf_json_response(['ok' => true, 'deleted' => $id]);
        } else {
            sf_json_error("Project '{$id}' not found.", 404);
        }
        break;

    default:
        sf_json_error("Unsupported action '{$action}'");
}
