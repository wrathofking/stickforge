<?php
/**
 * StickForge 2D - Amazon Aurora RDS (Relational Database Service) Connector
 *
 * Supports both Amazon Aurora PostgreSQL and Amazon Aurora MySQL clusters.
 * Handles secure connection pooling via PDO, automatic table provisioning,
 * upsert/retrieval of AI API keys, and graceful fallback.
 */

require_once __DIR__ . '/config.php';

class StickForgeRDS {
    private static ?PDO $pdo = null;
    private static ?string $lastError = null;
    private static bool $tableInitialized = false;

    /**
     * Check if Amazon Aurora RDS is configured and enabled
     */
    public static function isConfigured(): bool {
        $enabled = filter_var(sf_env('AURORA_RDS_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
        $host = self::getHost();
        return ($enabled || !empty($host));
    }

    /**
     * Get the Aurora RDS cluster endpoint hostname
     */
    public static function getHost(): string {
        return trim(sf_env('AURORA_RDS_HOST', ''));
    }

    /**
     * Determine database engine: 'postgres' (default) or 'mysql'
     */
    public static function getEngine(): string {
        $configured = strtolower(trim(sf_env('AURORA_RDS_ENGINE', '')));
        if ($configured === 'mysql' || $configured === 'mariadb') {
            return 'mysql';
        }
        if ($configured === 'postgres' || $configured === 'postgresql' || $configured === 'pgsql') {
            return 'postgres';
        }

        // Auto-detect from port if engine not explicitly specified
        $port = (int)sf_env('AURORA_RDS_PORT', '0');
        if ($port === 3306) return 'mysql';
        if ($port === 5432) return 'postgres';

        return 'postgres'; // Default to Aurora PostgreSQL
    }

    /**
     * Get port based on engine
     */
    public static function getPort(): int {
        $port = (int)sf_env('AURORA_RDS_PORT', '0');
        if ($port > 0) return $port;
        return (self::getEngine() === 'mysql') ? 3306 : 5432;
    }

    /**
     * Resolve AWS region from config or hostname
     * e.g., "my-cluster.cluster-xyz.us-east-1.rds.amazonaws.com" -> "us-east-1"
     */
    public static function getRegion(): string {
        $configured = trim(sf_env('AURORA_RDS_REGION', sf_env('AWS_REGION', sf_env('AWS_DEFAULT_REGION', ''))));
        if (!empty($configured)) return $configured;

        $host = self::getHost();
        if (preg_match('#\.rds\.([a-z0-9\-]+)\.amazonaws\.com#i', $host, $m)) {
            return $m[1];
        }
        return 'us-east-1';
    }

    /**
     * Generate an AWS IAM Database Authentication Token for Amazon Aurora RDS
     * Pure native PHP SigV4 implementation — no external AWS SDK required.
     */
    public static function generateSigV4RdsToken(
        string $host,
        int $port,
        string $username,
        string $region,
        string $accessKey,
        string $secretKey,
        string $sessionToken = '',
        int $expiresIn = 900
    ): string {
        $service = 'rds-db';
        $action = 'connect';
        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";

        $queryParams = [
            'Action' => $action,
            'DBUser' => $username,
            'X-Amz-Algorithm' => 'AWS4-HMAC-SHA256',
            'X-Amz-Credential' => "{$accessKey}/{$credentialScope}",
            'X-Amz-Date' => $amzDate,
            'X-Amz-Expires' => (string)$expiresIn,
            'X-Amz-SignedHeaders' => 'host'
        ];

        if (!empty($sessionToken)) {
            $queryParams['X-Amz-Security-Token'] = $sessionToken;
        }

        ksort($queryParams);
        $canonicalQueryString = http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);
        $canonicalHeaders = "host:" . strtolower("{$host}:{$port}") . "\n";
        $signedHeaders = "host";
        $payloadHash = hash('sha256', '');

        $canonicalRequest = "GET\n/\n{$canonicalQueryString}\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";
        $stringToSign = "AWS4-HMAC-SHA256\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);

        $kDate = hash_hmac('sha256', $dateStamp, 'AWS4' . $secretKey, true);
        $kRegion = hash_hmac('sha256', $region, $kDate, true);
        $kService = hash_hmac('sha256', $service, $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);

        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        // RDS IAM token is the hostname:port followed by query string and signature (without http:// or https://)
        return "{$host}:{$port}/?{$canonicalQueryString}&X-Amz-Signature={$signature}";
    }

    /**
     * Get Database Password or IAM Auth Token
     */
    public static function getPassword(): ?string {
        // 1. Direct standard password
        $password = sf_env('AURORA_RDS_PASSWORD', '');
        if (!empty($password)) {
            return $password;
        }

        // 2. Pre-generated token
        $token = sf_env('AURORA_RDS_TOKEN', '');
        if (!empty($token)) {
            return $token;
        }

        // 3. IAM Database Authentication via AWS credentials
        $host = self::getHost();
        $port = self::getPort();
        $user = sf_env('AURORA_RDS_USER', self::getEngine() === 'mysql' ? 'admin' : 'postgres');
        $region = self::getRegion();
        $accessKey = sf_env('AWS_ACCESS_KEY_ID', '');
        $secretKey = sf_env('AWS_SECRET_ACCESS_KEY', '');
        $sessionToken = sf_env('AWS_SESSION_TOKEN', '');

        if (!empty($accessKey) && !empty($secretKey) && !empty($host)) {
            return self::generateSigV4RdsToken($host, $port, $user, $region, $accessKey, $secretKey, $sessionToken);
        }

        return '';
    }

    /**
     * Connect to Amazon Aurora RDS via PDO
     */
    public static function getConnection(): ?PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        if (!self::isConfigured()) {
            self::$lastError = "Aurora RDS is not configured. Set AURORA_RDS_HOST in config/.env.";
            return null;
        }

        $engine = self::getEngine();
        $host = self::getHost();
        $port = self::getPort();
        $database = sf_env('AURORA_RDS_DATABASE', $engine === 'mysql' ? 'stickforge' : 'postgres');
        $user = sf_env('AURORA_RDS_USER', $engine === 'mysql' ? 'admin' : 'postgres');
        $password = self::getPassword();

        $pdoOptions = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 6,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ];

