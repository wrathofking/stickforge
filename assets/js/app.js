/**
 * StickForge 2D - Main Application Bootstrapper
 * Initializes global event listeners, toasts, keyboard shortcuts & server check
 */
(function() {
  // 1. Toast Notification Manager
  function initToastManager() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      document.body.appendChild(container);
    }

    window.StickForgeBus.on("status:toast", (detail) => {
      const msg = typeof detail === "string" ? detail : (detail.message || "Notification");
      const toast = document.createElement("div");
      toast.className = "sf-toast bg-studio-panel border border-studio-border text-slate-100";
      toast.innerHTML = `<span class="flex-1">${msg}</span><button class="text-slate-400 hover:text-white font-bold ml-2">✕</button>`;

      toast.querySelector("button").addEventListener("click", () => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px) scale(0.95)";
        setTimeout(() => toast.remove(), 250);
      });

      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.opacity = "0";
          toast.style.transform = "translateY(10px) scale(0.95)";
          setTimeout(() => toast.remove(), 250);
        }
      }, 4500);
    });
  }

  // 2. Global Keyboard Shortcuts
  function initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
        return;
      }

      const store = window.StickForgeStore;
      if (!store) return;

      // Spacebar: Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        store.isPlaying = !store.isPlaying;
        window.StickForgeBus.emit("timeline:playstate", { isPlaying: store.isPlaying });
        return;
      }

      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        store.undo();
        window.StickForgeBus.emit("status:toast", { message: "↩️ Undone last action." });
        return;
      }

      // Left Arrow: Previous Shot
      if (e.key === "ArrowLeft") {
        if (store.currentShotIndex > 0) {
          store.currentShotIndex--;
          store.currentTime = store.getShotStartTime(store.currentShotIndex);
          store.shotElapsed = 0;
          window.StickForgeBus.emit("shot:selected", { index: store.currentShotIndex });
        }
      }

      // Right Arrow: Next Shot
      if (e.key === "ArrowRight") {
        if (store.currentShotIndex < store.shots.length - 1) {
          store.currentShotIndex++;
          store.currentTime = store.getShotStartTime(store.currentShotIndex);
          store.shotElapsed = 0;
          window.StickForgeBus.emit("shot:selected", { index: store.currentShotIndex });
        }
      }
    });
  }

  // 3. Web Server Health & Diagnostics Check
  async function checkServerHealth() {
    try {
      const res = await fetch("./api/health.php");
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const health = await res.json();
          if (health.ok) {
            if (window.StickForgeAI) window.StickForgeAI.backendAvailable = true;
            console.log("[StickForge 2D] Connected to Web Server API (PHP " + health.php_version + ")");
            const keySummary = [];
            if (health.server_keys?.gemini) keySummary.push("Gemini API");
            if (health.server_keys?.openai) keySummary.push("OpenAI");
            if (health.server_keys?.elevenlabs) keySummary.push("ElevenLabs");

            if (keySummary.length > 0) {
              console.log("[StickForge 2D] Server keys active:", keySummary.join(", "));
            }
            return;
          }
        }
      }
    } catch (e) {}

    // Static hosting mode (Amazon Amplify Hosting / Cloud CDN)
    if (window.StickForgeAI) window.StickForgeAI.backendAvailable = false;
    const isAmplify = window.location.hostname.includes("amplifyapp.com");
    if (isAmplify) {
      console.log("[StickForge 2D] Running on Amazon Amplify Hosting (CloudFront CDN • Direct Gemini BYOK Mode).");
    } else {
      console.log("[StickForge 2D] Running in client standalone / static hosting mode.");
    }
  }

  // 4. Initial Models Pre-fetch if API Key is Available
  async function initAvailableModels() {
    const store = window.StickForgeStore;
    const hasKey = store?.api?.llmKey || window.STICKFORGE_SERVER_CONFIG?.serverKeysConfigured;
    if (window.StickForgeAI?.fetchAvailableModels && hasKey) {
      try {
        await window.StickForgeAI.fetchAvailableModels();
      } catch (err) {
        console.warn("[StickForge 2D] Model pre-fetch:", err);
      }
    }
  }

  // Bootstrap when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initToastManager();
      initKeyboardShortcuts();
      checkServerHealth();
      initAvailableModels();
    });
  } else {
    initToastManager();
    initKeyboardShortcuts();
    checkServerHealth();
    initAvailableModels();
  }
})();
