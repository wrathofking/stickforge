# StickForge 2D Studio (v5.0 Web)

**StickForge 2D** is a complete, modular web application for generating and animating 2D stick-figure stories, powered by Google Gemini, Google Imagen, and AI Voiceover TTS.

---

## 📁 Web Application File System Structure

The codebase is organized into a clean, modern web application architecture:

```text
stickforge/
├── api/                           # PHP Backend API Endpoints (Gateway & Proxy)
│   ├── config.php                 # Environment loader, CORS headers & cURL helpers
│   ├── gemini.php                 # Gemini Scriptwriter, Style DNA Cloner & Model Forge
│   ├── images.php                 # 2D Background generator (Imagen 3 & DALL-E proxy)
│   ├── tts.php                    # AI Voiceover synthesizer (Gemini, ElevenLabs, OpenAI)
│   ├── projects.php               # Server-side project persistence (Save, Load, List, Delete)
│   └── health.php                 # Server diagnostic & API key status check
│
├── assets/                        # Client-Side Assets
│   ├── css/
│   │   ├── theme.css              # Design tokens, color system & CSS variables
│   │   └── main.css               # Separated styling, custom scrollbars, animations & components
│   └── js/
│       ├── tailwind-config.js     # Separated Tailwind CDN configuration
│       ├── store.js               # Central state, 14 expressions, 14 motions, models & gallery
│       ├── services-ai.js         # AI service layer with auto-retry, proxy routing & BYOK fallback
│       ├── renderer-2d.js         # 2D Canvas engine, kinematics, attachments & procedural plates
│       ├── components.js          # Custom Web Components (<sf-header>, <sf-stage-canvas>, etc.)
│       └── app.js                 # App bootstrapper, toast notifications & keyboard shortcuts
│
├── config/
│   └── .env.example               # Environment variables template
│
├── data/
│   └── projects/                  # Server-side project storage directory (.htaccess protected)
│       ├── .gitkeep
│       └── .htaccess
│
├── index.php                      # Production PHP entry point (security headers & config injection)
├── index.html                     # Static HTML5 entry point (for static hosting or preview)
├── .htaccess                      # Production Apache configuration (MIME types, caching, security)
├── nginx.conf.example             # Production Nginx server block configuration
├── Dockerfile                     # Docker container recipe (PHP 8.2 + Apache + cURL)
├── docker-compose.yml             # Single-command container deployment
└── README.md                      # Documentation
```

---

## 🛠️ API Call Problems Resolved

1. **Eliminated Client-Side CORS Restrictions**:
   - Calling OpenAI (`/v1/images/generations`, `/v1/audio/speech`) or ElevenLabs directly from the browser triggers CORS errors. The PHP backend (`api/images.php`, `api/tts.php`) acts as a server-to-server proxy, resolving CORS issues completely.
2. **Eliminated API Key Exposure**:
   - API keys can now be safely stored in the server environment (`config/.env`), so users visiting your web app don't have to enter their own credentials.
   - Dual-mode support (BYOK): If users prefer to use their own personal keys, they can still provide them via the API Settings modal (`X-API-Key`).
3. **Corrected Model Identifiers**:
   - Replaced invalid/unreleased model names (e.g. `gemini-3-flash-preview` and `gemini-3.1-flash-image`) with verified official Google models:
     - **Text & Scripts**: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`
     - **Image Generation**: `imagen-3.0-generate-002`
4. **Resolved Google Search Grounding Conflict**:
   - In Gemini v1beta, combining search grounding (`googleSearch`) with strict JSON schema mode (`responseMimeType: "application/json"`) causes a 400 Bad Request error. The API gateway formats the prompts cleanly to guarantee valid structured JSON without conflicts.
5. **Replaced Silent Failures with Actionable Diagnostics**:
   - Previously, empty `catch (e) {}` blocks swallowed errors and silently reverted to hardcoded defaults without notifying the user.
   - Now, errors are reported via user-visible toast notifications and descriptive JSON HTTP responses (`401 Missing Key`, `502 Rate Limit`, etc.), and graceful procedural fallbacks are applied.
6. **Built-in Server Storage**:
   - Added `api/projects.php` and updated `<sf-cloud-modal>` so users can save and load projects directly to and from your web server with 1 click, without requiring external AWS S3 or Google Drive OAuth tokens.
7. **Dynamic Model Selection Dropdown (All Available Models)**:
   - When an API key is provided (either from the server `.env` or entered by the user), the system queries the Google Gemini API (`GET /v1beta/models` via `api/gemini.php?action=list_models` or direct client fallback) and populates a dynamic dropdown containing all available models.
   - Users can select models from the **Top Header Badge**, the **Gemini Script Generation Panel**, or the **API Settings Modal**, with models grouped into *Text & Multimodal Generation* and *Other Gemini Models*.
8. **Amazon Aurora RDS Key Vault**:
   - Replaced plain local file API key storage with **Amazon Aurora RDS** (Relational Database Service) storage in the `stickforge_api_keys` table.
   - Dual-engine compatibility: supports both **Amazon Aurora PostgreSQL** (port 5432) and **Amazon Aurora MySQL** (port 3306).
   - Flexible authentication: supports standard database master credentials (`username` + `password`) as well as AWS IAM Database Authentication (`rds-db:connect`).
   - Auto-creates the keys table upon first connection, and provides automatic graceful fallback to `.env` if Aurora RDS is unconfigured or unreachable.

---

## ⚡ Amazon Aurora RDS Key Vault Setup

To store API keys in Amazon Aurora RDS instead of local files:

### 1. Credentials & Connection Information Needed
Set the following variables in `config/.env` (or in your host environment):

```env
# Activate Aurora RDS
AURORA_RDS_ENABLED=true