        if ($engine === 'mysql') {
            if (!extension_loaded('pdo_mysql')) {
                self::$lastError = "The PHP 'pdo_mysql' extension is required for Aurora MySQL. Enable it in php.ini.";
                return null;
            }
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
        } else {
            if (!extension_loaded('pdo_pgsql')) {
                self::$lastError = "The PHP 'pdo_pgsql' extension is required for Aurora PostgreSQL. Enable it in php.ini.";
                return null;
            }
            $sslMode = sf_env('AURORA_RDS_SSL', 'prefer');
            $dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode={$sslMode}";
        }

        try {
            $pdo = new PDO($dsn, $user, $password, $pdoOptions);
            self::$pdo = $pdo;
            self::initTable($pdo, $engine);
            return $pdo;
        } catch (PDOException $e) {
            self::$lastError = "Aurora RDS Connection Failed (" . strtoupper($engine) . "): " . $e->getMessage();
            return null;
        }
    }

    /**
     * Auto-initialize the stickforge_api_keys table in Aurora RDS
     */
    public static function initTable(PDO $pdo, string $engine): bool {
        if (self::$tableInitialized) return true;

        if ($engine === 'mysql') {
            $sql = "CREATE TABLE IF NOT EXISTS stickforge_api_keys (
                key_name VARCHAR(64) NOT NULL,
                key_value TEXT NOT NULL,
                provider VARCHAR(32) NOT NULL,
                description VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (key_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        } else {
            $sql = "CREATE TABLE IF NOT EXISTS stickforge_api_keys (
                key_name VARCHAR(64) PRIMARY KEY,
                key_value TEXT NOT NULL,
                provider VARCHAR(32) NOT NULL,
                description VARCHAR(255),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );";
        }

        try {
            $pdo->exec($sql);
            self::$tableInitialized = true;
            return true;
        } catch (PDOException $e) {
            self::$lastError = "Failed to create keys table in Aurora RDS: " . $e->getMessage();
            return false;
        }
    }

    /**
     * Retrieve an API key for a given provider from Aurora RDS
     */
    public static function getApiKey(string $provider): ?string {
        $pdo = self::getConnection();
        if (!$pdo) return null;

        $cleanProvider = strtolower(trim($provider));
        $keyName = "{$cleanProvider}_api_key";

        try {
            $stmt = $pdo->prepare("SELECT key_value FROM stickforge_api_keys WHERE key_name = :keyName OR provider = :provider ORDER BY updated_at DESC LIMIT 1");
            $stmt->execute(['keyName' => $keyName, 'provider' => $cleanProvider]);
            $row = $stmt->fetch();
            return $row ? trim($row['key_value']) : null;
        } catch (PDOException $e) {
            self::$lastError = "Error reading key from Aurora RDS: " . $e->getMessage();
            return null;
        }
    }

    /**
     * Save an API key into Aurora RDS (Upsert)
     */
    public static function setApiKey(string $provider, string $keyValue, string $description = ''): bool {
        $pdo = self::getConnection();
        if (!$pdo) return false;

        $cleanProvider = strtolower(trim($provider));
        $cleanValue = trim($keyValue);
        $keyName = "{$cleanProvider}_api_key";

        if (empty($cleanValue)) {
            return self::deleteApiKey($cleanProvider);
        }

        $engine = self::getEngine();

        if ($engine === 'mysql') {
            $sql = "INSERT INTO stickforge_api_keys (key_name, key_value, provider, description, updated_at)
                    VALUES (:keyName, :keyValue, :provider, :description, CURRENT_TIMESTAMP)
                    ON DUPLICATE KEY UPDATE
                        key_value = VALUES(key_value),
                        description = VALUES(description),
                        updated_at = CURRENT_TIMESTAMP;";
        } else {
            $sql = "INSERT INTO stickforge_api_keys (key_name, key_value, provider, description, updated_at)
                    VALUES (:keyName, :keyValue, :provider, :description, CURRENT_TIMESTAMP)
                    ON CONFLICT (key_name)
                    DO UPDATE SET key_value = EXCLUDED.key_value,
                                  description = EXCLUDED.description,
                                  updated_at = CURRENT_TIMESTAMP;";
        }

        try {
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([
                'keyName' => $keyName,
                'keyValue' => $cleanValue,
                'provider' => $cleanProvider,
                'description' => $description ?: "StickForge {$cleanProvider} API Key"
            ]);
        } catch (PDOException $e) {
            self::$lastError = "Error saving key to Aurora RDS: " . $e->getMessage();
            return false;
        }
    }

    /**
     * Delete an API key from Aurora RDS
     */
    public static function deleteApiKey(string $provider): bool {
        $pdo = self::getConnection();
        if (!$pdo) return false;

        $cleanProvider = strtolower(trim($provider));
        $keyName = "{$cleanProvider}_api_key";

        try {
            $stmt = $pdo->prepare("DELETE FROM stickforge_api_keys WHERE key_name = :keyName OR provider = :provider");
            return $stmt->execute(['keyName' => $keyName, 'provider' => $cleanProvider]);
        } catch (PDOException $e) {
            self::$lastError = "Error deleting key from Aurora RDS: " . $e->getMessage();
            return false;
        }
    }

    /**
     * List all stored keys (masked for security)
     */
    public static function getAllKeys(): array {
        $pdo = self::getConnection();
        if (!$pdo) return [];

        try {
            $stmt = $pdo->query("SELECT key_name, provider, description, updated_at, LENGTH(key_value) as key_length, SUBSTRING(key_value, 1, 4) as prefix, SUBSTRING(key_value, LENGTH(key_value) - 3, 4) as suffix FROM stickforge_api_keys ORDER BY key_name ASC");
            $rows = $stmt->fetchAll();
            $result = [];
            foreach ($rows as $r) {
                $masked = ($r['key_length'] > 8)
                    ? "{$r['prefix']}..." . str_repeat('•', 8) . "...{$r['suffix']}"
                    : "••••••••";
                $result[$r['provider']] = [
                    'key_name' => $r['key_name'],
                    'provider' => $r['provider'],
                    'masked' => $masked,
                    'description' => $r['description'],
                    'updated_at' => $r['updated_at']
                ];
            }
            return $result;
        } catch (PDOException $e) {
            self::$lastError = "Error listing keys: " . $e->getMessage();
            return [];
        }
    }

    /**
     * Test connection and return diagnostics
     */
    public static function testConnection(): array {
        $startTime = microtime(true);
        $pdo = self::getConnection();
        $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);
        $engine = self::getEngine();

        if (!$pdo) {
            return [
                'ok' => false,
                'configured' => self::isConfigured(),
                'error' => self::$lastError ?: 'Connection failed',
                'host' => self::getHost(),
                'engine' => $engine,
                'port' => self::getPort(),
                'region' => self::getRegion(),
                'driver' => ($engine === 'mysql')
                    ? (extension_loaded('pdo_mysql') ? 'pdo_mysql' : 'missing')
                    : (extension_loaded('pdo_pgsql') ? 'pdo_pgsql' : 'missing')
            ];
        }

        try {
            $stmt = $pdo->query("SELECT CURRENT_TIMESTAMP as ts, VERSION() as ver");
            $data = $stmt->fetch();
            return [
                'ok' => true,
                'configured' => true,
                'host' => self::getHost(),
                'engine' => $engine,
                'port' => self::getPort(),
                'region' => self::getRegion(),
                'database' => sf_env('AURORA_RDS_DATABASE', $engine === 'mysql' ? 'stickforge' : 'postgres'),
                'user' => sf_env('AURORA_RDS_USER', $engine === 'mysql' ? 'admin' : 'postgres'),
                'latency_ms' => $elapsedMs,
                'server_time' => $data['ts'] ?? null,
                'engine_version' => $data['ver'] ?? 'Aurora-compatible'
            ];
        } catch (PDOException $e) {
            return [
                'ok' => false,
                'configured' => true,
                'engine' => $engine,
                'error' => $e->getMessage(),
                'latency_ms' => $elapsedMs
            ];
        }
    }

    public static function getLastError(): ?string {
        return self::$lastError;
    }
}
