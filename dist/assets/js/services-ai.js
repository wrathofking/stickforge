/**
 * StickForge 2D - AI Services Layer
 * Web-ready API client with PHP backend proxy, CORS resolution,
 * automatic retries with exponential backoff, and offline fallback.
 */
window.StickForgeAI = {
  // Configurable API base endpoint (default to window.STICKFORGE_API_BASE or store or same-origin /api)
  get apiBase() {
    return window.STICKFORGE_API_BASE || window.StickForgeStore?.api?.apiBase || "./api";
  },
  backendAvailable: null, // null = unchecked, true = connected, false = static/unreachable

  async fetchWithBackoff(url, options, retries = 3) {
    let delay = 1000;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        if (res.status !== 429 && res.status < 500) return res;
      } catch (err) {
        if (attempt === retries - 1) throw err;
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
    return null;
  },

  // Helper to make request to PHP backend gateway first, falling back to direct client BYOK
  async requestBackendOrDirect(endpoint, payload, clientDirectFn) {
    const store = window.StickForgeStore;
    const useProxy = store.api.useBackendProxy !== false && this.backendAvailable !== false;

    if (useProxy) {
      try {
        const url = `${this.apiBase}/${endpoint}`;
        const headers = { "Content-Type": "application/json" };
        if (store.api.llmKey) headers["X-API-Key"] = store.api.llmKey;

        const res = await this.fetchWithBackoff(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        }, 1);

        if (res && res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            if (data && data.ok) {
              this.backendAvailable = true;
              return { success: true, data };
            }
          }
        }
        // If not JSON or not OK (e.g. 404 on static Amplify hosting), mark backend as unavailable
        this.backendAvailable = false;
      } catch (err) {
        console.warn(`[StickForgeAI] Backend proxy (${endpoint}) error:`, err);
        this.backendAvailable = false;
      }
    }

    // Fall back to direct client function
    if (typeof clientDirectFn === "function") {
      try {
        const fallbackRes = await clientDirectFn();
        if (fallbackRes) return { success: true, data: fallbackRes };
      } catch (clientErr) {
        console.warn(`[StickForgeAI] Client direct call error:`, clientErr);
      }
    }

    return { success: false, data: null };
  },

  // ---------------------------------------------------------------------------
  // Fetch All Available Models from Gemini API (Given an API key)
  // ---------------------------------------------------------------------------
  async fetchAvailableModels(apiKeyOverride = "") {
    const store = window.StickForgeStore;
    const apiKey = (apiKeyOverride || store.api.llmKey || "").trim();

    store.api.isLoadingModels = true;
    window.StickForgeBus.emit("models:loading", { loading: true });

    // 1. Try PHP Backend Gateway first
    const backendResult = await this.requestBackendOrDirect(
      "gemini.php?action=list_models",
      { apiKey },
      async () => {
        // Direct Client Fallback (CORS allowed for v1beta/models)
        if (!apiKey) return null;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
        const res = await this.fetchWithBackoff(url, { method: "GET" }, 2);
        if (res && res.ok) {
          const data = await res.json();
          const rawModels = data.models || [];
          const models = rawModels.map(m => {
            const rawName = m.name || "";
            const id = rawName.replace(/^models\//, "");
            const methods = m.supportedGenerationMethods || [];
            return {
              id,
              name: rawName,
              displayName: m.displayName || id,
              description: m.description || "",
              supportedMethods: methods,
              supportsGenerate: methods.includes("generateContent")
            };
          });
          models.sort((a, b) => {
            if (a.supportsGenerate !== b.supportsGenerate) return b.supportsGenerate ? 1 : -1;
            return a.displayName.localeCompare(b.displayName);
          });
          return { models };
        }
        return null;
      }
    );

    store.api.isLoadingModels = false;
    window.StickForgeBus.emit("models:loading", { loading: false });

    if (backendResult.success && Array.isArray(backendResult.data?.models) && backendResult.data.models.length > 0) {
      const models = backendResult.data.models;
      store.api.availableModels = models;
      window.StickForgeBus.emit("models:loaded", { models, count: models.length });
      window.StickForgeBus.emit("status:toast", {
        message: `✨ Loaded ${models.length} available Gemini models for your API key!`
      });
      return models;
    }

    // Default curated fallback models if no key provided yet or offline
    const fallbackModels = [
      { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", description: "Recommended - Fast & high quality", supportsGenerate: true },
      { id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", description: "Ultra fast next-gen model", supportsGenerate: true },
      { id: "gemini-2.0-flash-lite", displayName: "Gemini 2.0 Flash-Lite", description: "Lightweight and cost-efficient", supportsGenerate: true },
      { id: "gemini-1.5-flash", displayName: "Gemini 1.5 Flash", description: "Fast, versatile production model", supportsGenerate: true },
      { id: "gemini-1.5-pro", displayName: "Gemini 1.5 Pro", description: "Complex reasoning and long-context", supportsGenerate: true },
      { id: "imagen-3.0-generate-002", displayName: "Imagen 3 Image Generator", description: "High-fidelity photorealistic and artistic generation", supportsGenerate: false }
    ];
    store.api.availableModels = fallbackModels;
    window.StickForgeBus.emit("models:loaded", { models: fallbackModels, count: fallbackModels.length, fallback: true });
    return fallbackModels;
  },

  // ---------------------------------------------------------------------------
  // 1. Analyze YouTube URL or Script Sample to Clone Writing Style DNA
  // ---------------------------------------------------------------------------
  async analyzeWritingStyleFromSource(sourceInput, customStyleName) {
    const store = window.StickForgeStore;
    const apiKey = store.api.llmKey || "";
    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(sourceInput.trim());

    window.StickForgeBus.emit("status:toast", {
      message: isUrl ? `🧬 Analyzing YouTube Video Style (${sourceInput.trim()})...` : `🧬 Extracting Writing Style DNA from transcript...`
    });

    // Try PHP Backend Proxy First
    const backendResult = await this.requestBackendOrDirect(
      "gemini.php?action=analyze_style",
      {
        source: sourceInput,
        customStyleName,
        apiKey
      },
      async () => {
        // Direct Client Fallback using standard gemini-2.5-flash / gemini-2.0-flash
        if (!apiKey) return null;
        const sysPrompt = `You are an elite YouTube Script Analyst. Analyze the provided YouTube video premise or script transcript and extract a reusable Writing Style DNA profile.
Return ONLY valid JSON matching this schema:
{
  "name": "Short descriptive style name",
  "tone": "Emotional & narrative tone",
  "hookFormula": "How the first 15 seconds hook the viewer",
  "pacing": "Sentence length, rhythm, and scene transitions",
  "vocabulary": "Word choice and inline expressive voice tags",
  "twistStructure": "How the story builds to a climax and moral twist"
}`;

        const model = store.api.llmModel || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const payload = {
          contents: [{
            role: "user",
            parts: [{ text: isUrl ? `Analyze the storytelling style, pacing, and structure of this YouTube video concept: ${sourceInput}` : `Analyze this script sample:\n\n${sourceInput}` }]
          }],
          systemInstruction: { parts: [{ text: sysPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        };

        const res = await this.fetchWithBackoff(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }, 2);

        if (res && res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            return {
              style: {
                id: "style_" + Date.now(),
                name: customStyleName || parsed.name || "Cloned YouTube Style",
                source: sourceInput.slice(0, 80),
                tone: parsed.tone || "Dramatic first-person story",
                hookFormula: parsed.hookFormula || "High-contrast opening premise",
                pacing: parsed.pacing || "Fast-paced 2-sentence paragraphs",
                vocabulary: parsed.vocabulary || "Conversational with [shocked] and [excitedly] tags",
                twistStructure: parsed.twistStructure || "Unexpected reveal and moral takeaway"
              }
            };
          }
        }
        return null;
      }
    );

    if (backendResult.success && backendResult.data?.style) {
      const styleObj = backendResult.data.style;
      store.writingStyles.unshift(styleObj);
      store.activeStyleId = styleObj.id;
      window.StickForgeBus.emit("styles:updated", { style: styleObj });
      window.StickForgeBus.emit("status:toast", { message: `🧬 Cloned Style: "${styleObj.name}"!` });
      return styleObj;
    }

    // Procedural Fallback
    const fallback = {
      id: "style_" + Date.now(),
      name: customStyleName || (isUrl ? `YouTube Cloned (${sourceInput.slice(-11)})` : "Custom Transcript Style"),
      source: sourceInput.slice(0, 80),
      tone: "Engaging first-person narrative with high curiosity",
      hookFormula: "Starts in media res with a shocking numeric metric above someone's head.",
      pacing: "Punchy 20-word paragraphs with rapid visual escalation.",
      vocabulary: "Conversational, clear, uses [shocked], [whispers], and [excitedly].",
      twistStructure: "Subverts the initial metric advantage with a deeper character lesson."
    };
    store.writingStyles.unshift(fallback);
    store.activeStyleId = fallback.id;
    window.StickForgeBus.emit("styles:updated", { style: fallback });
    window.StickForgeBus.emit("status:toast", { message: `🧬 Applied Preset Style: "${fallback.name}" (Built-in Fallback)` });
    return fallback;
  },

  // ---------------------------------------------------------------------------
  // 2. Gemini Script Generator with Configurable Duration & Style Profile
  // ---------------------------------------------------------------------------
  async generateScriptWithGemini(topic, styleProfile, targetMinutes = 1.0) {
    const store = window.StickForgeStore;
    const apiKey = store.api.llmKey || "";
    const mins = Math.max(0.5, Math.min(60, Number(targetMinutes) || 1.0));
    const targetShots = Math.max(3, Math.round(mins * 9));
    const targetWords = Math.round(mins * 150);

    window.StickForgeBus.emit("status:toast", {
      message: `✨ Writing ${mins}-min script (~${targetShots} shots / ${targetWords} words) with Gemini...`
    });

    // Try PHP Backend Proxy First
    const backendResult = await this.requestBackendOrDirect(
      "gemini.php?action=generate_script",
      {
        topic,
        styleProfile,
        targetMinutes: mins,
        apiKey
      },
      async () => {
        // Direct Client Fallback using standard gemini-2.5-flash / gemini-2.0-flash
        if (!apiKey) return null;
        const sysPrompt = `You are an expert YouTube stick-story scriptwriter.
Write a ${targetShots}-paragraph first-person script (${targetWords} words total, for a ${mins}-minute video) about the user's premise.
Follow this Writing Style DNA:
- Style Name: ${styleProfile.name}
- Tone: ${styleProfile.tone}
- Hook Formula: ${styleProfile.hookFormula}
- Pacing: ${styleProfile.pacing}
- Twist: ${styleProfile.twistStructure}
Include floating overhead metrics (e.g., "160 IQ", "70 IQ", "YES", "NO", "$10M") and Gemini 3.1 TTS expressive tags ([shocked], [whispers], [excitedly], [thoughtful]) at the start of paragraphs.
Return ONLY valid JSON: { "paragraphs": ["paragraph 1...", "paragraph 2..."] }`;

        const model = store.api.llmModel || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const res = await this.fetchWithBackoff(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `Topic: ${topic}\nTarget Length: ${mins} minutes (${targetShots} paragraphs).` }] }],
            systemInstruction: { parts: [{ text: sysPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          })
        }, 2);

        if (res && res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.paragraphs) && parsed.paragraphs.length > 0) {
              return { paragraphs: parsed.paragraphs };
            }
          }
        }
        return null;
      }
    );

    if (backendResult.success && backendResult.data?.paragraphs?.length) {
      window.StickForgeBus.emit("status:toast", { message: `✨ Generated ${backendResult.data.paragraphs.length} shots via Gemini!` });
      return backendResult.data.paragraphs;
    }

    // Procedural Fallback generator scaled to targetShots
    const clean = topic.replace(/\?+$/, "");
    const templates = [
      `[shocked] It started at 7 AM when I looked in the bedroom mirror and realized "${clean}" was real—with 160 IQ glowing in neon green above my head.`,
      `[excitedly] Even my dog Buster trotted into the room with a glowing 45 IQ badge wagging above his floppy ears!`,
      `[whispers] When I walked into first-period classroom, the top student Oliver was waving his A+ test paper while a red 70 IQ floated over him.`,
      `[thoughtful] In the school hallway, my best friend Jake asked what his number was. Seeing 98 IQ above his head, I smiled and told him he was brilliant.`,
      `[shocked] During lunch in the cafeteria, everyone panicked when the principal walked past with a flickering warning counter above his suit.`,
      `[thoughtful] Spending all afternoon in the library, I noticed Oliver studying every single chapter by hand while I relied on raw luck.`,
      `[awe] At the National Auditorium Challenge, a mysterious rival stepped up to the microphone with 185 IQ blazing in purple.`,
      `[excitedly] Oliver and I combined my pattern speed with his relentless preparation, winning the golden trophy together in front of the whole school!`
    ];
    const out = [];
    for (let i = 0; i < targetShots; i++) {
      out.push(templates[i % templates.length] + (i >= templates.length ? ` (Act ${Math.floor(i / templates.length) + 1}, Scene ${i + 1})` : ""));
    }
    window.StickForgeBus.emit("status:toast", { message: `✨ Generated ${targetShots} shots with procedural script template.` });
    return out;
  },

  // ---------------------------------------------------------------------------
  // 3. AI Stick Model & Object Prop Forge
  // ---------------------------------------------------------------------------
  async generateCustomModelOrObject(kind, promptText, subType) {
    const store = window.StickForgeStore;
    const apiKey = store.api.llmKey || "";
    const clean = (promptText || "Cyber Ninja").trim();
    window.StickForgeBus.emit("status:toast", { message: `🎨 Forging 2D ${kind}: "${clean}"...` });

    // Try PHP Backend Proxy First
    const backendResult = await this.requestBackendOrDirect(
      "gemini.php?action=forge_model",
      {
        kind,
        promptText: clean,
        subType,
        apiKey
      },
      async () => {
        if (!apiKey) return null;
        const model = store.api.llmModel || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        if (kind === "character") {
          const sys = `You generate a 2D stick-style character rig JSON for StickForge Studio.
Return ONLY valid JSON:
{
  "name": "${clean}",
  "category": "${subType === 'animal' ? 'animal' : 'humanoid'}",
  "species": "${subType === 'animal' ? 'dog' : 'human'}",
  "headScale": 1.0,
  "headShape": "circle",
  "torsoLength": 64,
  "limbLength": 50,
  "hasHands": true,
  "hasFeet": true,
  "ears": "${subType === 'animal' ? 'floppy' : 'none'}",
  "tail": "${subType === 'animal' ? 'wag' : 'none'}",
  "antenna": false,
  "defaultColor": "#hex"
}`;
          const res = await this.fetchWithBackoff(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `Create a ${subType} stick-style model for: ${clean}` }] }],
              systemInstruction: { parts: [{ text: sys }] },
              generationConfig: { responseMimeType: "application/json" }
            })
          }, 2);
          if (res && res.ok) {
            const data = await res.json();
            const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
            return { result: parsed, kind: "character" };
          }
        } else {
          const slot = subType || "hand";
          const sys = `You generate 2D vector prop/clothing geometry for a stick figure attachment socket (${slot}).
Coordinates are relative to the socket anchor (0,0) within -25..25.
Return ONLY valid JSON:
{
  "name": "${clean}",
  "slot": "${slot}",
  "shapes": [
    { "type": "roundRect", "x": -12, "y": -14, "w": 24, "h": 28, "r": 6, "fill": "#6366f1", "stroke": "#0f172a" },
    { "type": "text", "x": 0, "y": 1, "text": "SHORT", "color": "#ffffff", "size": 11 }
  ]
}`;
          const res = await this.fetchWithBackoff(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `Create a 2D vector object "${clean}" for socket: ${slot}` }] }],
              systemInstruction: { parts: [{ text: sys }] },
              generationConfig: { responseMimeType: "application/json" }
            })
          }, 2);
          if (res && res.ok) {
            const data = await res.json();
            const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
            return { result: parsed, kind: "object" };
          }
        }
        return null;
      }
    );

    if (backendResult.success && backendResult.data?.result) {
      const parsed = backendResult.data.result;
      if (kind === "character" && parsed.name) {
        const newCharModel = {
          id: "model_" + Date.now(),
          name: parsed.name,
          category: parsed.category || subType,
          species: parsed.species || "custom",
          headScale: Number(parsed.headScale) || 1.0,
          headShape: parsed.headShape || "circle",
          torsoLength: Number(parsed.torsoLength) || 64,
          limbLength: Number(parsed.limbLength) || 50,
          bodyLength: 60,
          legLength: 32,
          hasHands: parsed.hasHands !== false,
          hasFeet: parsed.hasFeet !== false,
          ears: parsed.ears || (subType === "animal" ? "pointed" : "none"),
          tail: parsed.tail || (subType === "animal" ? "wag" : "none"),
          antenna: Boolean(parsed.antenna),
          defaultColor: parsed.defaultColor || "#38bdf8"
        };
        window.SF_MODEL_GALLERY.characterModels.push(newCharModel);
        window.StickForgeBus.emit("gallery:updated");
        window.StickForgeBus.emit("status:toast", { message: `🎨 Forged Character Rig: "${newCharModel.name}"!` });
        return newCharModel;
      } else if (kind === "object" && parsed.shapes) {
        const obj = { id: "obj_" + Date.now(), name: parsed.name || clean, slot: parsed.slot || subType, shapes: parsed.shapes };
        window.SF_MODEL_GALLERY.objectModels.push(obj);
        window.StickForgeBus.emit("gallery:updated");
        window.StickForgeBus.emit("status:toast", { message: `🎨 Forged Prop Attachment: "${obj.name}"!` });
        return obj;
      }
    }

    // Procedural fallback
    if (kind === "character") {
      const p = clean.toLowerCase();
      const isAnimal = subType === "animal" || p.includes("dog") || p.includes("cat") || p.includes("wolf") || p.includes("fox");
      const isRobot = p.includes("bot") || p.includes("mech") || p.includes("cyber");
      const newModel = {
        id: "model_" + Date.now(),
        name: clean,
        category: isAnimal ? "animal" : "humanoid",
        species: p.includes("cat") ? "cat" : "dog",
        headScale: isRobot ? 1.1 : 1.0,
        headShape: isRobot ? "box" : "circle",
        torsoLength: 66,
        limbLength: 52,
        bodyLength: 62,
        legLength: 34,
        hasHands: true,
        hasFeet: true,
        ears: isAnimal ? (p.includes("cat") ? "pointed" : "floppy") : "none",
        tail: isAnimal ? "wag" : "none",
        antenna: isRobot,
        defaultColor: isRobot ? "#38bdf8" : isAnimal ? "#f59e0b" : "#10b981"
      };
      window.SF_MODEL_GALLERY.characterModels.push(newModel);
      window.StickForgeBus.emit("gallery:updated");
      window.StickForgeBus.emit("status:toast", { message: `🎨 Created Character Rig "${clean}" (Procedural)` });
      return newModel;
    } else {
      const slot = subType || "hand";
      const obj = {
        id: "obj_" + Date.now(),
        name: clean,
        slot,
        shapes: [
          { type: "roundRect", x: -14, y: -16, w: 28, h: 28, r: 6, fill: "#6366f1", stroke: "#0f172a" },
          { type: "text", x: 0, y: 1, text: clean.slice(0, 4).toUpperCase(), color: "#fde047", size: 10 }
        ]
      };
      window.SF_MODEL_GALLERY.objectModels.push(obj);
      window.StickForgeBus.emit("gallery:updated");
      window.StickForgeBus.emit("status:toast", { message: `🎨 Created Prop "${clean}" (Procedural)` });
      return obj;
    }
  },

  // ---------------------------------------------------------------------------
  // 4. Google Flow 2D Background Generator
  // ---------------------------------------------------------------------------
  buildGoogleFlowPrompt(shot, customDesc) {
    const store = window.StickForgeStore;
    const desc = (customDesc || shot.bgPrompt || shot.narration || shot.setting).replace(/\[[^\]]+\]/g, "").trim();
    const camMap = {
      zoom_in: "Slow cinematic push-in camera movement",
      zoom_out: "Slow pull-back reveal camera movement",
      pan_right: "Smooth horizontal tracking pan left-to-right",
      pan_left: "Smooth horizontal tracking pan right-to-left",
      shake: "Handheld dramatic tension camera shake",
      static: "Locked tripod wide establishing shot"
    };
    return `[Google Flow Scenebuilder | Ingredients: Vibrant 2D flat-shaded cartoon animation background illustration, clean bold ink linework, rich atmospheric lighting, warm depth of field, unobstructed foreground floor in bottom 20% for 2D stick-figure actors, text-free, no characters in background] Scene: ${desc}. Aspect Ratio: ${store.aspectRatio}. Camera Control: ${camMap[shot.camera] || camMap.zoom_in}.`;
  },

  async generateFlowBackground(shot, customPrompt) {
    const store = window.StickForgeStore;
    const desc = (customPrompt || shot.bgPrompt || shot.narration || shot.setting).replace(/\[[^\]]+\]/g, "").trim();
    shot.bgPrompt = desc;
    store.isGeneratingBg = true;
    window.StickForgeBus.emit("bg:generating", { status: true });
    window.StickForgeBus.emit("status:toast", { message: `🌊 Generating 2D background for "${desc.slice(0, 38)}"...` });

    const flowPrompt = this.buildGoogleFlowPrompt(shot, desc);
    const apiKey = store.api.imgKey || store.api.llmKey || "";
    const imgProvider = store.api.imgProvider || "google_flow";

    // 1. Try PHP Backend Gateway (CORS safe)
    if (imgProvider !== "built_in_painter") {
      const backendResult = await this.requestBackendOrDirect(
        "images.php",
        {
          provider: imgProvider,
          prompt: flowPrompt,
          aspectRatio: store.aspectRatio,
          apiKey
        },
        async () => {
          // Direct Client Fallback if Imagen / Gemini key is present
          if (apiKey && (imgProvider === "google_flow" || imgProvider === "imagen_4")) {
            // Imagen 3 predict
            const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`;
            const res = await this.fetchWithBackoff(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt: flowPrompt }],
                parameters: { sampleCount: 1, aspectRatio: store.aspectRatio === "9:16" ? "9:16" : "16:9" }
              })
            }, 2);
            if (res && res.ok) {
              const data = await res.json();
              const b64 = data.predictions?.[0]?.bytesBase64Encoded;
              if (b64) return { dataUrl: "data:image/png;base64," + b64 };
            }
          }
          return null;
        }
      );

      if (backendResult.success && (backendResult.data?.dataUrl || backendResult.data?.imageUrl)) {
        const urlToAttach = backendResult.data.dataUrl || backendResult.data.imageUrl;
        await window.StickForgeRenderer.attachDataUrlToShot(shot, urlToAttach);
        store.isGeneratingBg = false;
        window.StickForgeBus.emit("bg:generating", { status: false });
        window.StickForgeBus.emit("status:toast", { message: `🌊 Attached 2D background!` });
        return true;
      }
    }

    // 2. Procedural 2D Cartoon Plate Fallback (Always reliable & offline)
    await window.StickForgeRenderer.buildRichProceduralPlateForShot(shot, desc);
    store.isGeneratingBg = false;
    window.StickForgeBus.emit("bg:generating", { status: false });
    window.StickForgeBus.emit("status:toast", { message: `🌊 Synthesized rich 2D cartoon plate for "${desc.slice(0, 34)}"!` });
    return true;
  },

  // ---------------------------------------------------------------------------
  // 5. TTS Voiceover Audio Synthesizer (Backend Proxy + Web Speech Preview)
  // ---------------------------------------------------------------------------
  pcm16Base64ToWavUrl(base64Data, sampleRate = 24000) {
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const pcmBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) pcmBytes[i] = binaryStr.charCodeAt(i);
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + pcmBytes.byteLength, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, pcmBytes.byteLength, true);
    return URL.createObjectURL(new Blob([wavHeader, pcmBytes], { type: "audio/wav" }));
  },

  async synthesizeShotAudio(shot, shotIdx = 0) {
    const store = window.StickForgeStore;
    if (!shot || !shot.narration || !shot.narration.trim()) return false;
    const prov = store.api.ttsProvider || "gemini_31_tts";
    const voiceName = store.api.ttsVoiceName || "Puck";
    const stylePrompt = store.api.ttsStylePrompt || "Engaging, dramatic YouTube stick-story narrator";
    const apiKey = store.api.ttsKey || store.api.llmKey || "";

    if (prov !== "browser") {
      window.StickForgeBus.emit("status:toast", { message: `🔊 Synthesizing Shot ${shotIdx + 1} Voiceover (${voiceName})...` });

      // Try Backend Proxy
      const backendResult = await this.requestBackendOrDirect(
        "tts.php",
        {
          provider: prov,
          text: shot.narration,
          voice: voiceName,
          stylePrompt,
          apiKey
        },
        null
      );

      if (backendResult.success && backendResult.data?.audioDataUrl) {
        store.shotAudioUrls[shot.id] = backendResult.data.audioDataUrl;
        window.StickForgeBus.emit("shots:updated");
        window.StickForgeBus.emit("status:toast", { message: `🔊 Audio attached to Shot ${shotIdx + 1}!` });
        return true;
      }
    }

    // Fallback: Browser Web Speech API
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(shot.narration.replace(/\[[^\]]+\]/g, ""));
      utter.rate = store.voiceRate || 1.05;
      utter.pitch = store.voicePitch || 1.0;
      window.speechSynthesis.speak(utter);
      window.StickForgeBus.emit("status:toast", { message: `🔊 Playing Shot ${shotIdx + 1} with Browser Speech Synthesis.` });
    }
    return false;
  }
};