# Database Engine: 'postgres' (default) or 'mysql'
AURORA_RDS_ENGINE=postgres

# Aurora RDS Cluster Endpoint (from AWS RDS Management Console)
AURORA_RDS_HOST=my-aurora-cluster.cluster-c123456789.us-east-1.rds.amazonaws.com

# Database Connection Settings
AURORA_RDS_PORT=5432              # 5432 for Aurora PostgreSQL, 3306 for Aurora MySQL
AURORA_RDS_DATABASE=stickforge    # Database name (e.g. stickforge, postgres, or custom)
AURORA_RDS_USER=postgres          # Master username or DB user
AURORA_RDS_PASSWORD=your_password # Database password

# SSL Mode (for PostgreSQL: 'prefer' or 'require')
AURORA_RDS_SSL=prefer

# (Optional) AWS IAM Database Authentication (if not using password)
AURORA_RDS_REGION=us-east-1
AURORA_RDS_TOKEN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
```

### 2. Database Schema (Auto-Provisioned)
StickForge automatically creates the table upon first connection:
* **For Aurora PostgreSQL:**
```sql
CREATE TABLE IF NOT EXISTS stickforge_api_keys (
    key_name VARCHAR(64) PRIMARY KEY,
    key_value TEXT NOT NULL,
    provider VARCHAR(32) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
* **For Aurora MySQL:**
```sql
CREATE TABLE IF NOT EXISTS stickforge_api_keys (
    key_name VARCHAR(64) NOT NULL,
    key_value TEXT NOT NULL,
    provider VARCHAR(32) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. Testing the Connection
You can test the connection anytime:
* In the UI: Open **🔑 API Keys** modal and click **Test RDS**.
* Via API: Call `GET /api/keys.php?action=test_rds`.

---

## 🚀 Deployment Instructions

### Option 1: Amazon Amplify Hosting (Instant GitHub CI/CD Deployment)

StickForge 2D is fully pre-configured for **AWS Amplify Hosting** via [`amplify.yml`](amplify.yml). Pushing to GitHub triggers an instant automated build and global CloudFront CDN deployment.

#### Step 1: Push Repository to GitHub
```bash
# 1. Add your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 2. Push main branch
git push -u origin main
```

#### Step 2: Deploy on AWS Amplify Console
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/amplify).
2. Click **Create new app** (or **Host web app**).
3. Select **GitHub** as your repository provider and authorize AWS Amplify.
4. Select your **Repository** and branch (`main`).
5. Amplify will automatically detect [`amplify.yml`](amplify.yml) and auto-fill the build settings:
   - **Build command**: `npm run build`
   - **Base directory**: `dist`
6. Click **Next** -> **Save and deploy**.

#### Step 3: Single Page Application (SPA) Rewrites & Redirects
To ensure seamless client-side routing on Amplify:
1. In the Amplify Console, navigate to **App settings** > **Rewrites and redirects**.
2. Click **Edit** and ensure the default SPA rewrite rule is set:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. Click **Save**.

#### Step 4: Access Your Studio
Within 1-2 minutes, Amplify will deploy your application to a live public URL:
`https://main.<app-id>.amplifyapp.com`

- **Zero-Backend Client Mode**: The application runs 100% in client-side BYOK mode on Amazon CloudFront CDN. Enter your Google Gemini API key in the UI to unlock all models and generate scripts instantly. API keys and model preferences are safely stored in browser `localStorage`.
- **Full-Stack Hybrid Mode (Optional)**: If you also run the PHP + Aurora RDS container (e.g. on AWS App Runner or ECS), enter your backend URL in **🔑 AI Gateway Settings** (`Backend Gateway URL`) to route through your private Aurora RDS key vault.

---

### Option 2: Local PHP Development Server
If you have PHP installed:
```bash
# 1. Copy environment template
cp config/.env.example .env

# 2. Add your Gemini API key in .env
# GEMINI_API_KEY=your_key_here

# 3. Start PHP built-in server
php -S localhost:8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

### Option 3: Apache / cPanel / Shared Hosting
1. Upload the entire project directory to your web root (`public_html` or virtual host directory).
2. Ensure the `.htaccess` file is uploaded.
3. Ensure `data/projects/` is writable by PHP (`chmod 775 data/projects`).
4. Copy `config/.env.example` to `.env` in the root (or `config/.env`), and populate your `GEMINI_API_KEY`.
5. Browse to your domain: `https://yourdomain.com/index.php`.

---

### Option 4: Nginx + PHP-FPM
1. Copy `nginx.conf.example` to `/etc/nginx/sites-available/stickforge`.
2. Update `server_name` and `root` to point to your deployment path.
3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/stickforge /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Option 5: Docker & Docker Compose
To run in an isolated container:
```bash
# Set your key in your shell or .env
export GEMINI_API_KEY=your_key_here

# Launch container
docker compose up -d
```
Access the studio at [http://localhost:8080](http://localhost:8080).

---

### Option 6: Static Web Hosting (GitHub Pages, Vercel, Netlify)
StickForge 2D is designed with automatic client-side fallback:
- When hosted without PHP, `index.html` loads cleanly.
- `services-ai.js` detects that the backend is unavailable and operates in **BYOK Client Mode**, allowing users to supply their own Gemini / OpenAI / ElevenLabs API keys in the settings modal.
- Projects are automatically saved in the browser's IndexedDB / localStorage or exported as `.json` project bundles.

---

## ⌨️ Keyboard Shortcuts
- **Spacebar**: Play / Pause 2D playback
- **Ctrl + Z / Cmd + Z**: Undo last storyboard change
- **Left Arrow**: Previous Shot
- **Right Arrow**: Next Shot
