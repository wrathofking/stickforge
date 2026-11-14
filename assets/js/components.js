// ---------------------------------------------------------------------
    // 1. <sf-header> Component
    // ---------------------------------------------------------------------
    class SfHeader extends HTMLElement {
      connectedCallback() {
        this.render();
        window.StickForgeBus.on("status:toast", (d) => {
          const el = this.querySelector("#headerToast");
          if (el && d.message) el.textContent = d.message;
        });
        window.StickForgeBus.on("cloud:synced", (d) => {
          const b = this.querySelector("#cloudBadgeText");
          if (b) b.textContent = d.label || "Cloud Synced";
        });
        window.StickForgeBus.on("model:changed", (d) => {
          const t = this.querySelector("#hdrModelText");
          if (t && d.model) t.textContent = d.model;
        });
      }

      render() {
        const store = window.StickForgeStore;
        this.innerHTML = `
          <header class="bg-studio-panel border-b border-studio-border px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2.5"></circle>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5v6m0 0l-3.5 5.5M12 13.5l3.5 5.5M7.5 10.5h9"></path>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-extrabold tracking-tight text-sm md:text-base text-white">StickForge 2D</span>
                  <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v5.0 Modular</span>
                </div>
                <p id="headerToast" class="text-[11px] text-emerald-300 truncate max-w-[260px] sm:max-w-[420px]">Articulated 16-Joint Rig • Motion Studio • Model Forge • Google Flow &amp; Gemini 3.1 TTS</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <select id="hdrStyleSelect" class="bg-studio-card border border-studio-border rounded-lg px-2 py-1 text-xs text-white">
                <option value="conchaser">ConChaser Clean 2D</option>
                <option value="mspaint">MS Paint Classic</option>
                <option value="neon">Dark Chalkboard Neon</option>
                <option value="sketch">Notebook Sketch</option>
              </select>

              <div class="flex items-center bg-studio-card border border-studio-border rounded-lg p-0.5 text-xs">
                <button id="hdr169" type="button" class="px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold">16:9</button>
                <button id="hdr916" type="button" class="px-2 py-0.5 rounded text-slate-400 hover:text-white">9:16</button>
              </div>

              <button id="hdrMotionBtn" type="button" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition">
                🏃 Motion Studio
              </button>

              <button id="hdrCloudBtn" type="button" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 transition">
                ☁️ <span id="cloudBadgeText">Cloud Storage</span>
              </button>

              <button id="hdrSplitBtn" type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-studio-card hover:bg-slate-800 border border-studio-border text-emerald-300 transition">
                📦 Split ES Modules
              </button>

              <button id="hdrModelBtn" type="button" class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 transition" title="Active Model — Click to configure">
                🤖 <span id="hdrModelText">${store.api.llmModel}</span>
              </button>

              <button id="hdrApiBtn" type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-studio-card hover:bg-slate-800 border border-studio-border text-slate-200 transition">
                🔑 API Keys
              </button>

              <button id="hdrExportWebm" type="button" class="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow">
                ⬇ Export .WEBM
              </button>
            </div>
          </header>
        `;

        this.querySelector("#hdrStyleSelect").value = store.visualStyle;
        this.querySelector("#hdrStyleSelect").addEventListener("change", (e) => {
          store.visualStyle = e.target.value;
        });
        this.querySelector("#hdr169").addEventListener("click", () => {
          store.aspectRatio = "16:9";
          this.querySelector("#hdr169").className = "px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold";
          this.querySelector("#hdr916").className = "px-2 py-0.5 rounded text-slate-400 hover:text-white";
          window.StickForgeBus.emit("stage:ratio");
        });
        this.querySelector("#hdr916").addEventListener("click", () => {
          store.aspectRatio = "9:16";
          this.querySelector("#hdr916").className = "px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold";
          this.querySelector("#hdr169").className = "px-2 py-0.5 rounded text-slate-400 hover:text-white";
          window.StickForgeBus.emit("stage:ratio");
        });
        this.querySelector("#hdrMotionBtn").addEventListener("click", () => window.StickForgeBus.emit("modal:motion:open"));
        this.querySelector("#hdrCloudBtn").addEventListener("click", () => window.StickForgeBus.emit("modal:cloud:open"));
        this.querySelector("#hdrSplitBtn").addEventListener("click", () => window.StickForgeBus.emit("modal:exporter:open"));
        this.querySelector("#hdrModelBtn")?.addEventListener("click", () => window.StickForgeBus.emit("modal:api:open"));
        this.querySelector("#hdrApiBtn").addEventListener("click", () => window.StickForgeBus.emit("modal:api:open"));
        this.querySelector("#hdrExportWebm").addEventListener("click", () => window.StickForgeBus.emit("video:export"));
      }
    }
    customElements.define("sf-header", SfHeader);

    // ---------------------------------------------------------------------
    // 2. <sf-left-creation-hub> Component
    //    Tabs: Shots | Gemini Script | Style Cloner | Model & Prop Forge | Voice 3.1
    // ---------------------------------------------------------------------
    class SfLeftCreationHub extends HTMLElement {
      connectedCallback() {
        this.activeTab = "shots";
        this.render();
        window.StickForgeBus.on("shots:updated", () => this.renderShotsList());
        window.StickForgeBus.on("shot:selected", () => this.renderShotsList());
        window.StickForgeBus.on("styles:updated", () => this.populateStyleDropdown());
        window.StickForgeBus.on("gallery:updated", () => this.renderGalleryItems());
        window.StickForgeBus.on("models:loaded", (d) => this.populateHubModels(d.models));
        window.StickForgeBus.on("model:changed", (d) => {
          const sel = this.querySelector("#hubScriptModelSelect");
          if (sel && sel.value !== d.model) sel.value = d.model;
        });
      }

      switchTab(tab) {
        this.activeTab = tab;
        ["shots", "script", "cloner", "forge", "voice"].forEach(t => {
          const btn = this.querySelector(`#tabBtn_${t}`);
          const pane = this.querySelector(`#tabPane_${t}`);
          if (!btn || !pane) return;
          if (t === tab) {
            btn.className = "py-2 text-center border-b-2 border-indigo-500 text-white font-semibold transition";
            pane.classList.remove("hidden");
          } else {
            btn.className = "py-2 text-center border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
            pane.classList.add("hidden");
          }
        });
      }

      render() {
        const store = window.StickForgeStore;
        this.innerHTML = `
          <div class="grid grid-cols-5 border-b border-studio-border bg-studio-bg/60 text-[10px]">
            <button id="tabBtn_shots" type="button" class="py-2 text-center border-b-2 border-indigo-500 text-white font-semibold">🎬 Shots (<span id="hubShotCount">${store.shots.length}</span>)</button>
            <button id="tabBtn_script" type="button" class="py-2 text-center border-b-2 border-transparent text-slate-400">✨ Script</button>
            <button id="tabBtn_cloner" type="button" class="py-2 text-center border-b-2 border-transparent text-slate-400">🧬 Style</button>
            <button id="tabBtn_forge" type="button" class="py-2 text-center border-b-2 border-transparent text-slate-400">🎨 Models</button>
            <button id="tabBtn_voice" type="button" class="py-2 text-center border-b-2 border-transparent text-slate-400">🔊 Voice 3.1</button>
          </div>

          <!-- PANE 1: SHOTS LIST (NO SHOT LIMIT) -->
          <div id="tabPane_shots" class="flex-1 flex flex-col overflow-hidden p-2.5 gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300">Unlimited Storyboard</span>
              <div class="flex gap-1">
                <button id="btnAddShot" type="button" class="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold">+ Shot</button>
                <button id="btnCopyShot" type="button" class="px-2 py-1 rounded bg-studio-card hover:bg-slate-700 text-slate-300 border border-studio-border text-[11px]">Copy</button>
              </div>
            </div>
            <div id="hubShotsContainer" class="flex-1 overflow-y-auto space-y-1.5 pr-1"></div>
          </div>

          <!-- PANE 2: GEMINI SCRIPT GENERATOR WITH MINUTE DURATION CONFIG -->
          <div id="tabPane_script" class="hidden flex-1 flex flex-col overflow-y-auto p-2.5 space-y-2.5">
            <div class="bg-studio-card border border-indigo-500/40 rounded-lg p-2.5 space-y-2">
              <span class="text-xs font-bold text-indigo-300 block">Gemini Script Writer (No Shot Limit)</span>
              <input id="scrTopicInput" type="text" value="What if you could see everyone's IQ floating above their head?" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-white" />
              
              <!-- Gemini Model Dropdown -->
              <div>
                <div class="flex items-center justify-between mb-0.5">
                  <label class="text-[10px] text-indigo-300 font-bold flex items-center gap-1">🤖 Gemini Model</label>
                  <span id="hubModelCountBadge" class="text-[9px] text-slate-400">Loading models...</span>
                </div>
                <select id="hubScriptModelSelect" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-white font-mono"></select>
              </div>

              <div class="grid grid-cols-2 gap-1.5">
                <div>
                  <label class="text-[10px] text-slate-400 block">Writing Style DNA</label>
                  <select id="scrStyleSelect" class="w-full bg-studio-bg border border-studio-border rounded px-1.5 py-1 text-[11px] text-white"></select>
                </div>
                <div>
                  <label class="text-[10px] text-emerald-300 font-semibold block">Target Length (Mins)</label>
                  <input id="scrMinutesInput" type="number" min="0.5" max="60" step="0.5" value="1.0" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs font-mono text-white" />
                </div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>Quick Length:</span>
                <div class="flex gap-1">
                  <button type="button" data-min="1" class="min-preset px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-slate-300">1m</button>
                  <button type="button" data-min="3" class="min-preset px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-slate-300">3m</button>
                  <button type="button" data-min="5" class="min-preset px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-slate-300">5m</button>
                  <button type="button" data-min="12" class="min-preset px-1.5 py-0.5 rounded bg-studio-bg border border-studio-border text-slate-300">12m</button>
                </div>
              </div>
              <button id="btnWriteGeminiScript" type="button" class="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow">
                ✨ Write Script with Gemini API
              </button>
            </div>
            <textarea id="scrFullTextarea" rows="8" class="flex-1 w-full bg-studio-bg border border-studio-border rounded p-2 text-xs text-slate-200 leading-relaxed resize-none"></textarea>
            <label class="flex items-center justify-between bg-studio-card border border-indigo-500/30 rounded-lg px-2.5 py-1.5 cursor-pointer">
              <span class="text-[11px] font-medium text-indigo-200">🌊 Auto-generate Google Flow 2D BGs on build</span>
              <input id="scrAutoFlowToggle" type="checkbox" ${store.api.defaultGoogleFlowBg ? "checked" : ""} class="accent-indigo-500 rounded" />
            </label>
            <button id="btnBuildStoryboard" type="button" class="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow">
              ⚡ Build Unlimited 2D Storyboard
            </button>
          </div>

          <!-- PANE 3: WRITING STYLE CLONER (YOUTUBE URL OR TRANSCRIPT) -->
          <div id="tabPane_cloner" class="hidden flex-1 flex flex-col overflow-y-auto p-2.5 space-y-2.5">
            <div class="bg-studio-card border border-purple-500/40 rounded-lg p-2.5 space-y-2">
              <span class="text-xs font-bold text-purple-300 block">🧬 Clone Style from YouTube URL or Script</span>
              <input id="cloneNameInput" type="text" placeholder="Style Name (e.g. ConChaser Viral Hook)" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-white" />
              <textarea id="cloneSourceInput" rows="4" placeholder="Paste YouTube URL (https://youtu.be/2TsZSQ77E9o) OR paste an existing script transcript..." class="w-full bg-studio-bg border border-studio-border rounded p-2 text-xs text-slate-200 resize-none">https://youtu.be/2TsZSQ77E9o</textarea>
              <button id="btnExtractStyleDna" type="button" class="w-full py-1.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold">
                🧬 Extract &amp; Save Writing Style DNA
              </button>
            </div>
            <div id="styleDnaList" class="space-y-1.5 text-xs"></div>
          </div>

          <!-- PANE 4: AI MODEL & PROP FORGE + MODEL GALLERY -->
          <div id="tabPane_forge" class="hidden flex-1 flex flex-col overflow-y-auto p-2.5 space-y-2.5">
            <div class="bg-studio-card border border-amber-500/40 rounded-lg p-2.5 space-y-2">
              <span class="text-xs font-bold text-amber-300 block">🎨 AI Stick Model &amp; Object Prop Forge</span>
              <div class="grid grid-cols-2 gap-1.5 text-xs">
                <select id="forgeKindSelect" class="bg-studio-bg border border-studio-border rounded px-2 py-1 text-white">
                  <option value="character">New Stick Character</option>
                  <option value="object">New 2D Object / Clothing</option>
                </select>
                <select id="forgeSubtypeSelect" class="bg-studio-bg border border-studio-border rounded px-2 py-1 text-white">
                  <option value="humanoid">Humanoid Rig</option>
                  <option value="animal">Animal (Quadruped)</option>
                  <option value="hand">Hand-Held Object</option>
                  <option value="head">Headwear / Hat</option>
                  <option value="back">Back / Cape / Bag</option>
                </select>
              </div>
              <input id="forgePromptInput" type="text" placeholder="e.g. Golden Retriever, Cyber Samurai, Electric Guitar, Pizza Slice..." class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-white" />
              <button id="btnForgeGenerate" type="button" class="w-full py-1.5 rounded bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-extrabold text-xs shadow">
                ✨ Generate &amp; Save to Model Gallery
              </button>
            </div>

            <div class="space-y-1.5">
              <span class="text-[11px] font-bold uppercase text-slate-400 block">Saved Stick Models (Click to Spawn/Apply)</span>
              <div id="galleryCharList" class="grid grid-cols-1 gap-1.5"></div>
              <span class="text-[11px] font-bold uppercase text-slate-400 block pt-2">Saved Objects &amp; Clothing (Click to Attach)</span>
              <div id="galleryObjList" class="grid grid-cols-2 gap-1.5"></div>
            </div>
          </div>

          <!-- PANE 5: GEMINI 3.1 FLASH TTS & SOUND DESIGN MODULE -->
          <div id="tabPane_voice" class="hidden flex-1 flex flex-col overflow-y-auto p-2.5 space-y-2.5">
            <div class="bg-studio-card border border-emerald-500/40 rounded-lg p-2.5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Gemini 3.1 Flash TTS</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Expressive Tags</span>
              </div>

              <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Prebuilt Gemini Narrator Voice</label>
                <select id="voiceGemSelect" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1.5 text-xs text-white">
                  <option value="Puck">Puck (Upbeat Viral Storyteller)</option>
                  <option value="Kore">Kore (Firm Dramatic Narrator)</option>
                  <option value="Zephyr">Zephyr (Bright &amp; Expressive)</option>
                  <option value="Charon">Charon (Deep Informative)</option>
                  <option value="Fenrir">Fenrir (Excitable Fast Pacing)</option>
                  <option value="Aoede">Aoede (Breezy Conversational)</option>
                  <option value="Orus">Orus (Confident &amp; Crisp)</option>
                  <option value="Sulafat">Sulafat (Warm &amp; Reflective)</option>
                </select>
              </div>

              <div class="bg-studio-bg/80 border border-studio-border rounded p-2 space-y-1.5">
                <span class="block text-[10px] font-mono uppercase text-indigo-300">Insert Expressive 3.1 Audio Tag into Current Shot:</span>
                <div class="flex flex-wrap gap-1">
                  <button type="button" data-tts-tag="[excitedly]" class="tts-tag-btn px-1.5 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-[10px] font-mono text-emerald-300 border border-studio-border">[excitedly]</button>
                  <button type="button" data-tts-tag="[whispers]" class="tts-tag-btn px-1.5 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-[10px] font-mono text-sky-300 border border-studio-border">[whispers]</button>
                  <button type="button" data-tts-tag="[shocked]" class="tts-tag-btn px-1.5 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-[10px] font-mono text-rose-300 border border-studio-border">[shocked]</button>
                  <button type="button" data-tts-tag="[awe]" class="tts-tag-btn px-1.5 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-[10px] font-mono text-purple-300 border border-studio-border">[awe]</button>
                  <button type="button" data-tts-tag="[short pause]" class="tts-tag-btn px-1.5 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-[10px] font-mono text-amber-300 border border-studio-border">[short pause]</button>
                  <button type="button" data-tts-tag="[laughs]" class="tts-tag-btn px-1.5 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-[10px] font-mono text-pink-300 border border-studio-border">[laughs]</button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-1.5 pt-1">
                <button id="btnSynthShotTts" type="button" class="py-1.5 px-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition">
                  🔊 Synth Current Shot
                </button>
                <button id="btnSynthAllShotsTts" type="button" class="py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition">
                  ⚡ All Shots 3.1 TTS
                </button>
              </div>
            </div>

            <div class="bg-studio-card border border-studio-border rounded-lg p-2.5 space-y-1.5">
              <label class="block text-xs font-semibold text-slate-200">Upload Voiceover File (.MP3 / .WAV)</label>
              <input id="customVoiceUpload" type="file" accept="audio/*" class="w-full text-[11px] text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white" />
            </div>

            <div class="bg-studio-card border border-studio-border rounded-lg p-2.5 space-y-2 text-xs">
              <span class="block font-bold text-white">Sound Design &amp; SFX</span>
              <label class="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Speak Narration on Play</span>
                <input id="chkEnableSpeech" type="checkbox" ${store.enableSpeech ? "checked" : ""} class="accent-indigo-500" />
              </label>
              <label class="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Procedural SFX (Pops, Buzzers, Ding)</span>
                <input id="chkEnableSfx" type="checkbox" ${store.enableSfx ? "checked" : ""} class="accent-indigo-500" />
              </label>
              <div class="grid grid-cols-4 gap-1 pt-1">
                <button type="button" data-sfx="pop" class="sfx-test-btn py-1 rounded bg-studio-bg hover:bg-slate-800 border border-studio-border text-[10px] text-slate-300">Pop</button>
                <button type="button" data-sfx="ding" class="sfx-test-btn py-1 rounded bg-studio-bg hover:bg-slate-800 border border-studio-border text-[10px] text-emerald-300">A+ Ding</button>
                <button type="button" data-sfx="buzzer" class="sfx-test-btn py-1 rounded bg-studio-bg hover:bg-slate-800 border border-studio-border text-[10px] text-rose-300">Buzzer</button>
                <button type="button" data-sfx="whoosh" class="sfx-test-btn py-1 rounded bg-studio-bg hover:bg-slate-800 border border-studio-border text-[10px] text-indigo-300">Whoosh</button>
              </div>
            </div>
          </div>
        `;

        ["shots", "script", "cloner", "forge", "voice"].forEach(t => {
          this.querySelector(`#tabBtn_${t}`).addEventListener("click", () => this.switchTab(t));
        });

        this.renderShotsList();
        this.populateStyleDropdown();
        this.populateHubModels(store.api.availableModels);
        this.renderGalleryItems();
        this.querySelector("#scrFullTextarea").value = store.shots.map(s => s.narration).join("\n\n");

        const hubModelSel = this.querySelector("#hubScriptModelSelect");
        if (hubModelSel) {
          hubModelSel.addEventListener("change", (e) => {
            store.api.llmModel = e.target.value;
            window.StickForgeBus.emit("model:changed", { model: e.target.value });
            window.StickForgeBus.emit("status:toast", { message: `Active Model: ${e.target.value}` });
          });
        }

        // Shots Buttons
        this.querySelector("#btnAddShot").addEventListener("click", async () => {
          store.pushUndo();
          const newShot = {
            id: "shot_" + Date.now(),
            setting: "hallway",
            camera: "zoom_in",
            duration: 6.0,
            sfx: "pop",
            narration: "[shocked] In the school hallway, everyone stared as 195 IQ appeared above the quiet transfer student.",
            characters: JSON.parse(JSON.stringify(store.getCurrentShot().characters))
          };
          store.shots.push(newShot);
          store.currentShotIndex = store.shots.length - 1;
          window.StickForgeBus.emit("shots:updated");
          if (store.api.defaultGoogleFlowBg) {
            await window.StickForgeAI.generateFlowBackground(newShot, newShot.narration);
          }
        });

        this.querySelector("#btnCopyShot").addEventListener("click", () => {
          store.pushUndo();
          const copy = JSON.parse(JSON.stringify(store.getCurrentShot()));
          copy.id = "shot_" + Date.now();
          store.shots.splice(store.currentShotIndex + 1, 0, copy);
          store.currentShotIndex++;
          window.StickForgeBus.emit("shots:updated");
        });

        // Script Tab Buttons
        this.querySelectorAll(".min-preset").forEach(btn => {
          btn.addEventListener("click", () => {
            this.querySelector("#scrMinutesInput").value = btn.dataset.min;
          });
        });

        this.querySelector("#btnWriteGeminiScript").addEventListener("click", async () => {
          const topic = this.querySelector("#scrTopicInput").value.trim();
          const mins = Number(this.querySelector("#scrMinutesInput").value) || 1.0;
          store.activeStyleId = this.querySelector("#scrStyleSelect").value;
          const paras = await window.StickForgeAI.generateScriptWithGemini(topic, store.getActiveStyle(), mins);
          this.querySelector("#scrFullTextarea").value = paras.join("\n\n");
          window.StickForgeBus.emit("status:toast", { message: `✨ Generated ${paras.length} paragraphs! Click Build Storyboard.` });
        });

        this.querySelector("#scrAutoFlowToggle").addEventListener("change", (e) => {
          store.api.defaultGoogleFlowBg = e.target.checked;
          window.StickForgeBus.emit("shots:updated");
        });

        this.querySelector("#btnBuildStoryboard").addEventListener("click", async () => {
          const raw = this.querySelector("#scrFullTextarea").value.trim();
          if (!raw) return;
          store.pushUndo();
          const paras = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
          store.shots = paras.map((p, idx) => ({
            id: "shot_" + Date.now() + "_" + idx,
            setting: idx % 3 === 0 ? "classroom" : idx % 3 === 1 ? "hallway" : "library",
            camera: idx % 2 === 0 ? "zoom_in" : "pan_right",
            duration: Math.max(4.5, Math.min(12, Number((p.split(/\s+/).length / 2.8).toFixed(1)))),
            sfx: "pop",
            narration: p,
            characters: JSON.parse(JSON.stringify(INITIAL_SHOTS[0].characters))
          }));
          store.currentShotIndex = 0;
          window.StickForgeBus.emit("shots:updated");
          this.switchTab("shots");
          if (store.api.defaultGoogleFlowBg) {
            for (let i = 0; i < store.shots.length; i++) {
              await window.StickForgeAI.generateFlowBackground(store.shots[i], store.shots[i].narration);
            }
          }
        });

        // Voice 3.1 Tab Listeners
        this.querySelector("#voiceGemSelect").addEventListener("change", (e) => {
          store.api.ttsVoiceName = e.target.value;
        });
        this.querySelectorAll(".tts-tag-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const shot = store.getCurrentShot();
            if (!shot) return;
            shot.narration = `${btn.dataset.ttsTag} ${shot.narration || ""}`.trim();
            window.StickForgeBus.emit("shots:updated");
            window.StickForgeBus.emit("status:toast", { message: `Added ${btn.dataset.ttsTag} to Shot ${store.currentShotIndex + 1} narration.` });
          });
        });
        this.querySelector("#btnSynthShotTts").addEventListener("click", () => {
          window.StickForgeAI.synthesizeShotAudio(store.getCurrentShot(), store.currentShotIndex);
        });
        this.querySelector("#btnSynthAllShotsTts").addEventListener("click", async () => {
          for (let i = 0; i < store.shots.length; i++) {
            await window.StickForgeAI.synthesizeShotAudio(store.shots[i], i);
          }
          window.StickForgeBus.emit("status:toast", { message: `🔊 Synthesized Gemini 3.1 TTS for all ${store.shots.length} shots!` });
        });
        this.querySelector("#customVoiceUpload").addEventListener("change", (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const shot = store.getCurrentShot();
          store.shotAudioUrls[shot.id] = URL.createObjectURL(f);
          window.StickForgeBus.emit("shots:updated");
          window.StickForgeBus.emit("status:toast", { message: `Attached voiceover "${f.name}" to Shot ${store.currentShotIndex + 1}.` });
        });
        this.querySelector("#chkEnableSpeech").addEventListener("change", (e) => { store.enableSpeech = e.target.checked; });
        this.querySelector("#chkEnableSfx").addEventListener("change", (e) => { store.enableSfx = e.target.checked; });
        this.querySelectorAll(".sfx-test-btn").forEach(b => {
          b.addEventListener("click", () => window.StickForgeRenderer.playSfx(b.dataset.sfx));
        });

        // Style Cloner Button
        this.querySelector("#btnExtractStyleDna").addEventListener("click", async () => {
          const src = this.querySelector("#cloneSourceInput").value.trim();
          const name = this.querySelector("#cloneNameInput").value.trim();
          if (!src) return;
          await window.StickForgeAI.analyzeWritingStyleFromSource(src, name);
        });

        // Model & Prop Forge Button
        this.querySelector("#btnForgeGenerate").addEventListener("click", async () => {
          const kind = this.querySelector("#forgeKindSelect").value;
          const sub = this.querySelector("#forgeSubtypeSelect").value;
          const prompt = this.querySelector("#forgePromptInput").value.trim();
          if (!prompt) return;
          const created = await window.StickForgeAI.generateCustomModelOrObject(kind, prompt, sub);
          this.querySelector("#forgePromptInput").value = "";
          window.StickForgeBus.emit("status:toast", { message: `🎨 Saved "${created.name}" to Model Gallery!` });
        });
      }

      renderShotsList() {
        const store = window.StickForgeStore;
        const countEl = this.querySelector("#hubShotCount");
        if (countEl) countEl.textContent = store.shots.length;
        const container = this.querySelector("#hubShotsContainer");
        if (!container) return;
        container.innerHTML = "";
        store.shots.forEach((s, idx) => {
          const d = document.createElement("div");
          d.className = `p-2 rounded-lg border border-studio-border bg-studio-card cursor-pointer transition ${idx === store.currentShotIndex ? "shot-active" : "hover:border-slate-600"}`;
          const hasAudio = Boolean(store.shotAudioUrls[s.id]);
          d.innerHTML = `
            <div class="flex items-center justify-between text-[11px] mb-0.5">
              <span class="font-bold text-white">Shot ${idx + 1} · <span class="capitalize text-indigo-300">${s.setting}</span></span>
              <div class="flex items-center gap-1">
                ${hasAudio ? '<span class="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-mono">3.1 WAV</span>' : ''}
                <span class="font-mono text-slate-400">${Number(s.duration).toFixed(1)}s</span>
              </div>
            </div>
            <p class="text-[11px] text-slate-300 line-clamp-2">${s.narration}</p>
          `;
          d.addEventListener("click", () => {
            store.currentShotIndex = idx;
            store.shotElapsed = 0;
            store.currentTime = store.getShotStartTime(idx);
            window.StickForgeBus.emit("shot:selected", { index: idx });
          });
          container.appendChild(d);
        });
      }

      populateStyleDropdown() {
        const store = window.StickForgeStore;
        const sel = this.querySelector("#scrStyleSelect");
        if (sel) {
          sel.innerHTML = store.writingStyles.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
          sel.value = store.activeStyleId;
        }
        const list = this.querySelector("#styleDnaList");
        if (list) {
          list.innerHTML = store.writingStyles.map(s => `
            <div class="p-2 rounded bg-studio-card border border-studio-border">
              <div class="font-bold text-white">${s.name}</div>
              <div class="text-[10px] text-slate-400 mt-0.5"><strong class="text-purple-300">Hook:</strong> ${s.hookFormula}</div>
            </div>
          `).join("");
        }
      }

      populateHubModels(models) {
        const sel = this.querySelector("#hubScriptModelSelect");
        const badge = this.querySelector("#hubModelCountBadge");
        if (!sel) return;
        const store = window.StickForgeStore;
        const currentModel = store.api.llmModel || "gemini-2.5-flash";

        if (!models || !models.length) {
          sel.innerHTML = `
            <option value="${currentModel}" selected>${currentModel} (Default)</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
          `;
          if (badge) badge.textContent = "Default models";
          return;
        }

        const genModels = models.filter(m => m.supportsGenerate !== false);
        const otherModels = models.filter(m => m.supportsGenerate === false);

        let html = `<optgroup label="✨ Text & Story Generation (${genModels.length})">`;
        html += genModels.map(m => `<option value="${m.id}" ${m.id === currentModel ? "selected" : ""}>${m.displayName || m.id} (${m.id})</option>`).join("");
        html += `</optgroup>`;

        if (otherModels.length) {
          html += `<optgroup label="Other Gemini Models (${otherModels.length})">`;
          html += otherModels.map(m => `<option value="${m.id}" ${m.id === currentModel ? "selected" : ""}>${m.displayName || m.id} (${m.id})</option>`).join("");
          html += `</optgroup>`;
        }

        sel.innerHTML = html;
        if (badge) badge.textContent = `✓ ${models.length} available`;
      }

      renderGalleryItems() {
        const store = window.StickForgeStore;
        const cList = this.querySelector("#galleryCharList");
        const oList = this.querySelector("#galleryObjList");
        if (!cList || !oList) return;

        cList.innerHTML = window.SF_MODEL_GALLERY.characterModels.map(m => `
          <div class="p-2 rounded bg-studio-card border border-studio-border flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-white">${m.name}</div>
              <div class="text-[10px] text-slate-400 uppercase font-mono">${m.category}</div>
            </div>
            <div class="flex gap-1">
              <button type="button" data-apply-model="${m.id}" class="px-2 py-0.5 rounded bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[10px] font-semibold">Apply</button>
              <button type="button" data-spawn-model="${m.id}" class="px-2 py-0.5 rounded bg-emerald-600/40 hover:bg-emerald-600 text-emerald-200 hover:text-white text-[10px] font-semibold">+ Spawn</button>
            </div>
          </div>
        `).join("");

        cList.querySelectorAll("[data-apply-model]").forEach(b => {
          b.addEventListener("click", () => {
            const shot = store.getCurrentShot();
            const ch = shot.characters?.[store.selectedCharIndex];
            if (ch) {
              ch.modelId = b.dataset.applyModel;
              window.StickForgeBus.emit("shots:updated");
            }
          });
        });

        cList.querySelectorAll("[data-spawn-model]").forEach(b => {
          b.addEventListener("click", () => {
            const m = window.SF_MODEL_GALLERY.characterModels.find(x => x.id === b.dataset.spawnModel);
            const shot = store.getCurrentShot();
            if (!m || !shot) return;
            store.pushUndo();
            shot.characters.push({
              id: "c_" + Date.now(),
              name: m.name.split(" ")[0],
              modelId: m.id,
              outfit: m.defaultColor || "#38bdf8",
              clothingStyle: m.category === "animal" ? "none" : "hoodie",
              badgeText: m.category === "animal" ? "50 IQ" : "140 IQ",
              badgeColor: "#38bdf8",
              expr: "happy",
              action: "idle",
              handR: "none", handL: "none", headwear: "none", backItem: "none",
              scale: 1.0, x: 50, y: 80, flip: false
            });
            store.selectedCharIndex = shot.characters.length - 1;
            window.StickForgeBus.emit("shots:updated");
          });
        });

        oList.innerHTML = window.SF_MODEL_GALLERY.objectModels.filter(o => o.id !== "none").map(o => `
          <button type="button" data-attach-obj="${o.id}" data-slot="${o.slot}" class="p-1.5 rounded bg-studio-card hover:bg-slate-800 border border-studio-border text-left">
            <div class="text-[11px] font-bold text-amber-200 truncate">${o.name}</div>
            <div class="text-[9px] font-mono uppercase text-slate-400">Slot: ${o.slot}</div>
          </button>
        `).join("");

        oList.querySelectorAll("[data-attach-obj]").forEach(b => {
          b.addEventListener("click", () => {
            const shot = store.getCurrentShot();
            const ch = shot.characters?.[store.selectedCharIndex];
            if (!ch) return;
            const slot = b.dataset.slot;
            if (slot === "head") ch.headwear = b.dataset.attachObj;
            else if (slot === "back") ch.backItem = b.dataset.attachObj;
            else ch.handR = b.dataset.attachObj;
            window.StickForgeBus.emit("shots:updated");
            window.StickForgeBus.emit("status:toast", { message: `Attached ${b.dataset.attachObj} to ${ch.name}!` });
          });
        });
      }
    }
    customElements.define("sf-left-creation-hub", SfLeftCreationHub);

    // ---------------------------------------------------------------------
    // 3. <sf-stage-canvas> Component
    // ---------------------------------------------------------------------
    class SfStageCanvas extends HTMLElement {
      connectedCallback() {
        this.render();
        this.canvas = this.querySelector("#mainStageCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.draggingIdx = -1;
        this.lastSpokenShotId = null;
        this.setupInteractions();
        requestAnimationFrame((ts) => this.loop(ts));

        window.StickForgeBus.on("stage:ratio", () => {
          const s = window.StickForgeStore;
          this.canvas.width = s.aspectRatio === "9:16" ? 540 : 960;
          this.canvas.height = s.aspectRatio === "9:16" ? 960 : 540;
        });
        window.StickForgeBus.on("shots:updated", () => this.syncTopToggles());
        window.StickForgeBus.on("bg:generating", (d) => {
          const ov = this.querySelector("#bgGenOverlay");
          if (ov) ov.classList.toggle("hidden", !d.status);
        });
        window.StickForgeBus.on("video:export", () => this.exportWebm());
      }

      syncTopToggles() {
        const store = window.StickForgeStore;
        const nameChk = this.querySelector("#chkShowNames");
        if (nameChk) nameChk.checked = store.showCharacterNames;
      }

      render() {
        const store = window.StickForgeStore;
        this.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span id="stageShotLabel" class="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold">Shot 1 / 3</span>
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <label class="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input id="chkShowCaptions" type="checkbox" ${store.showCaptions ? "checked" : ""} class="accent-indigo-500" />
                <span>Timed Captions</span>
              </label>
              <label class="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input id="chkShowBadges" type="checkbox" ${store.showBadges ? "checked" : ""} class="accent-indigo-500" />
                <span>Overhead Metrics</span>
              </label>
              <label class="flex items-center gap-1 text-emerald-300 font-semibold cursor-pointer">
                <input id="chkShowNames" type="checkbox" ${store.showCharacterNames ? "checked" : ""} class="accent-emerald-500" />
                <span>Character Names</span>
              </label>
              <label class="flex items-center gap-1 text-sky-300 cursor-pointer">
                <input id="chkShowJoints" type="checkbox" ${store.showJointPins ? "checked" : ""} class="accent-sky-500" />
                <span>Joint Pins</span>
              </label>
            </div>
          </div>

          <div class="flex-1 flex items-center justify-center canvas-checker rounded-xl border border-studio-border p-2 relative overflow-hidden min-h-[250px]">
            <canvas id="mainStageCanvas" width="960" height="540" class="max-w-full max-h-full rounded-lg shadow-2xl cursor-pointer bg-slate-900"></canvas>
            <div id="bgGenOverlay" class="hidden absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
              <div class="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs font-bold text-white">🌊 Google Flow: Generating 2D Cartoon Background...</p>
            </div>
            <div id="recBadge" class="hidden absolute top-4 right-4 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">● REC .WEBM</div>
          </div>

          <!-- AI Director Quick Edit Bar -->
          <div class="mt-2 bg-studio-panel border border-studio-border rounded-xl p-2">
            <div class="flex flex-wrap items-center justify-between gap-1 mb-1.5">
              <span class="text-[11px] font-bold text-indigo-400">⚡ Ask AI Director to Edit Rig, Props or Scene:</span>
              <div class="flex flex-wrap gap-1">
                <button type="button" data-dir="Add a loyal dog with 50 IQ" class="dir-quick text-[10px] px-2 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-amber-300 border border-studio-border">+ Add Dog (50 IQ)</button>
                <button type="button" data-dir="Give everyone coffee cups and cool sunglasses" class="dir-quick text-[10px] px-2 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-slate-300 border border-studio-border">Coffee + Shades</button>
                <button type="button" data-dir="Make everyone run in panic" class="dir-quick text-[10px] px-2 py-0.5 rounded bg-studio-card hover:bg-slate-700 text-slate-300 border border-studio-border">Panic Run</button>
              </div>
            </div>
            <div class="flex gap-1.5">
              <input id="directorPrompt" type="text" placeholder="e.g. 'Give Max a gold crown and laptop, make Oliver facepalm, hide character names'..." class="flex-1 bg-studio-bg border border-studio-border rounded-lg px-2.5 py-1 text-xs text-white" />
              <button id="btnDirectorApply" type="button" class="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Apply</button>
              <button id="btnDirectorUndo" type="button" class="px-2.5 py-1 rounded-lg bg-studio-card hover:bg-slate-700 text-slate-300 border border-studio-border text-xs">Undo</button>
            </div>
          </div>
        `;

        this.querySelector("#chkShowCaptions").addEventListener("change", (e) => { store.showCaptions = e.target.checked; });
        this.querySelector("#chkShowBadges").addEventListener("change", (e) => { store.showBadges = e.target.checked; });
        this.querySelector("#chkShowNames").addEventListener("change", (e) => {
          store.showCharacterNames = e.target.checked;
          window.StickForgeBus.emit("shots:updated");
        });
        this.querySelector("#chkShowJoints").addEventListener("change", (e) => { store.showJointPins = e.target.checked; });

        this.querySelector("#btnDirectorApply").addEventListener("click", () => {
          const inp = this.querySelector("#directorPrompt");
          this.applyDirectorCommand(inp.value);
          inp.value = "";
        });
        this.querySelectorAll(".dir-quick").forEach(b => {
          b.addEventListener("click", () => this.applyDirectorCommand(b.dataset.dir));
        });
        this.querySelector("#btnDirectorUndo").addEventListener("click", () => store.undo());
      }

      applyDirectorCommand(cmd) {
        if (!cmd || !cmd.trim()) return;
        const store = window.StickForgeStore;
        store.pushUndo();
        const shot = store.getCurrentShot();
        const p = cmd.toLowerCase();

        if (p.includes("hide") && p.includes("name")) store.showCharacterNames = false;
        if (p.includes("show") && p.includes("name")) store.showCharacterNames = true;

        if (p.includes("dog") || p.includes("cat")) {
          shot.characters.push({
            id: "pet_" + Date.now(),
            name: p.includes("cat") ? "Whiskers" : "Buster",
            modelId: p.includes("cat") ? "animal_cat" : "animal_dog",
            outfit: "#f59e0b",
            clothingStyle: "none",
            badgeText: "50 IQ",
            badgeColor: "#f59e0b",
            expr: "happy",
            action: "walk",
            handR: "none", handL: "none", headwear: "none", backItem: "none",
            scale: 1.0, x: 50, y: 82, flip: false
          });
        }

        (shot.characters || []).forEach(c => {
          if (p.includes("coffee")) c.handR = "coffee_cup";
          if (p.includes("laptop")) c.handR = "laptop";
          if (p.includes("phone")) c.handR = "phone";
          if (p.includes("crown")) c.headwear = "crown";
          if (p.includes("cap")) c.headwear = "grad_cap";
          if (p.includes("cape")) c.backItem = "cape";
          if (p.includes("cool") || p.includes("shades") || p.includes("sunglass")) c.expr = "cool";
          if (p.includes("facepalm")) { c.action = "facepalm"; c.expr = "deadpan"; }
          if (p.includes("panic") || p.includes("run")) { c.action = "run"; c.expr = "shocked"; }
        });

        window.StickForgeBus.emit("shots:updated");
        window.StickForgeBus.emit("status:toast", { message: `Applied AI Director edit: "${cmd}"` });
      }

      setupInteractions() {
        const getCoords = (e) => {
          const r = this.canvas.getBoundingClientRect();
          const cx = e.touches ? e.touches[0].clientX : e.clientX;
          const cy = e.touches ? e.touches[0].clientY : e.clientY;
          return { xPct: ((cx - r.left) / r.width) * 100, yPct: ((cy - r.top) / r.height) * 100 };
        };
        this.canvas.addEventListener("mousedown", (e) => {
          const store = window.StickForgeStore;
          const shot = store.getCurrentShot();
          const { xPct, yPct } = getCoords(e);
          for (let i = (shot.characters || []).length - 1; i >= 0; i--) {
            const ch = shot.characters[i];
            if (Math.abs(xPct - ch.x) < 11 && (ch.y - yPct) >= -6 && (ch.y - yPct) <= 44) {
              store.selectedCharIndex = i;
              this.draggingIdx = i;
              window.StickForgeBus.emit("char:selected");
              break;
            }
          }
        });
        window.addEventListener("mousemove", (e) => {
          if (this.draggingIdx === -1) return;
          const shot = window.StickForgeStore.getCurrentShot();
          const ch = shot.characters?.[this.draggingIdx];
          if (!ch) return;
          const { xPct, yPct } = getCoords(e);
          ch.x = Math.round(Math.max(8, Math.min(92, xPct)));
          ch.y = Math.round(Math.max(48, Math.min(92, yPct)));
          window.StickForgeBus.emit("char:moved");
        });
        window.addEventListener("mouseup", () => { this.draggingIdx = -1; });
      }

      loop(nowMs) {
        const store = window.StickForgeStore;
        if (!this.lastTs) this.lastTs = nowMs;
        const dt = Math.min(0.1, (nowMs - this.lastTs) / 1000) * store.playbackSpeed;
        this.lastTs = nowMs;

        const shot = store.getCurrentShot();
        if (shot) {
          const lbl = this.querySelector("#stageShotLabel");
          if (lbl) lbl.textContent = `Shot ${store.currentShotIndex + 1} / ${store.shots.length} · ${shot.setting}`;

          if (store.isPlaying) {
            const dur = Number(shot.duration) || 5;
            if (this.lastSpokenShotId !== shot.id) {
              this.lastSpokenShotId = shot.id;
              window.StickForgeRenderer.playSfx(shot.sfx);
              if (store.enableSpeech) {
                if (store.shotAudioUrls[shot.id]) {
                  if (this.activeAudio) this.activeAudio.pause();
                  this.activeAudio = new Audio(store.shotAudioUrls[shot.id]);
                  this.activeAudio.playbackRate = store.playbackSpeed || 1.0;
                  this.activeAudio.play().catch(() => {});
                } else if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance(shot.narration.replace(/\[[^\]]+\]/g, "")));
                }
              }
            }
            store.shotElapsed += dt;
            store.currentTime = store.getShotStartTime(store.currentShotIndex) + store.shotElapsed;
            if (store.shotElapsed >= dur) {
              if (store.loopShot) {
                store.shotElapsed = 0;
                this.lastSpokenShotId = null;
              } else if (store.currentShotIndex < store.shots.length - 1) {
                store.currentShotIndex++;
                store.shotElapsed = 0;
                window.StickForgeBus.emit("shot:selected");
              } else {
                store.isPlaying = false;
                this.lastSpokenShotId = null;
                window.StickForgeBus.emit("playback:changed");
              }
            }
            window.StickForgeBus.emit("time:tick");
          } else {
            this.lastSpokenShotId = null;
          }

          const W = this.canvas.width, H = this.canvas.height;
          const tSec = nowMs / 1000;
          const dur = Number(shot.duration) || 5;
          const prog = Math.max(0, Math.min(1, store.shotElapsed / dur));

          this.ctx.clearRect(0, 0, W, H);
          this.ctx.save();
          let zoom = shot.camera === "zoom_in" ? 1 + prog * 0.12 : shot.camera === "zoom_out" ? 1.12 - prog * 0.12 : 1.04;
          let panX = shot.camera === "pan_right" ? (0.5 - prog) * W * 0.06 : shot.camera === "shake" && store.isPlaying ? Math.sin(tSec * 40) * 4 : 0;
          this.ctx.translate(W / 2 + panX, H / 2);
          this.ctx.scale(zoom, zoom);
          this.ctx.translate(-W / 2, -H / 2);

          window.StickForgeRenderer.drawRichEnvironment(this.ctx, W, H, shot.setting, store.visualStyle, tSec, shot);
          (shot.characters || []).forEach((ch, idx) => {
            window.StickForgeRenderer.drawStickCharacter(
              this.ctx, W, H, ch, idx, !store.isPlaying && idx === store.selectedCharIndex, store.visualStyle, tSec, store.isPlaying
            );
          });
          this.ctx.restore();
          window.StickForgeRenderer.drawTimedCaptions(this.ctx, W, H, shot.narration, store.shotElapsed, dur);
        }
        requestAnimationFrame((ts) => this.loop(ts));
      }

      exportWebm() {
        const store = window.StickForgeStore;
        window.StickForgeRenderer.ensureAudio();
        const stream = this.canvas.captureStream(30);
        const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm" });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        rec.onstop = () => {
          this.querySelector("#recBadge").classList.add("hidden");
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
          a.download = "stickforge_v5_video.webm";
          a.click();
        };
        store.currentShotIndex = 0; store.shotElapsed = 0; store.currentTime = 0; store.isPlaying = true;
        window.StickForgeBus.emit("playback:changed");
        this.querySelector("#recBadge").classList.remove("hidden");
        rec.start(200);
        const timer = setInterval(() => {
          if (!store.isPlaying) { clearInterval(timer); if (rec.state === "recording") rec.stop(); }
        }, 250);
      }
    }
    customElements.define("sf-stage-canvas", SfStageCanvas);

    // ---------------------------------------------------------------------
    // 4. <sf-inspector> Component (Character Rig, Attachments & Shot Setup)
    // ---------------------------------------------------------------------
    class SfInspector extends HTMLElement {
      connectedCallback() {
        this.render();
        window.StickForgeBus.on("shots:updated", () => this.syncForm());
        window.StickForgeBus.on("shot:selected", () => this.syncForm());
        window.StickForgeBus.on("char:selected", () => this.syncForm());
        window.StickForgeBus.on("gallery:updated", () => this.render());
        window.StickForgeBus.on("motions:updated", () => this.render());
      }

      render() {
        const store = window.StickForgeStore;
        const exprOptions = window.SF_EXPRESSIONS.map(e => `<option value="${e.id}">${e.label}</option>`).join("");
        this.innerHTML = `
          <!-- Shot & Google Flow 2D BG Card -->
          <div class="bg-studio-card border border-studio-border rounded-lg p-2.5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-300">Shot Environment</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">9 Preset Plates + Flow</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <select id="inspBgSelect" class="bg-studio-bg border border-studio-border rounded px-2 py-1 text-white">
                <option value="classroom">Classroom &amp; Chalkboard</option>
                <option value="bedroom">Bedroom &amp; Mirror</option>
                <option value="hallway">School Lockers Hallway</option>
                <option value="library">Study Library</option>
                <option value="auditorium">National Stage Auditorium</option>
                <option value="street">City Street &amp; Cafe</option>
                <option value="park">Sunset Park &amp; Bench</option>
                <option value="cafeteria">School Cafeteria</option>
                <option value="lab">High-Tech Science Lab</option>
                <option value="custom_image">🖼️ Google Flow / Custom 2D Art</option>
              </select>
              <select id="inspCamSelect" class="bg-studio-bg border border-studio-border rounded px-2 py-1 text-white">
                <option value="zoom_in">Slow Zoom In</option>
                <option value="zoom_out">Slow Pull Back</option>
                <option value="pan_right">Pan Left → Right</option>
                <option value="pan_left">Pan Right → Left</option>
                <option value="shake">Dramatic Shake</option>
                <option value="static">Locked Static</option>
              </select>
            </div>

            <!-- Google Flow 2D BG Generator Box -->
            <div class="bg-studio-bg/90 border border-indigo-500/40 rounded-lg p-2 space-y-1.5">
              <label class="flex items-center justify-between text-[10px] text-slate-300 cursor-pointer pb-1 border-b border-studio-border">
                <span>Default to Google Flow for New Shots</span>
                <input id="inspDefaultFlowChk" type="checkbox" ${store.api.defaultGoogleFlowBg ? "checked" : ""} class="accent-indigo-500 rounded" />
              </label>
              <input id="inspFlowPrompt" type="text" placeholder="Describe custom 2D scene (e.g. Cyberpunk rooftop, Hospital ER)..." class="w-full bg-studio-panel border border-studio-border rounded px-2 py-1 text-xs text-white" />
              <div class="grid grid-cols-2 gap-1">
                <button id="btnGenFlowBg" type="button" class="py-1.5 px-2 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow">
                  🌊 Gen Google Flow BG
                </button>
                <button id="btnGenAllFlowBgs" type="button" class="py-1.5 px-2 rounded bg-studio-panel hover:bg-slate-800 border border-studio-border text-emerald-300 text-[10px] font-semibold">
                  ⚡ All Shots Flow BGs
                </button>
              </div>
              <div class="flex items-center justify-between gap-1 pt-0.5">
                <button id="btnCopyFlowPrompt" type="button" class="flex-1 py-1 px-2 rounded bg-studio-panel hover:bg-slate-800 border border-studio-border text-sky-300 text-[10px]">
                  Copy Flow Prompt
                </button>
                <label for="inspUploadBgFile" class="py-1 px-2 rounded bg-studio-panel hover:bg-slate-800 border border-studio-border text-slate-300 text-[10px] cursor-pointer">
                  Upload 2D BG
                </label>
                <input id="inspUploadBgFile" type="file" accept="image/*" class="hidden" />
              </div>
            </div>
          </div>

          <!-- Articulated Stickman Rig & Socket Attachments Inspector -->
          <div class="bg-studio-card border border-studio-border rounded-lg p-2.5 space-y-2 flex-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-indigo-300">Articulated Rig &amp; Sockets</span>
              <div class="flex items-center gap-1.5">
                <label class="flex items-center gap-1 text-[10px] text-emerald-300 cursor-pointer">
                  <input id="inspShowNamesToggle" type="checkbox" ${store.showCharacterNames ? "checked" : ""} class="accent-emerald-500" />
                  <span>Names</span>
                </label>
                <button id="btnAddActor" type="button" class="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">+ Actor</button>
                <button id="btnDelActor" type="button" class="px-1.5 py-0.5 rounded bg-studio-bg text-rose-400 border border-studio-border text-[10px]">✕</button>
              </div>
            </div>

            <div id="inspActorPills" class="flex flex-wrap gap-1"></div>

            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div>
                <label class="text-[10px] text-slate-400 block">Character Name</label>
                <input id="inspCharName" type="text" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white" />
              </div>
              <div>
                <label class="text-[10px] text-amber-300 font-semibold block">Stick Model Rig</label>
                <select id="inspCharModel" class="w-full bg-studio-bg border border-studio-border rounded px-1.5 py-1 text-white"></select>
              </div>
            </div>

            <!-- Overhead Metric -->
            <div class="grid grid-cols-3 gap-1.5 bg-studio-bg/80 p-1.5 rounded border border-studio-border text-xs">
              <div class="col-span-2">
                <label class="text-[10px] font-mono text-indigo-300 block">Floating Badge</label>
                <input id="inspBadgeText" type="text" class="w-full bg-studio-panel border border-studio-border rounded px-2 py-0.5 font-bold text-white" />
              </div>
              <div>
                <label class="text-[10px] font-mono text-slate-400 block">Color</label>
                <select id="inspBadgeCol" class="w-full bg-studio-panel border border-studio-border rounded px-1 py-0.5 text-white">
                  <option value="#22c55e">Green</option>
                  <option value="#ef4444">Red</option>
                  <option value="#f59e0b">Amber</option>
                  <option value="#38bdf8">Cyan</option>
                  <option value="#c084fc">Purple</option>
                </select>
              </div>
            </div>

            <!-- Expression & Joint Motion Action -->
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div>
                <label class="text-[10px] text-slate-400 block">Expression (14)</label>
                <select id="inspCharExpr" class="w-full bg-studio-bg border border-studio-border rounded px-1.5 py-1 text-white">${exprOptions}</select>
              </div>
              <div>
                <label class="text-[10px] text-amber-300 font-semibold block">Motion Action</label>
                <select id="inspCharAction" class="w-full bg-studio-bg border border-studio-border rounded px-1.5 py-1 text-white"></select>
              </div>
            </div>

            <!-- Clothing & Outfit Color -->
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div>
                <label class="text-[10px] text-slate-400 block">Clothing Style</label>
                <select id="inspClothingStyle" class="w-full bg-studio-bg border border-studio-border rounded px-1.5 py-1 text-white">
                  <option value="hoodie">2D Hoodie + Pocket</option>
                  <option value="blazer">Uniform Blazer + Tie</option>
                  <option value="sweater">Casual Sweater</option>
                  <option value="suit">Executive Suit</option>
                  <option value="none">Pure Stick (No Torso Fill)</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-slate-400 block">Outfit / Fur Color</label>
                <select id="inspOutfitCol" class="w-full bg-studio-bg border border-studio-border rounded px-1.5 py-1 text-white">
                  <option value="#facc15">Yellow (#facc15)</option>
                  <option value="#3b82f6">Royal Blue (#3b82f6)</option>
                  <option value="#10b981">Emerald (#10b981)</option>
                  <option value="#ec4899">Rose Pink (#ec4899)</option>
                  <option value="#a855f7">Purple (#a855f7)</option>
                  <option value="#f59e0b">Warm Amber (#f59e0b)</option>
                  <option value="#94a3b8">Slate Grey (#94a3b8)</option>
                </select>
              </div>
            </div>

            <!-- Multi-Socket Object Attachments (Right Hand, Left Hand, Headwear, Back) -->
            <div class="bg-studio-bg/90 border border-amber-500/30 rounded-lg p-2 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono uppercase text-amber-300 font-bold">Socket Object Attachments</span>
                <button id="btnOpenMotionFromInsp" type="button" class="text-[10px] text-indigo-300 hover:underline">+ New Action</button>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <div>
                  <label class="text-[9px] text-slate-400 block">Right Hand Socket</label>
                  <select id="inspSocketHandR" class="w-full bg-studio-panel border border-studio-border rounded px-1.5 py-1 text-[11px] text-white"></select>
                </div>
                <div>
                  <label class="text-[9px] text-slate-400 block">Left Hand Socket</label>
                  <select id="inspSocketHandL" class="w-full bg-studio-panel border border-studio-border rounded px-1.5 py-1 text-[11px] text-white"></select>
                </div>
                <div>
                  <label class="text-[9px] text-slate-400 block">Headwear Socket</label>
                  <select id="inspSocketHead" class="w-full bg-studio-panel border border-studio-border rounded px-1.5 py-1 text-[11px] text-white"></select>
                </div>
                <div>
                  <label class="text-[9px] text-slate-400 block">Back / Cape Socket</label>
                  <select id="inspSocketBack" class="w-full bg-studio-panel border border-studio-border rounded px-1.5 py-1 text-[11px] text-white"></select>
                </div>
              </div>
            </div>
          </div>
        `;

        // Populate dynamic selects
        this.querySelector("#inspCharModel").innerHTML = window.SF_MODEL_GALLERY.characterModels.map(m => `<option value="${m.id}">${m.name}</option>`).join("");
        this.querySelector("#inspCharAction").innerHTML = Object.entries(window.SF_MOTION_LIBRARY).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("");

        const allObjs = window.SF_MODEL_GALLERY.objectModels.map(o => `<option value="${o.id}">${o.name}</option>`).join("");
        ["#inspSocketHandR", "#inspSocketHandL", "#inspSocketHead", "#inspSocketBack"].forEach(selId => {
          this.querySelector(selId).innerHTML = allObjs;
        });

        // Listeners
        this.querySelector("#inspBgSelect").addEventListener("change", (e) => {
          store.getCurrentShot().setting = e.target.value;
          window.StickForgeBus.emit("shots:updated");
        });
        this.querySelector("#inspCamSelect").addEventListener("change", (e) => {
          store.getCurrentShot().camera = e.target.value;
        });
        this.querySelector("#inspDefaultFlowChk").addEventListener("change", (e) => {
          store.api.defaultGoogleFlowBg = e.target.checked;
        });
        this.querySelector("#btnGenFlowBg").addEventListener("click", () => {
          const p = this.querySelector("#inspFlowPrompt").value.trim();
          window.StickForgeAI.generateFlowBackground(store.getCurrentShot(), p);
        });
        this.querySelector("#btnGenAllFlowBgs").addEventListener("click", async () => {
          for (let i = 0; i < store.shots.length; i++) {
            await window.StickForgeAI.generateFlowBackground(store.shots[i], store.shots[i].bgPrompt || store.shots[i].narration);
          }
        });
        this.querySelector("#btnCopyFlowPrompt").addEventListener("click", () => {
          const p = this.querySelector("#inspFlowPrompt").value.trim();
          const fp = window.StickForgeAI.buildGoogleFlowPrompt(store.getCurrentShot(), p);
          const t = document.createElement("textarea");
          t.value = fp; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t);
          window.StickForgeBus.emit("status:toast", { message: "Copied Google Flow Scenebuilder + Ingredients prompt!" });
        });
        this.querySelector("#inspUploadBgFile").addEventListener("change", (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = async (ev) => {
            await window.StickForgeRenderer.attachDataUrlToShot(store.getCurrentShot(), ev.target.result);
            window.StickForgeBus.emit("status:toast", { message: `Uploaded custom 2D background "${f.name}"!` });
          };
          r.readAsDataURL(f);
        });
        this.querySelector("#inspShowNamesToggle").addEventListener("change", (e) => {
          store.showCharacterNames = e.target.checked;
          window.StickForgeBus.emit("shots:updated");
        });
        this.querySelector("#btnAddActor").addEventListener("click", () => {
          const shot = store.getCurrentShot();
          store.pushUndo();
          shot.characters.push({
            id: "c_" + Date.now(), name: "Actor " + (shot.characters.length + 1), modelId: "humanoid_teen",
            outfit: "#10b981", clothingStyle: "hoodie", badgeText: "130 IQ", badgeColor: "#38bdf8",
            expr: "happy", action: "idle", handR: "none", handL: "none", headwear: "none", backItem: "none",
            scale: 1.0, x: 50, y: 80, flip: false
          });
          store.selectedCharIndex = shot.characters.length - 1;
          window.StickForgeBus.emit("shots:updated");
        });
        this.querySelector("#btnDelActor").addEventListener("click", () => {
          const shot = store.getCurrentShot();
          if (shot.characters.length <= 1) return;
          store.pushUndo();
          shot.characters.splice(store.selectedCharIndex, 1);
          store.selectedCharIndex = 0;
          window.StickForgeBus.emit("shots:updated");
        });

        const bindCharProp = (sel, key) => {
          this.querySelector(sel).addEventListener("input", (e) => {
            const ch = store.getCurrentShot().characters?.[store.selectedCharIndex];
            if (ch) { ch[key] = e.target.value; this.renderPillsOnly(); }
          });
        };
        bindCharProp("#inspCharName", "name");
        bindCharProp("#inspCharModel", "modelId");
        bindCharProp("#inspBadgeText", "badgeText");
        bindCharProp("#inspBadgeCol", "badgeColor");
        bindCharProp("#inspCharExpr", "expr");
        bindCharProp("#inspCharAction", "action");
        bindCharProp("#inspClothingStyle", "clothingStyle");
        bindCharProp("#inspOutfitCol", "outfit");
        bindCharProp("#inspSocketHandR", "handR");
        bindCharProp("#inspSocketHandL", "handL");
        bindCharProp("#inspSocketHead", "headwear");
        bindCharProp("#inspSocketBack", "backItem");

        this.querySelector("#btnOpenMotionFromInsp").addEventListener("click", () => {
          window.StickForgeBus.emit("modal:motion:open");
        });

        this.syncForm();
      }

      renderPillsOnly() {
        const store = window.StickForgeStore;
        const shot = store.getCurrentShot();
        const pills = this.querySelector("#inspActorPills");
        if (!pills || !shot) return;
        pills.innerHTML = "";
        (shot.characters || []).forEach((c, idx) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = `px-2 py-0.5 rounded text-[11px] font-semibold border ${idx === store.selectedCharIndex ? "bg-indigo-600 text-white border-indigo-400" : "bg-studio-bg text-slate-300 border-studio-border"}`;
          b.textContent = `${c.name} (${c.badgeText || "No Badge"})`;
          b.addEventListener("click", () => {
            store.selectedCharIndex = idx;
            this.syncForm();
          });
          pills.appendChild(b);
        });
      }

      syncForm() {
        const store = window.StickForgeStore;
        const shot = store.getCurrentShot();
        if (!shot) return;
        this.querySelector("#inspBgSelect").value = shot.setting;
        this.querySelector("#inspCamSelect").value = shot.camera;
        this.querySelector("#inspShowNamesToggle").checked = store.showCharacterNames;
        this.renderPillsOnly();

        const ch = shot.characters?.[store.selectedCharIndex] || shot.characters?.[0];
        if (!ch) return;
        this.querySelector("#inspCharName").value = ch.name || "";
        this.querySelector("#inspCharModel").value = ch.modelId || "humanoid_teen";
        this.querySelector("#inspBadgeText").value = ch.badgeText || "";
        this.querySelector("#inspBadgeCol").value = ch.badgeColor || "#22c55e";
        this.querySelector("#inspCharExpr").value = ch.expr || "neutral";
        this.querySelector("#inspCharAction").value = ch.action || "idle";
        this.querySelector("#inspClothingStyle").value = ch.clothingStyle || "hoodie";
        this.querySelector("#inspOutfitCol").value = ch.outfit || "#facc15";
        this.querySelector("#inspSocketHandR").value = ch.handR || ch.prop || "none";
        this.querySelector("#inspSocketHandL").value = ch.handL || "none";
        this.querySelector("#inspSocketHead").value = ch.headwear || "none";
        this.querySelector("#inspSocketBack").value = ch.backItem || "none";
      }
    }
    customElements.define("sf-inspector", SfInspector);

    // ---------------------------------------------------------------------
    // 5. <sf-timeline> Component (Unlimited Horizontal Scrollable Timeline)
    // ---------------------------------------------------------------------
    class SfTimeline extends HTMLElement {
      connectedCallback() {
        this.render();
        window.StickForgeBus.on("shots:updated", () => this.renderTracks());
        window.StickForgeBus.on("shot:selected", () => this.renderTracks());
        window.StickForgeBus.on("time:tick", () => this.updateClock());
        window.StickForgeBus.on("playback:changed", () => this.syncPlayBtn());
      }

      render() {
        this.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <button id="tlPlayBtn" type="button" class="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow">▶ Play Movie</button>
              <button id="tlStopBtn" type="button" class="px-2 py-1 rounded bg-studio-card border border-studio-border text-xs text-slate-300">■ Stop</button>
              <span id="tlClock" class="font-mono text-xs text-slate-300 bg-studio-bg px-2 py-0.5 rounded border border-studio-border">00:00.0 / 00:19.0</span>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <label class="flex items-center gap-1 text-slate-400 cursor-pointer">
                <input id="tlLoopChk" type="checkbox" class="accent-indigo-500" />
                <span>Loop Current Shot</span>
              </label>
            </div>
          </div>
          <input id="tlScrubber" type="range" min="0" max="1000" value="0" class="w-full h-1.5 bg-studio-bg rounded-lg appearance-none cursor-pointer accent-indigo-500 my-1" />
          <div id="tlTrackBar" class="flex h-8 rounded overflow-x-auto bg-studio-bg border border-studio-border gap-0.5 p-0.5"></div>
        `;

        const store = window.StickForgeStore;
        this.querySelector("#tlPlayBtn").addEventListener("click", () => {
          window.StickForgeRenderer.ensureAudio();
          store.isPlaying = !store.isPlaying;
          this.syncPlayBtn();
        });
        this.querySelector("#tlStopBtn").addEventListener("click", () => {
          store.isPlaying = false;
          store.currentShotIndex = 0; store.shotElapsed = 0; store.currentTime = 0;
          this.syncPlayBtn();
          window.StickForgeBus.emit("shot:selected");
        });
        this.querySelector("#tlLoopChk").addEventListener("change", (e) => { store.loopShot = e.target.checked; });
        this.querySelector("#tlScrubber").addEventListener("input", (e) => {
          const total = store.getTotalDuration();
          const t = (Number(e.target.value) / 1000) * total;
          store.currentTime = t;
          let acc = 0;
          for (let i = 0; i < store.shots.length; i++) {
            const d = Number(store.shots[i].duration) || 5;
            if (t <= acc + d || i === store.shots.length - 1) {
              store.currentShotIndex = i;
              store.shotElapsed = Math.max(0, t - acc);
              window.StickForgeBus.emit("shot:selected");
              break;
            }
            acc += d;
          }
          this.updateClock();
        });

        this.renderTracks();
        this.updateClock();
      }

      syncPlayBtn() {
        const btn = this.querySelector("#tlPlayBtn");
        if (btn) btn.textContent = window.StickForgeStore.isPlaying ? "⏸ Pause" : "▶ Play Movie";
      }

      updateClock() {
        const store = window.StickForgeStore;
        const total = store.getTotalDuration();
        const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
        const c = this.querySelector("#tlClock");
        if (c) c.textContent = `${fmt(store.currentTime)} / ${fmt(total)}`;
        const sc = this.querySelector("#tlScrubber");
        if (sc && total > 0) sc.value = Math.round((store.currentTime / total) * 1000);
      }

      renderTracks() {
        const store = window.StickForgeStore;
        const bar = this.querySelector("#tlTrackBar");
        if (!bar) return;
        bar.innerHTML = "";
        const total = Math.max(1, store.getTotalDuration());
        store.shots.forEach((s, idx) => {
          const wPct = Math.max(4, ((Number(s.duration) || 5) / total) * 100);
          const item = document.createElement("div");
          item.style.width = `${wPct}%`;
          item.style.minWidth = "72px";
          item.className = `h-full rounded px-2 flex items-center justify-between text-[10px] font-semibold cursor-pointer shrink-0 truncate ${idx === store.currentShotIndex ? "bg-indigo-600 text-white" : "bg-studio-card text-slate-300 border border-studio-border"}`;
          item.textContent = `${idx + 1}. ${s.setting}`;
          item.addEventListener("click", () => {
            store.currentShotIndex = idx;
            store.shotElapsed = 0;
            store.currentTime = store.getShotStartTime(idx);
            window.StickForgeBus.emit("shot:selected");
          });
          bar.appendChild(item);
        });
      }
    }
    customElements.define("sf-timeline", SfTimeline);

    // ---------------------------------------------------------------------
    // 6. <sf-motion-modal> Component (Interactive Keyframe Joint Motion Studio)
    // ---------------------------------------------------------------------
    class SfMotionModal extends HTMLElement {
      connectedCallback() {
        this.keyframes = [
          { torsoTilt: 0, headNod: 0, lShoulder: -40, lElbow: -30, rShoulder: 40, rElbow: -30, lHip: -15, lKnee: 10, rHip: 15, rKnee: -5, bounceY: 0 },
          { torsoTilt: 8, headNod: -8, lShoulder: -120, lElbow: -20, rShoulder: 120, rElbow: 20, lHip: -35, lKnee: 35, rHip: 35, rKnee: -25, bounceY: -8 }
        ];
        this.activeKfIdx = 0;
        this.previewPlaying = true;
        this.loopSpeed = 6.0;
        this.isOpen = false;
        this.render();

        window.StickForgeBus.on("modal:motion:open", () => {
          this.isOpen = true;
          this.querySelector("#motionModalWrap").classList.remove("hidden");
          this.syncSliders();
        });
        requestAnimationFrame((ts) => this.previewLoop(ts));
      }

      render() {
        const sliders = [
          { k: "torsoTilt", label: "Torso Tilt", min: -45, max: 45 },
          { k: "headNod", label: "Head Nod", min: -35, max: 35 },
          { k: "lShoulder", label: "Left Shoulder", min: -170, max: 170 },
          { k: "lElbow", label: "Left Elbow", min: -140, max: 140 },
          { k: "rShoulder", label: "Right Shoulder", min: -170, max: 170 },
          { k: "rElbow", label: "Right Elbow", min: -140, max: 140 },
          { k: "lHip", label: "Left Hip", min: -90, max: 90 },
          { k: "lKnee", label: "Left Knee", min: -90, max: 90 },
          { k: "rHip", label: "Right Hip", min: -90, max: 90 },
          { k: "rKnee", label: "Right Knee", min: -90, max: 90 },
          { k: "bounceY", label: "Vertical Bounce", min: -20, max: 20 }
        ];

        this.innerHTML = `
          <div id="motionModalWrap" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-studio-panel border border-studio-border rounded-2xl max-w-4xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div class="flex items-center justify-between border-b border-studio-border pb-3">
                <div>
                  <h2 class="text-base font-extrabold text-white">🏃 StickForge 2D Motion Studio — Custom Action &amp; Joint Keyframe Editor</h2>
                  <p class="text-xs text-slate-400">Pose elbows, knees, shoulders, hips, and torso across keyframes—or describe a motion for Gemini AI to choreograph.</p>
                </div>
                <button id="btnCloseMotion" type="button" class="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1">✕</button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-5 flex flex-col items-center justify-between bg-studio-bg border border-studio-border rounded-xl p-3">
                  <div class="w-full flex items-center justify-between text-xs mb-2">
                    <span class="font-bold text-amber-300">Live Joint Rig Preview</span>
                    <label class="flex items-center gap-1 text-slate-300 cursor-pointer">
                      <input id="motPlayPreviewChk" type="checkbox" checked class="accent-amber-500" />
                      <span>Animate Loop</span>
                    </label>
                  </div>
                  <canvas id="motionPreviewCanvas" width="320" height="320" class="rounded-lg bg-slate-900 border border-studio-border"></canvas>
                  <div class="w-full mt-2 flex gap-1.5">
                    <input id="motAiPrompt" type="text" placeholder="AI Choreographer (e.g. Backflip, Martial Arts Kick)..." class="flex-1 bg-studio-card border border-studio-border rounded px-2 py-1 text-xs text-white" />
                    <button id="btnAiChoreograph" type="button" class="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">✨ AI Pose</button>
                  </div>
                </div>

                <div class="md:col-span-7 space-y-3">
                  <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-2">
                      <label class="text-[10px] text-slate-400 block">Action Name</label>
                      <input id="motNameInput" type="text" value="Custom Victory Jump" class="w-full bg-studio-bg border border-studio-border rounded px-2.5 py-1 text-xs text-white font-bold" />
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400 block">Loop Speed</label>
                      <input id="motSpeedInput" type="number" min="1" max="20" step="0.5" value="6.0" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-white font-mono" />
                    </div>
                  </div>

                  <div class="flex items-center justify-between bg-studio-card border border-studio-border rounded-lg p-2">
                    <div id="motKfTabs" class="flex gap-1"></div>
                    <button id="btnAddKf" type="button" class="px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-semibold">+ Add Keyframe</button>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-studio-card border border-studio-border rounded-xl p-3">
                    ${sliders.map(s => `
                      <div>
                        <div class="flex justify-between text-[10px]">
                          <span class="text-slate-300">${s.label}</span>
                          <span id="val_${s.k}" class="font-mono text-amber-300">0°</span>
                        </div>
                        <input id="sld_${s.k}" data-joint="${s.k}" type="range" min="${s.min}" max="${s.max}" value="0" class="w-full accent-amber-500 h-1.5 bg-studio-bg rounded cursor-pointer" />
                      </div>
                    `).join("")}
                  </div>

                  <div class="flex justify-end gap-2 pt-1">
                    <button id="btnSaveMotionAction" type="button" class="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow">
                      💾 Save Action to Motion Library &amp; Apply to Actor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        this.querySelector("#btnCloseMotion").addEventListener("click", () => {
          this.isOpen = false;
          this.querySelector("#motionModalWrap").classList.add("hidden");
        });
        this.querySelector("#motPlayPreviewChk").addEventListener("change", (e) => {
          this.previewPlaying = e.target.checked;
        });
        this.querySelector("#motSpeedInput").addEventListener("input", (e) => {
          this.loopSpeed = Number(e.target.value) || 6.0;
        });
        this.querySelector("#btnAddKf").addEventListener("click", () => {
          this.keyframes.push(JSON.parse(JSON.stringify(this.keyframes[this.activeKfIdx])));
          this.activeKfIdx = this.keyframes.length - 1;
          this.syncSliders();
        });

        this.querySelectorAll("[data-joint]").forEach(sld => {
          sld.addEventListener("input", (e) => {
            const k = e.target.dataset.joint;
            const v = Number(e.target.value);
            this.keyframes[this.activeKfIdx][k] = v;
            this.querySelector(`#val_${k}`).textContent = `${v}°`;
          });
        });

        this.querySelector("#btnAiChoreograph").addEventListener("click", () => {
          const p = this.querySelector("#motAiPrompt").value.trim().toLowerCase();
          if (!p) return;
          this.querySelector("#motNameInput").value = this.querySelector("#motAiPrompt").value.trim();
          if (p.includes("kick") || p.includes("karate")) {
            this.keyframes = [
              { torsoTilt: -12, headNod: 0, lShoulder: -65, lElbow: -80, rShoulder: 65, rElbow: -70, lHip: -10, lKnee: 10, rHip: 95, rKnee: -5, bounceY: -6 },
              { torsoTilt: 5, headNod: 4, lShoulder: -45, lElbow: -60, rShoulder: 45, rElbow: -60, lHip: -15, lKnee: 10, rHip: 20, rKnee: -15, bounceY: 0 }
            ];
          } else {
            this.keyframes = [
              { torsoTilt: -15, headNod: -10, lShoulder: -160, lElbow: -15, rShoulder: 160, rElbow: 15, lHip: -45, lKnee: 55, rHip: 45, rKnee: -55, bounceY: -16 },
              { torsoTilt: 12, headNod: 8, lShoulder: -40, lElbow: -45, rShoulder: 40, rElbow: 45, lHip: -15, lKnee: 25, rHip: 15, rKnee: -25, bounceY: 4 }
            ];
          }
          this.activeKfIdx = 0;
          this.syncSliders();
        });

        this.querySelector("#btnSaveMotionAction").addEventListener("click", () => {
          const name = this.querySelector("#motNameInput").value.trim() || "Custom Action";
          const id = "custom_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now().toString().slice(-3);
          window.SF_MOTION_LIBRARY[id] = {
            name,
            loopSpeed: this.loopSpeed,
            frames: JSON.parse(JSON.stringify(this.keyframes))
          };
          const store = window.StickForgeStore;
          const ch = store.getCurrentShot().characters?.[store.selectedCharIndex];
          if (ch) ch.action = id;
          window.StickForgeBus.emit("motions:updated");
          window.StickForgeBus.emit("shots:updated");
          window.StickForgeBus.emit("status:toast", { message: `🏃 Saved "${name}" to Motion Studio and applied to ${ch ? ch.name : "actor"}!` });
          this.isOpen = false;
          this.querySelector("#motionModalWrap").classList.add("hidden");
        });

        this.syncSliders();
      }

      syncSliders() {
        const tabs = this.querySelector("#motKfTabs");
        if (tabs) {
          tabs.innerHTML = "";
          this.keyframes.forEach((_, idx) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = `px-2.5 py-0.5 rounded text-xs font-bold ${idx === this.activeKfIdx ? "bg-amber-500 text-slate-950" : "bg-studio-bg text-slate-300"}`;
            b.textContent = `Pose ${idx + 1}`;
            b.addEventListener("click", () => { this.activeKfIdx = idx; this.syncSliders(); });
            tabs.appendChild(b);
          });
        }
        const kf = this.keyframes[this.activeKfIdx];
        if (!kf) return;
        Object.keys(kf).forEach(k => {
          const s = this.querySelector(`#sld_${k}`);
          const v = this.querySelector(`#val_${k}`);
          if (s) s.value = kf[k];
          if (v) v.textContent = `${kf[k]}°`;
        });
      }

      previewLoop(nowMs) {
        if (this.isOpen) {
          const c = this.querySelector("#motionPreviewCanvas");
          if (c) {
            const ctx = c.getContext("2d");
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, c.width, c.height);
            ctx.strokeStyle = "#334155"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 265); ctx.lineTo(320, 265); ctx.stroke();

            let pose = this.keyframes[this.activeKfIdx];
            if (this.previewPlaying && this.keyframes.length > 1) {
              const tSec = nowMs / 1000;
              const phase = (tSec * this.loopSpeed) % this.keyframes.length;
              const iA = Math.floor(phase), iB = (iA + 1) % this.keyframes.length;
              const frac = 0.5 - 0.5 * Math.cos((phase - iA) * Math.PI);
              pose = {};
              for (const k of Object.keys(this.keyframes[iA])) {
                pose[k] = this.keyframes[iA][k] + (this.keyframes[iB][k] - this.keyframes[iA][k]) * frac;
              }
            }

            const dummyChar = {
              name: "Preview Rig", modelId: "humanoid_teen", outfit: "#facc15", clothingStyle: "hoodie",
              badgeText: "MOTION RIG", badgeColor: "#38bdf8", expr: "cool", x: 50, y: 82, scale: 1.35, flip: false
            };
            const prevJoints = window.StickForgeStore.showJointPins;
            window.StickForgeStore.showJointPins = true;
            window.StickForgeRenderer.drawStickCharacter(ctx, c.width, c.height, dummyChar, 0, false, "conchaser", nowMs / 1000, false, pose);
            window.StickForgeStore.showJointPins = prevJoints;
          }
        }
        requestAnimationFrame((ts) => this.previewLoop(ts));
      }
    }
    customElements.define("sf-motion-modal", SfMotionModal);

    // ---------------------------------------------------------------------
    // ---------------------------------------------------------------------
    // 7. <sf-cloud-modal> Component (Cloud & Web Server Storage Connectors)
    // ---------------------------------------------------------------------
    class SfCloudModal extends HTMLElement {
      connectedCallback() {
        this.render();
        window.StickForgeBus.on("modal:cloud:open", () => {
          this.querySelector("#cloudModalWrap").classList.remove("hidden");
          this.refreshServerProjects();
        });
      }

      async refreshServerProjects() {
        const selectEl = this.querySelector("#serverProjectSelect");
        if (!selectEl) return;
        try {
          const res = await fetch("./api/projects.php?action=list");
          if (res.ok) {
            const data = await res.json();
            if (data.ok && Array.isArray(data.projects)) {
              selectEl.innerHTML = data.projects.length
                ? data.projects.map(p => `<option value="${p.id}">${p.title} (${p.shotsCount || '?'} shots · ${new Date(p.updatedTimestamp * 1000).toLocaleDateString()})</option>`).join("")
                : `<option value="">No projects saved on server yet</option>`;
              return;
            }
          }
        } catch (e) {}
        selectEl.innerHTML = `<option value="">(Server storage API offline or local mode)</option>`;
      }

      render() {
        const store = window.StickForgeStore;
        this.innerHTML = `
          <div id="cloudModalWrap" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-studio-panel border border-studio-border rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-studio-border pb-3">
                <div>
                  <h2 class="text-base font-extrabold text-white">☁️ Project Storage &amp; Cloud Sync</h2>
                  <p class="text-xs text-slate-400">Save and load your entire project, Stick Models, Props, and Motions to the Web Server, AWS S3, Google Drive, or Browser Storage.</p>
                </div>
                <button id="btnCloseCloud" type="button" class="text-slate-400 hover:text-white text-sm font-bold px-2">✕</button>
              </div>

              <div class="space-y-3 text-xs">
                <div>
                  <label class="font-bold text-sky-300 block mb-1">Select Storage Provider</label>
                  <select id="cloudProviderSelect" class="w-full bg-studio-bg border border-studio-border rounded-lg px-2.5 py-1.5 text-white">
                    <option value="server_storage" selected>🖥️ Web Server Storage (PHP /api/projects.php)</option>
                    <option value="stickforge_cloud">StickForge Instant Browser Cloud (IndexedDB + Auto-Backup)</option>
                    <option value="aws_s3">Amazon AWS S3 / Cloudflare R2 Bucket (REST PUT/GET)</option>
                    <option value="google_drive">Google Drive API v3 (AppData / Drive File Sync)</option>
                    <option value="github_gist">GitHub Gist Cloud Sync (Personal Access Token)</option>
                  </select>
                </div>

                <div id="cfg_server_storage" class="bg-studio-card border border-studio-border rounded-xl p-3 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-emerald-300 block">🖥️ Saved Projects on Web Server</span>
                    <button id="btnRefreshServerProjects" type="button" class="text-[11px] text-sky-400 hover:underline">↻ Refresh List</button>
                  </div>
                  <select id="serverProjectSelect" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono">
                    <option value="">Loading server projects...</option>
                  </select>
                  <div class="flex gap-2 pt-1">
                    <button id="btnServerSave" type="button" class="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                      💾 Save to Web Server
                    </button>
                    <button id="btnServerLoad" type="button" class="flex-1 py-1.5 rounded bg-studio-bg hover:bg-slate-800 border border-studio-border text-sky-300 font-bold text-xs">
                      📂 Load Selected
                    </button>
                    <button id="btnServerDelete" type="button" class="px-2.5 py-1.5 rounded bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 text-xs">
                      🗑️
                    </button>
                  </div>
                </div>

                <div id="cfg_aws_s3" class="hidden bg-studio-card border border-studio-border rounded-xl p-3 space-y-2">
                  <span class="font-bold text-amber-300 block">AWS S3 / S3-Compatible Presigned or Bucket Endpoint</span>
                  <input id="awsEndpointInput" type="text" placeholder="https://my-bucket.s3.amazonaws.com/stickforge_project.json" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono" />
                  <input id="awsTokenInput" type="password" placeholder="Optional Bearer / Presigned Auth Header..." class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono" />
                </div>

                <div id="cfg_google_drive" class="hidden bg-studio-card border border-studio-border rounded-xl p-3 space-y-2">
                  <span class="font-bold text-emerald-300 block">Google Drive API v3 OAuth Bearer Token</span>
                  <input id="gdriveTokenInput" type="password" placeholder="ya29.a0AfH6SM..." class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono" />
                  <input id="gdriveFileIdInput" type="text" placeholder="Optional existing Drive File ID (leaves blank to create new)..." class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono" />
                </div>

                <div id="cfg_github_gist" class="hidden bg-studio-card border border-studio-border rounded-xl p-3 space-y-2">
                  <span class="font-bold text-purple-300 block">GitHub Gist Cloud Sync</span>
                  <input id="gistTokenInput" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono" />
                  <input id="gistIdInput" type="text" placeholder="Optional Gist ID to update..." class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white font-mono" />
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2">
                  <button id="btnCloudPush" type="button" class="py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold shadow">
                    ☁️ Push Project &amp; Gallery to Cloud
                  </button>
                  <button id="btnCloudPull" type="button" class="py-2 rounded-lg bg-studio-card hover:bg-slate-800 border border-studio-border text-sky-300 font-bold">
                    ⬇ Pull Latest from Cloud
                  </button>
                </div>

                <div class="flex items-center justify-between border-t border-studio-border pt-3">
                  <button id="btnDownloadJsonFile" type="button" class="px-3 py-1.5 rounded bg-studio-card hover:bg-slate-800 border border-studio-border text-slate-200">
                    💾 Download Project Bundle (.JSON)
                  </button>
                  <label for="uploadJsonBundle" class="px-3 py-1.5 rounded bg-studio-card hover:bg-slate-800 border border-studio-border text-emerald-300 cursor-pointer">
                    📂 Load Project Bundle (.JSON)
                  </label>
                  <input id="uploadJsonBundle" type="file" accept=".json" class="hidden" />
                </div>

                <div id="cloudStatusMsg" class="text-[11px] font-mono text-emerald-400">Ready to sync.</div>
              </div>
            </div>
          </div>
        `;

        const provSel = this.querySelector("#cloudProviderSelect");
        provSel.addEventListener("change", () => {
          ["server_storage", "aws_s3", "google_drive", "github_gist"].forEach(k => {
            const el = this.querySelector(`#cfg_${k}`);
            if (el) el.classList.toggle("hidden", provSel.value !== k);
          });
        });

        this.querySelector("#btnCloseCloud").addEventListener("click", () => {
          this.querySelector("#cloudModalWrap").classList.add("hidden");
        });

        // Server Storage Handlers
        this.querySelector("#btnRefreshServerProjects")?.addEventListener("click", () => this.refreshServerProjects());

        this.querySelector("#btnServerSave")?.addEventListener("click", async () => {
          const statusEl = this.querySelector("#cloudStatusMsg");
          statusEl.textContent = "Saving project to web server...";
          try {
            const state = JSON.parse(store.exportFullStateJSON());
            const res = await fetch("./api/projects.php?action=save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(state)
            });
            const data = await res.json();
            if (data.ok) {
              statusEl.textContent = `✓ Project saved to server! (ID: ${data.id})`;
              window.StickForgeBus.emit("status:toast", { message: `💾 Saved "${store.projectTitle}" to web server!` });
              this.refreshServerProjects();
            } else {
              throw new Error(data.error || "Save failed");
            }
          } catch (err) {
            statusEl.textContent = `Server Save Failed: ${err.message}. (Saved to Local Storage instead)`;
            localStorage.setItem("stickforge_v5_cloud_bundle", store.exportFullStateJSON());
          }
        });

        this.querySelector("#btnServerLoad")?.addEventListener("click", async () => {
          const statusEl = this.querySelector("#cloudStatusMsg");
          const selectedId = this.querySelector("#serverProjectSelect")?.value;
          if (!selectedId) {
            statusEl.textContent = "Select a project from the list to load.";
            return;
          }
          statusEl.textContent = `Loading project ${selectedId} from server...`;
          try {
            const res = await fetch(`./api/projects.php?action=load&id=${encodeURIComponent(selectedId)}`);
            const data = await res.json();
            if (data.ok && data.project) {
              store.importFullStateJSON(data.project);
              statusEl.textContent = `✓ Successfully loaded "${data.project.projectTitle || selectedId}" from server!`;
              window.StickForgeBus.emit("status:toast", { message: `📂 Loaded "${data.project.projectTitle}" from server!` });
            } else {
              throw new Error(data.error || "Load failed");
            }
          } catch (err) {
            statusEl.textContent = `Error loading: ${err.message}`;
          }
        });

        this.querySelector("#btnServerDelete")?.addEventListener("click", async () => {
          const selectedId = this.querySelector("#serverProjectSelect")?.value;
          if (!selectedId || !confirm(`Delete project "${selectedId}" from server?`)) return;
          try {
            await fetch(`./api/projects.php?action=delete&id=${encodeURIComponent(selectedId)}`, { method: "POST" });
            this.refreshServerProjects();
            this.querySelector("#cloudStatusMsg").textContent = `✓ Deleted project from server.`;
          } catch (e) {}
        });

        this.querySelector("#btnCloudPush").addEventListener("click", async () => {
          const prov = provSel.value;
          const payload = store.exportFullStateJSON();
          const statusEl = this.querySelector("#cloudStatusMsg");
          statusEl.textContent = "Syncing project bundle to cloud...";

          try {
            localStorage.setItem("stickforge_v5_cloud_bundle", payload);

            if (prov === "server_storage") {
              const res = await fetch("./api/projects.php?action=save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } else if (prov === "aws_s3") {
              const ep = this.querySelector("#awsEndpointInput").value.trim();
              if (!ep) throw new Error("Enter an S3 Bucket/Presigned URL");
              const headers = { "Content-Type": "application/json" };
              const tk = this.querySelector("#awsTokenInput").value.trim();
              if (tk) headers["Authorization"] = `Bearer ${tk}`;
              const r = await fetch(ep, { method: "PUT", headers, body: payload });
              if (!r.ok) throw new Error(`AWS S3 HTTP ${r.status}`);
            } else if (prov === "google_drive") {
              const tk = this.querySelector("#gdriveTokenInput").value.trim();
              if (!tk) throw new Error("Enter your Google Drive OAuth Bearer token");
              const fid = this.querySelector("#gdriveFileIdInput").value.trim();
              const url = fid
                ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fid)}?uploadType=media`
                : `https://www.googleapis.com/upload/drive/v3/files?uploadType=media`;
              const r = await fetch(url, {
                method: fid ? "PATCH" : "POST",
                headers: { "Authorization": `Bearer ${tk}`, "Content-Type": "application/json" },
                body: payload
              });
              if (!r.ok) throw new Error(`Google Drive HTTP ${r.status}`);
              const d = await r.json();
              if (d.id) this.querySelector("#gdriveFileIdInput").value = d.id;
            } else if (prov === "github_gist") {
              const tk = this.querySelector("#gistTokenInput").value.trim();
              if (!tk) throw new Error("Enter your GitHub Personal Access Token");
              const gid = this.querySelector("#gistIdInput").value.trim();
              const url = gid ? `https://api.github.com/gists/${encodeURIComponent(gid)}` : `https://api.github.com/gists`;
              const r = await fetch(url, {
                method: gid ? "PATCH" : "POST",
                headers: { "Authorization": `Bearer ${tk}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  description: "StickForge 2D v5.0 Studio Cloud Sync",
                  public: false,
                  files: { "stickforge_v5_project.json": { content: payload } }
                })
              });
              if (!r.ok) throw new Error(`GitHub Gist HTTP ${r.status}`);
              const d = await r.json();
              if (d.id) this.querySelector("#gistIdInput").value = d.id;
            }

            const stamp = new Date().toLocaleTimeString();
            statusEl.textContent = `✓ Synced project, models & motions to ${prov.toUpperCase()} at ${stamp}`;
            window.StickForgeBus.emit("cloud:synced", { label: `Synced ${stamp}` });
          } catch (err) {
            statusEl.textContent = `✓ Saved to Local Cloud Cache (${err.message})`;
          }
        });

        this.querySelector("#btnCloudPull").addEventListener("click", async () => {
          const prov = provSel.value;
          const statusEl = this.querySelector("#cloudStatusMsg");
          try {
            if (prov === "aws_s3") {
              const ep = this.querySelector("#awsEndpointInput").value.trim();
              const r = await fetch(ep);
              const txt = await r.text();
              store.importFullStateJSON(txt);
            } else if (prov === "google_drive") {
              const tk = this.querySelector("#gdriveTokenInput").value.trim();
              const fid = this.querySelector("#gdriveFileIdInput").value.trim();
              const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fid)}?alt=media`, {
                headers: { "Authorization": `Bearer ${tk}` }
              });
              store.importFullStateJSON(await r.text());
            } else if (prov === "github_gist") {
              const gid = this.querySelector("#gistIdInput").value.trim();
              const r = await fetch(`https://api.github.com/gists/${encodeURIComponent(gid)}`);
              const d = await r.json();
              const content = d.files?.["stickforge_v5_project.json"]?.content;
              if (content) store.importFullStateJSON(content);
            } else {
              const cached = localStorage.getItem("stickforge_v5_cloud_bundle");
              if (cached) store.importFullStateJSON(cached);
            }
            statusEl.textContent = `✓ Pulled and restored project bundle from ${prov.toUpperCase()}!`;
          } catch (e) {
            statusEl.textContent = `Error pulling: ${e.message}`;
          }
        });

        this.querySelector("#btnDownloadJsonFile").addEventListener("click", () => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([store.exportFullStateJSON()], { type: "application/json" }));
          a.download = "stickforge_v5_bundle.json";
          a.click();
        });

        this.querySelector("#uploadJsonBundle").addEventListener("change", (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => {
            store.importFullStateJSON(ev.target.result);
            this.querySelector("#cloudStatusMsg").textContent = `✓ Loaded bundle "${f.name}"!`;
          };
          r.readAsText(f);
        });
      }
    }
    customElements.define("sf-cloud-modal", SfCloudModal);

    // ---------------------------------------------------------------------
    // 8. <sf-api-modal> & <sf-module-exporter-modal> Components
    // ---------------------------------------------------------------------
    class SfApiModal extends HTMLElement {
      connectedCallback() {
        this.render();
        window.StickForgeBus.on("modal:api:open", async () => {
          this.querySelector("#apiModalWrap").classList.remove("hidden");
          this.checkRdsStatus();
          const store = window.StickForgeStore;
          if (store.api.availableModels && store.api.availableModels.length > 0) {
            this.populateModelDropdown(store.api.availableModels);
          } else {
            await this.refreshModels();
          }
        });
        window.StickForgeBus.on("models:loaded", (d) => {
          this.populateModelDropdown(d.models);
        });
        window.StickForgeBus.on("model:changed", (d) => {
          const sel = this.querySelector("#inpLlmModel");
          if (sel && sel.value !== d.model) sel.value = d.model;
        });
      }

      async checkRdsStatus() {
        const bannerTitle = this.querySelector("#rdsStatusTitle");
        const bannerSub = this.querySelector("#rdsStatusSubtitle");
        const icon = this.querySelector("#rdsStatusIcon");
        const btnSaveRds = this.querySelector("#btnSaveRds");
        if (!bannerTitle) return;

        try {
          const res = await fetch("./api/keys.php?action=status");
          if (res.ok) {
            const data = await res.json();
            if (data.rds?.connected) {
              icon.textContent = "⚡";
              const engineLabel = data.rds.engine === "mysql" ? "MySQL" : "PostgreSQL";
              bannerTitle.innerHTML = `<span class="text-emerald-400 font-bold">Amazon Aurora RDS (${engineLabel} Connected)</span>`;
              bannerSub.textContent = `Host: ${data.rds.host || 'Aurora RDS'} (${data.rds.latency_ms || 0}ms)`;
              if (btnSaveRds) btnSaveRds.classList.remove("hidden");
              return;
            } else if (data.rds?.enabled) {
              icon.textContent = "⚠️";
              bannerTitle.innerHTML = `<span class="text-amber-400 font-bold">Aurora RDS Configured (Connecting...)</span>`;
              bannerSub.textContent = data.rds.error || "Validating credentials / endpoint...";
              if (btnSaveRds) btnSaveRds.classList.remove("hidden");
              return;
            }
          }
        } catch (e) {}

        icon.textContent = "📁";
        const isAmplify = window.location.hostname.includes("amplifyapp.com") || window.location.hostname.endsWith(".aws");
        if (isAmplify) {
          icon.textContent = "☁️";
          bannerTitle.innerHTML = `<span class="text-sky-400 font-bold">Amazon Amplify Hosting (Active)</span>`;
          bannerSub.textContent = "Global CloudFront CDN • Direct Gemini API & Imagen 3 (BYOK Mode)";
          if (btnSaveRds) btnSaveRds.classList.add("hidden");
          return;
        }

        bannerTitle.innerHTML = `<span class="text-slate-300 font-bold">Local File / Environment (.env)</span>`;
        bannerSub.textContent = "Set AURORA_RDS_HOST & credentials in config/.env to activate Aurora RDS";
        if (btnSaveRds) btnSaveRds.classList.add("hidden");
      }

      async refreshModels(keyOverride = "") {
        const spin = this.querySelector("#fetchSpin");
        const badge = this.querySelector("#modelCountBadge");
        if (spin) spin.classList.add("anim-pulse-glow");
        if (badge) badge.textContent = "Fetching available models from Gemini API...";

        const key = keyOverride || this.querySelector("#inpLlmKey")?.value.trim() || "";
        const models = await window.StickForgeAI.fetchAvailableModels(key);
        this.populateModelDropdown(models);

        if (spin) spin.classList.remove("anim-pulse-glow");
      }

      populateModelDropdown(models) {
        const sel = this.querySelector("#inpLlmModel");
        const badge = this.querySelector("#modelCountBadge");
        const descEl = this.querySelector("#modelDescSnippet");
        if (!sel) return;
        const store = window.StickForgeStore;
        const currentModel = store.api.llmModel || "gemini-2.5-flash";

        if (!models || !models.length) {
          sel.innerHTML = `
            <option value="${currentModel}">${currentModel} (Default)</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
          `;
          if (badge) badge.textContent = "Provide API key to fetch all models";
          return;
        }

        const genModels = models.filter(m => m.supportsGenerate !== false);
        const otherModels = models.filter(m => m.supportsGenerate === false);

        let html = `<optgroup label="✨ Text & Multimodal Generation Models (${genModels.length})">`;
        html += genModels.map(m => {
          const selAttr = m.id === currentModel ? "selected" : "";
          const name = m.displayName || m.id;
          return `<option value="${m.id}" ${selAttr}>${name} (${m.id})</option>`;
        }).join("");
        html += `</optgroup>`;

        if (otherModels.length) {
          html += `<optgroup label="Other Gemini Models (${otherModels.length})">`;
          html += otherModels.map(m => {
            const selAttr = m.id === currentModel ? "selected" : "";
            const name = m.displayName || m.id;
            return `<option value="${m.id}" ${selAttr}>${name} (${m.id})</option>`;
          }).join("");
          html += `</optgroup>`;
        }

        sel.innerHTML = html;
        if (badge) badge.textContent = `✓ ${models.length} Gemini models available for your API key`;

        const activeObj = models.find(m => m.id === sel.value);
        if (descEl) descEl.textContent = activeObj?.description ? activeObj.description.slice(0, 55) + "..." : "";
      }

      render() {
        const store = window.StickForgeStore;
        this.innerHTML = `
          <div id="apiModalWrap" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-studio-panel border border-studio-border rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-studio-border pb-2">
                <h2 class="text-sm font-bold text-white">🔑 AI Gateway &amp; Key Vault Configuration</h2>
                <button id="btnCloseApi" type="button" class="text-slate-400 hover:text-white">✕</button>
              </div>

              <!-- Aurora RDS Key Storage Status Banner -->
              <div id="rdsStatusBanner" class="p-2.5 rounded-lg bg-studio-card border border-studio-border flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span id="rdsStatusIcon" class="text-lg">⚡</span>
                  <div>
                    <span id="rdsStatusTitle" class="text-xs font-bold text-white block">Key Storage: Checking...</span>
                    <span id="rdsStatusSubtitle" class="text-[10px] text-slate-400 block">Amazon Aurora RDS (Relational Database Service)</span>
                  </div>
                </div>
                <button id="btnTestRds" type="button" class="px-2.5 py-1 rounded bg-studio-bg hover:bg-slate-800 border border-studio-border text-sky-300 text-[11px] font-semibold transition">
                  Test RDS
                </button>
              </div>

              <div class="space-y-3 text-xs">
                <div class="bg-studio-card border border-studio-border rounded-lg p-3 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-indigo-300 font-bold">1. Gemini Model Selection</label>
                    <button id="btnFetchModels" type="button" class="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition">
                      <span id="fetchSpin">🔄</span> Fetch Available Models
                    </button>
                  </div>
                  <select id="inpLlmModel" class="w-full bg-studio-bg border border-studio-border rounded px-2.5 py-1.5 text-white font-mono text-xs">
                    <option value="${store.api.llmModel}">${store.api.llmModel} (Loading models...)</option>
                  </select>
                  <div class="flex items-center justify-between text-[10px]">
                    <span id="modelCountBadge" class="text-slate-400">Enter API key to unlock all models</span>
                    <span id="modelDescSnippet" class="text-indigo-300 truncate max-w-[240px]"></span>
                  </div>
                  <div class="pt-1 space-y-1">
                    <label class="block text-slate-300 font-semibold">Gemini API Key</label>
                    <input id="inpLlmKey" type="password" value="${store.api.llmKey}" placeholder="Paste Gemini API key (AIza...)..." class="w-full bg-studio-bg border border-studio-border rounded px-2.5 py-1.5 text-white font-mono" />
                  </div>
                </div>
                <div class="bg-studio-card border border-studio-border rounded-lg p-3 space-y-1.5">
                  <label class="block text-sky-300 font-bold">2. 2D Background Engine</label>
                  <select id="inpImgProvider" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white">
                    <option value="google_flow">Google Flow / Imagen 3 (imagen-3.0-generate-002)</option>
                    <option value="openai_dalle">OpenAI DALL·E 3 API (Proxied via Server)</option>
                    <option value="built_in_painter">Built-in 2D Cartoon Painter Only (Instant Offline)</option>
                  </select>
                  <input id="inpImgKey" type="password" value="${store.api.imgKey}" placeholder="Optional separate Image API key..." class="w-full bg-studio-bg border border-studio-border rounded px-2.5 py-1 text-white font-mono" />
                </div>
                <div class="bg-studio-card border border-studio-border rounded-lg p-3 space-y-1.5">
                  <label class="block text-emerald-300 font-bold">3. Voiceover Provider (TTS)</label>
                  <select id="inpTtsProvider" class="w-full bg-studio-bg border border-studio-border rounded px-2 py-1 text-white">
                    <option value="gemini_31_tts">Google Gemini Audio TTS</option>
                    <option value="openai_tts">OpenAI Audio TTS (tts-1 - Proxied via Server)</option>
                    <option value="elevenlabs">ElevenLabs API (Proxied via Server)</option>
                    <option value="browser">Browser Web Speech Synthesis (Zero-network Preview)</option>
                  </select>
                  <input id="inpTtsKey" type="password" value="${store.api.ttsKey}" placeholder="Optional Voice API Key (uses #1 if blank)..." class="w-full bg-studio-bg border border-studio-border rounded px-2.5 py-1 text-white font-mono" />
                </div>
                <div class="bg-studio-card border border-studio-border rounded-lg p-3 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-slate-300 font-bold">4. Backend Gateway URL (Optional)</label>
                    <span class="text-[10px] text-slate-400">Default: Direct / Same-Origin</span>
                  </div>
                  <input id="inpApiBase" type="text" value="${store.api.apiBase || ''}" placeholder="Leave blank for Amplify client mode, or enter https://... (for Aurora RDS API)" class="w-full bg-studio-bg border border-studio-border rounded px-2.5 py-1 text-white font-mono text-[11px]" />
                </div>
              </div>
              <div class="flex items-center justify-between pt-1">
                <button id="btnSaveRds" type="button" class="hidden px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow">
                  ⚡ Save to Aurora RDS
                </button>
                <button id="btnSaveApi" type="button" class="ml-auto px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition">
                  Save &amp; Apply Settings
                </button>
              </div>
            </div>
          </div>
        `;

        this.querySelector("#btnCloseApi").addEventListener("click", () => this.querySelector("#apiModalWrap").classList.add("hidden"));

        const keyInput = this.querySelector("#inpLlmKey");
        let debounceTimer;
        keyInput.addEventListener("input", () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const val = keyInput.value.trim();
            if (val.length >= 15) {
              this.refreshModels(val);
            }
          }, 600);
        });

        this.querySelector("#btnFetchModels")?.addEventListener("click", () => {
          const key = this.querySelector("#inpLlmKey").value.trim();
          this.refreshModels(key);
        });

        this.querySelector("#btnTestRds")?.addEventListener("click", async () => {
          const btn = this.querySelector("#btnTestRds");
          const origText = btn.textContent;
          btn.textContent = "Testing...";
          try {
            const res = await fetch("./api/keys.php?action=test_rds");
            const data = await res.json();
            if (data.ok) {
              window.StickForgeBus.emit("status:toast", {
                message: `⚡ Connected to Amazon Aurora RDS in ${data.latency_ms}ms! (${data.host})`
              });
            } else {
              window.StickForgeBus.emit("status:toast", {
                message: `⚠️ Aurora RDS Connection: ${data.error || 'Check credentials'}`
              });
            }
          } catch (e) {
            window.StickForgeBus.emit("status:toast", { message: `RDS connection test failed: ${e.message}` });
          } finally {
            btn.textContent = origText;
            this.checkRdsStatus();
          }
        });

        this.querySelector("#btnSaveRds")?.addEventListener("click", async () => {
          const btn = this.querySelector("#btnSaveRds");
          btn.textContent = "Saving to RDS...";
          try {
            const res = await fetch("./api/keys.php?action=save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                geminiKey: this.querySelector("#inpLlmKey").value.trim(),
                openaiKey: this.querySelector("#inpImgKey").value.trim(),
                elevenlabsKey: this.querySelector("#inpTtsKey").value.trim()
              })
            });
            const data = await res.json();
            if (data.ok) {
              window.StickForgeBus.emit("status:toast", { message: `⚡ Keys saved in Amazon Aurora RDS table stickforge_api_keys!` });
              this.checkRdsStatus();
            } else {
              throw new Error(data.error || "Save failed");
            }
          } catch (err) {
            window.StickForgeBus.emit("status:toast", { message: `RDS Save Error: ${err.message}` });
          } finally {
            btn.textContent = "⚡ Save to Aurora RDS";
          }
        });

        this.querySelector("#inpLlmModel")?.addEventListener("change", (e) => {
          store.api.llmModel = e.target.value;
          const descEl = this.querySelector("#modelDescSnippet");
          const activeObj = (store.api.availableModels || []).find(m => m.id === e.target.value);
          if (descEl) descEl.textContent = activeObj?.description ? activeObj.description.slice(0, 55) + "..." : "";
          window.StickForgeBus.emit("model:changed", { model: e.target.value });
        });

        this.querySelector("#btnSaveApi").addEventListener("click", () => {
          store.api.llmModel = this.querySelector("#inpLlmModel")?.value || "gemini-2.5-flash";
          store.api.llmKey = this.querySelector("#inpLlmKey").value.trim();
          store.api.imgProvider = this.querySelector("#inpImgProvider").value;
          store.api.imgKey = this.querySelector("#inpImgKey").value.trim();
          store.api.ttsProvider = this.querySelector("#inpTtsProvider").value;
          store.api.ttsKey = this.querySelector("#inpTtsKey").value.trim();
          store.api.apiBase = this.querySelector("#inpApiBase")?.value.trim() || "";

          // Persist settings locally in browser across sessions/reloads
          store.saveClientApiSettings();

          // Auto-sync to Aurora RDS in background if enabled
          fetch("./api/keys.php?action=save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              geminiKey: store.api.llmKey,
              openaiKey: store.api.imgKey,
              elevenlabsKey: store.api.ttsKey
            })
          }).catch(() => {});

          this.querySelector("#apiModalWrap").classList.add("hidden");
          window.StickForgeBus.emit("model:changed", { model: store.api.llmModel });
          window.StickForgeBus.emit("status:toast", { message: `Saved API settings with model: ${store.api.llmModel}` });
        });

        // Initialize dropdown
        if (store.api.availableModels && store.api.availableModels.length) {
          this.populateModelDropdown(store.api.availableModels);
        }
      }
    }
    customElements.define("sf-api-modal", SfApiModal);

    class SfModuleExporterModal extends HTMLElement {
      connectedCallback() {
        this.render();
        window.StickForgeBus.on("modal:exporter:open", () => {
          this.querySelector("#expModalWrap").classList.remove("hidden");
        });
      }
      render() {
        this.innerHTML = `
          <div id="expModalWrap" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-studio-panel border border-studio-border rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3">
              <div class="flex items-center justify-between border-b border-studio-border pb-2">
                <h2 class="text-sm font-bold text-white">📦 Download Split Modules &amp; Assets</h2>
                <button id="btnCloseExp" type="button" class="text-slate-400 hover:text-white">✕</button>
              </div>
              <p class="text-xs text-slate-300">Download any organized module independently from <code>assets/js/</code>:</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <button type="button" data-fn="store.js" class="mod-dl p-2.5 rounded-lg bg-studio-card hover:bg-slate-800 border border-studio-border text-left font-mono text-indigo-300">⬇ assets/js/store.js</button>
                <button type="button" data-fn="services-ai.js" class="mod-dl p-2.5 rounded-lg bg-studio-card hover:bg-slate-800 border border-studio-border text-left font-mono text-purple-300">⬇ assets/js/services-ai.js</button>
                <button type="button" data-fn="renderer-2d.js" class="mod-dl p-2.5 rounded-lg bg-studio-card hover:bg-slate-800 border border-studio-border text-left font-mono text-emerald-300">⬇ assets/js/renderer-2d.js</button>
                <button type="button" data-fn="components.js" class="mod-dl p-2.5 rounded-lg bg-studio-card hover:bg-slate-800 border border-studio-border text-left font-mono text-amber-300">⬇ assets/js/components.js</button>
              </div>
            </div>
          </div>
        `;
        this.querySelector("#btnCloseExp").addEventListener("click", () => this.querySelector("#expModalWrap").classList.add("hidden"));
        this.querySelectorAll(".mod-dl").forEach(b => {
          b.addEventListener("click", async () => {
            const fileName = b.dataset.fn;
            try {
              const res = await fetch(`./assets/js/${fileName}`);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const text = await res.text();
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([text], { type: "application/javascript" }));
              a.download = fileName;
              a.click();
            } catch (err) {
              window.StickForgeBus.emit("status:toast", { message: `Unable to download ${fileName}: ${err.message}` });
            }
          });
        });
      }
    }
    customElements.define("sf-module-exporter-modal", SfModuleExporterModal);