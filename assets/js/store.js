/**
 * StickForge 2D - Global State Store, Event Bus & Presets
 * Modular client-side state manager for web deployment
 */
(function() {
  class StickForgeEventBus {
    constructor() { this.listeners = {}; }
    on(event, cb) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    }
    emit(event, detail = {}) {
      (this.listeners[event] || []).forEach(cb => {
        try { cb(detail); } catch (err) { console.error(`Bus error [${event}]:`, err); }
      });
    }
  }
  window.StickForgeBus = new StickForgeEventBus();

  // 14 Expressive 2D Faces
  window.SF_EXPRESSIONS = [
    { id: "neutral", label: "Neutral" },
    { id: "happy", label: "Happy / Smiling" },
    { id: "laughing", label: "Laughing Out Loud" },
    { id: "smug", label: "Smug / Grinning" },
    { id: "cool", label: "Cool Sunglasses" },
    { id: "starstruck", label: "Star-Struck (★_★)" },
    { id: "shocked", label: "Shocked / Wide Eyes" },
    { id: "mindblown", label: "Mind-Blown (Sparks)" },
    { id: "sweat", label: "Nervous Sweat Drop" },
    { id: "suspicious", label: "Suspicious Squint" },
    { id: "thinking", label: "Thinking / Focused" },
    { id: "deadpan", label: "Deadpan / Unamused" },
    { id: "sad", label: "Sad / Worried" },
    { id: "crying", label: "Crying Tears" },
    { id: "angry", label: "Angry / Glaring" }
  ];

  // Articulated 16-Joint Motion Library (Upgradable via Motion Studio)
  // Angles in degrees: torsoTilt, headNod, lShoulder, lElbow, rShoulder, rElbow, lHip, lKnee, rHip, rKnee, bounceY
  window.SF_MOTION_LIBRARY = {
    idle: {
      name: "Idle Breathing", loopSpeed: 2.5,
      frames: [
        { torsoTilt: 0, headNod: 0, lShoulder: -25, lElbow: -12, rShoulder: 25, rElbow: 12, lHip: -12, lKnee: 4, rHip: 12, rKnee: -4, bounceY: 0 },
        { torsoTilt: 1, headNod: 3, lShoulder: -28, lElbow: -16, rShoulder: 28, rElbow: 16, lHip: -12, lKnee: 5, rHip: 12, rKnee: -5, bounceY: -3 }
      ]
    },
    talk: {
      name: "Talking & Gesturing", loopSpeed: 6.0,
      frames: [
        { torsoTilt: 2, headNod: -3, lShoulder: -32, lElbow: -35, rShoulder: 45, rElbow: -65, lHip: -12, lKnee: 4, rHip: 12, rKnee: -4, bounceY: 0 },
        { torsoTilt: -1, headNod: 4, lShoulder: -48, lElbow: -55, rShoulder: 68, rElbow: -30, lHip: -12, lKnee: 4, rHip: 12, rKnee: -4, bounceY: -2.5 }
      ]
    },
    walk: {
      name: "Walking Cycle (Fluid Joints)", loopSpeed: 7.5,
      frames: [
        { torsoTilt: 5, headNod: 2, lShoulder: 35, lElbow: -30, rShoulder: -35, rElbow: -25, lHip: -35, lKnee: 28, rHip: 32, rKnee: 10, bounceY: -4 },
        { torsoTilt: 5, headNod: -2, lShoulder: -35, lElbow: -25, rShoulder: 35, rElbow: -30, lHip: 32, lKnee: 10, rHip: -35, rKnee: 28, bounceY: 1 }
      ]
    },
    run: {
      name: "Running Fast", loopSpeed: 12.0,
      frames: [
        { torsoTilt: 18, headNod: 5, lShoulder: 65, lElbow: -75, rShoulder: -60, rElbow: -70, lHip: -58, lKnee: 65, rHip: 50, rKnee: 20, bounceY: -8 },
        { torsoTilt: 18, headNod: -4, lShoulder: -60, lElbow: -70, rShoulder: 65, rElbow: -75, lHip: 50, lKnee: 20, rHip: -58, rKnee: 65, bounceY: 2 }
      ]
    },
    point: {
      name: "Pointing & Laughing", loopSpeed: 6.5,
      frames: [
        { torsoTilt: -4, headNod: -5, lShoulder: -35, lElbow: -45, rShoulder: 88, rElbow: -5, lHip: -14, lKnee: 6, rHip: 14, rKnee: -4, bounceY: 0 },
        { torsoTilt: -6, headNod: 4, lShoulder: -40, lElbow: -55, rShoulder: 96, rElbow: 0, lHip: -14, lKnee: 6, rHip: 14, rKnee: -4, bounceY: -4 }
      ]
    },
    study: {
      name: "Reading / Studying", loopSpeed: 3.0,
      frames: [
        { torsoTilt: 8, headNod: 16, lShoulder: 35, lElbow: -65, rShoulder: 45, rElbow: -70, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: 0 },
        { torsoTilt: 10, headNod: 20, lShoulder: 38, lElbow: -68, rShoulder: 48, rElbow: -74, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: -1.5 }
      ]
    },
    celebrate: {
      name: "Arms Up Celebrating", loopSpeed: 8.5,
      frames: [
        { torsoTilt: 0, headNod: -8, lShoulder: -145, lElbow: -20, rShoulder: 145, rElbow: 20, lHip: -22, lKnee: 15, rHip: 22, rKnee: -15, bounceY: -10 },
        { torsoTilt: 0, headNod: 4, lShoulder: -125, lElbow: -35, rShoulder: 125, rElbow: 35, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: 0 }
      ]
    },
    facepalm: {
      name: "Exasperated Facepalm", loopSpeed: 2.5,
      frames: [
        { torsoTilt: 10, headNod: 18, lShoulder: -25, lElbow: -15, rShoulder: 115, rElbow: -115, lHip: -10, lKnee: 5, rHip: 10, rKnee: -5, bounceY: 2 },
        { torsoTilt: 13, headNod: 22, lShoulder: -25, lElbow: -15, rShoulder: 118, rElbow: -118, lHip: -10, lKnee: 5, rHip: 10, rKnee: -5, bounceY: 4 }
      ]
    },
    panic: {
      name: "Panic / Flailing Arms", loopSpeed: 13.0,
      frames: [
        { torsoTilt: -8, headNod: -10, lShoulder: -155, lElbow: 25, rShoulder: 110, rElbow: -40, lHip: -28, lKnee: 30, rHip: 20, rKnee: -10, bounceY: -6 },
        { torsoTilt: 8, headNod: 10, lShoulder: -110, lElbow: 40, rShoulder: 155, rElbow: -25, lHip: 20, lKnee: 10, rHip: -28, rKnee: 30, bounceY: 1 }
      ]
    },
    shrug: {
      name: "Confused Shrug", loopSpeed: 3.5,
      frames: [
        { torsoTilt: 0, headNod: -6, lShoulder: -55, lElbow: -75, rShoulder: 55, rElbow: 75, lHip: -12, lKnee: 4, rHip: 12, rKnee: -4, bounceY: -2 },
        { torsoTilt: 0, headNod: 2, lShoulder: -45, lElbow: -65, rShoulder: 45, rElbow: 65, lHip: -12, lKnee: 4, rHip: 12, rKnee: -4, bounceY: 0 }
      ]
    },
    crossed_arms: {
      name: "Confident Crossed Arms", loopSpeed: 2.2,
      frames: [
        { torsoTilt: -4, headNod: -3, lShoulder: 28, lElbow: -95, rShoulder: -28, rElbow: 95, lHip: -15, lKnee: 3, rHip: 15, rKnee: -3, bounceY: 0 },
        { torsoTilt: -5, headNod: 0, lShoulder: 30, lElbow: -98, rShoulder: -30, rElbow: 98, lHip: -15, lKnee: 3, rHip: 15, rKnee: -3, bounceY: -2 }
      ]
    },
    typing: {
      name: "Typing / Texting Fast", loopSpeed: 11.0,
      frames: [
        { torsoTilt: 6, headNod: 14, lShoulder: 32, lElbow: -75, rShoulder: 45, rElbow: -85, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: 0 },
        { torsoTilt: 6, headNod: 15, lShoulder: 42, lElbow: -85, rShoulder: 34, rElbow: -70, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: -1 }
      ]
    },
    slump: {
      name: "Slumped / Defeated", loopSpeed: 2.0,
      frames: [
        { torsoTilt: 22, headNod: 25, lShoulder: 15, lElbow: 10, rShoulder: 20, rElbow: 12, lHip: -8, lKnee: 18, rHip: 8, rKnee: 18, bounceY: 8 },
        { torsoTilt: 25, headNod: 28, lShoulder: 18, lElbow: 14, rShoulder: 22, rElbow: 15, lHip: -8, lKnee: 20, rHip: 8, rKnee: 20, bounceY: 10 }
      ]
    },
    bow: {
      name: "Respectful Bow / Nod", loopSpeed: 3.0,
      frames: [
        { torsoTilt: 32, headNod: 25, lShoulder: -15, lElbow: -10, rShoulder: 15, rElbow: 10, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: 4 },
        { torsoTilt: 4, headNod: 2, lShoulder: -22, lElbow: -12, rShoulder: 22, rElbow: 12, lHip: -10, lKnee: 4, rHip: 10, rKnee: -4, bounceY: 0 }
      ]
    }
  };

  // Stick Models & Prop Gallery (Supports Humanoids, Quadruped Animals, Mech, and Socket Objects)
  window.SF_MODEL_GALLERY = {
    characterModels: [
      { id: "humanoid_teen", name: "2D Teenager (Articulated)", category: "humanoid", headScale: 1.0, torsoLength: 66, limbLength: 52, hasHands: true, hasFeet: true, ears: "none", tail: "none", defaultColor: "#facc15" },
      { id: "humanoid_buff", name: "Broad Athlete / Guard", category: "humanoid", headScale: 0.95, torsoLength: 72, limbLength: 56, torsoWidth: 48, hasHands: true, hasFeet: true, ears: "none", tail: "none", defaultColor: "#3b82f6" },
      { id: "humanoid_kid", name: "Small Kid Stickman", category: "humanoid", headScale: 1.15, torsoLength: 50, limbLength: 40, hasHands: true, hasFeet: true, ears: "none", tail: "none", defaultColor: "#10b981" },
      { id: "animal_dog", name: "Loyal Dog (Quadruped)", category: "animal", species: "dog", headScale: 0.85, bodyLength: 64, legLength: 34, ears: "floppy", tail: "wag", defaultColor: "#f59e0b" },
      { id: "animal_cat", name: "Sleek Cat (Quadruped)", category: "animal", species: "cat", headScale: 0.78, bodyLength: 54, legLength: 28, ears: "pointed", tail: "curled", defaultColor: "#a855f7" },
      { id: "mech_bot", name: "AI Robot Stick-Unit", category: "humanoid", headScale: 1.05, headShape: "box", torsoLength: 68, limbLength: 54, hasHands: true, hasFeet: true, antenna: true, defaultColor: "#38bdf8" }
    ],
    objectModels: [
      { id: "none", name: "None", slot: "any", shapes: [] },
      { id: "test_f", name: "Failed Test Paper (F)", slot: "hand", shapes: [{ type: "rect", x: -13, y: -20, w: 26, h: 34, fill: "#ffffff", stroke: "#0f172a" }, { type: "text", x: 0, y: 2, text: "F", color: "#dc2626", size: 15 }] },
      { id: "test_a", name: "Perfect Test Paper (A+)", slot: "hand", shapes: [{ type: "rect", x: -13, y: -20, w: 26, h: 34, fill: "#ffffff", stroke: "#0f172a" }, { type: "text", x: 0, y: 2, text: "A+", color: "#16a34a", size: 14 }] },
      { id: "phone", name: "Smartphone", slot: "hand", shapes: [{ type: "roundRect", x: -8, y: -15, w: 16, h: 28, r: 4, fill: "#0f172a", stroke: "#38bdf8" }, { type: "circle", x: 0, y: 9, r: 2, fill: "#38bdf8" }] },
      { id: "coffee_cup", name: "Hot Coffee Cup", slot: "hand", shapes: [{ type: "roundRect", x: -8, y: -12, w: 16, h: 22, r: 3, fill: "#f97316", stroke: "#0f172a" }, { type: "rect", x: -9, y: -5, w: 18, h: 7, fill: "#fde68a", stroke: "#0f172a" }] },
      { id: "book", name: "Thick Study Book", slot: "hand", shapes: [{ type: "roundRect", x: -15, y: -13, w: 30, h: 24, r: 3, fill: "#2563eb", stroke: "#0f172a" }, { type: "line", x1: 0, y1: -13, x2: 0, y2: 11, stroke: "#93c5fd" }] },
      { id: "trophy", name: "Golden Trophy", slot: "hand", shapes: [{ type: "circle", x: 0, y: -9, r: 11, fill: "#facc15", stroke: "#854d0e" }, { type: "rect", x: -4, y: 0, w: 8, h: 11, fill: "#facc15", stroke: "#854d0e" }, { type: "rect", x: -10, y: 10, w: 20, h: 5, fill: "#ca8a04", stroke: "#0f172a" }] },
      { id: "laptop", name: "Open Laptop", slot: "hand", shapes: [{ type: "rect", x: -16, y: -14, w: 26, h: 18, fill: "#334155", stroke: "#0f172a" }, { type: "rect", x: -18, y: 4, w: 32, h: 5, fill: "#94a3b8", stroke: "#0f172a" }] },
      { id: "microphone", name: "Stage Microphone", slot: "hand", shapes: [{ type: "rect", x: -3, y: -4, w: 6, h: 18, fill: "#334155", stroke: "#0f172a" }, { type: "circle", x: 0, y: -9, r: 7, fill: "#ef4444", stroke: "#0f172a" }] },
      { id: "crown", name: "Gold Genius Crown", slot: "head", shapes: [{ type: "polygon", points: [[-18,0],[-14,-18],[-6,-8],[0,-20],[6,-8],[14,-18],[18,0]], fill: "#facc15", stroke: "#854d0e" }] },
      { id: "grad_cap", name: "Graduation Cap", slot: "head", shapes: [{ type: "polygon", points: [[-24,-6],[0,-16],[24,-6],[0,2]], fill: "#1e293b", stroke: "#0f172a" }, { type: "line", x1: 16, y1: -6, x2: 20, y2: 10, stroke: "#facc15" }] },
      { id: "headphones", name: "Studio Headphones", slot: "head", shapes: [{ type: "circle", x: -24, y: 16, r: 7, fill: "#ef4444", stroke: "#0f172a" }, { type: "circle", x: 24, y: 16, r: 7, fill: "#ef4444", stroke: "#0f172a" }] },
      { id: "backpack", name: "School Backpack", slot: "back", shapes: [{ type: "roundRect", x: -14, y: -18, w: 28, h: 38, r: 8, fill: "#e11d48", stroke: "#0f172a" }] },
      { id: "cape", name: "Hero Flowing Cape", slot: "back", shapes: [{ type: "polygon", points: [[-10,-24],[10,-24],[24,42],[-24,42]], fill: "#dc2626", stroke: "#0f172a" }] }
    ]
  };

  const INITIAL_STYLES = [
    {
      id: "conchaser_iq",
      name: "ConChaser Viral What-If (youtu.be/2TsZSQ77E9o)",
      source: "https://youtu.be/2TsZSQ77E9o",
      tone: "First-person high-school anomaly drama with moral twist",
      hookFormula: "Immediate contrast between an unfair status symbol (70 IQ top student) and protagonist's hidden metric (160 IQ).",
      pacing: "Fast 2-sentence paragraphs, constant numeric comparisons, emotional mid-point realization.",
      vocabulary: "Simple conversational storytelling with inline [shocked], [whispers], [excitedly] voice tags.",
      twistStructure: "The metric measures raw potential, not discipline or kindness; rivals team up to win."
    },
    {
      id: "scifi_twist",
      name: "Sci-Fi Dystopian Metric Thriller",
      source: "Built-in Preset",
      tone: "Suspenseful, high-stakes mystery",
      hookFormula: "The protagonist spots a forbidden system glitch above a powerful figure's head.",
      pacing: "Escalating tension every scene with dramatic camera shakes.",
      vocabulary: "Crisp, cinematic, analytical.",
      twistStructure: "The protagonist learns how to rewrite the floating numbers."
    }
  ];

  const INITIAL_SHOTS = [
    {
      id: "shot_1",
      setting: "classroom",
      camera: "zoom_in",
      duration: 6.5,
      sfx: "buzzer",
      narration: "[shocked] The smartest kid in my school had an IQ of 70, and he was laughing at my failed test while a giant 160 IQ glowed above my head.",
      characters: [
        {
          id: "c1", name: "Max (Me)", modelId: "humanoid_teen", outfit: "#facc15", clothingStyle: "hoodie",
          badgeText: "160 IQ", badgeColor: "#22c55e", expr: "shocked", action: "idle",
          handR: "test_f", handL: "none", headwear: "none", backItem: "backpack",
          scale: 1.05, x: 30, y: 80, flip: false
        },
        {
          id: "c2", name: "Oliver", modelId: "humanoid_teen", outfit: "#3b82f6", clothingStyle: "blazer",
          badgeText: "70 IQ", badgeColor: "#ef4444", expr: "laughing", action: "point",
          handR: "test_a", handL: "none", headwear: "crown", backItem: "none",
          scale: 1.05, x: 70, y: 80, flip: true
        }
      ]
    },
    {
      id: "shot_2",
      setting: "bedroom",
      camera: "zoom_out",
      duration: 6.0,
      sfx: "pop",
      narration: "[awe] It started that morning when I woke up, saw 112 IQ floating above my mom's head, and even my dog Buster had 45 IQ!",
      characters: [
        {
          id: "c1", name: "Max (Me)", modelId: "humanoid_teen", outfit: "#facc15", clothingStyle: "hoodie",
          badgeText: "160 IQ", badgeColor: "#22c55e", expr: "mindblown", action: "talk",
          handR: "phone", handL: "none", headwear: "none", backItem: "none",
          scale: 1.05, x: 26, y: 80, flip: false
        },
        {
          id: "c2", name: "Buster", modelId: "animal_dog", outfit: "#f59e0b", clothingStyle: "none",
          badgeText: "45 IQ", badgeColor: "#f59e0b", expr: "happy", action: "walk",
          handR: "none", handL: "none", headwear: "none", backItem: "none",
          scale: 1.0, x: 52, y: 82, flip: false
        },
        {
          id: "c3", name: "Mom", modelId: "humanoid_teen", outfit: "#ec4899", clothingStyle: "sweater",
          badgeText: "112 IQ", badgeColor: "#38bdf8", expr: "happy", action: "idle",
          handR: "coffee_cup", handL: "none", headwear: "none", backItem: "none",
          scale: 1.0, x: 76, y: 80, flip: true
        }
      ]
    },
    {
      id: "shot_3",
      setting: "library",
      camera: "zoom_in",
      duration: 6.5,
      sfx: "ding",
      narration: "[thoughtful] In the library I realized IQ wasn't the same as preparation. Oliver studied until 3 AM every night—so we teamed up for the championship.",
      characters: [
        {
          id: "c1", name: "Max (Me)", modelId: "humanoid_teen", outfit: "#facc15", clothingStyle: "hoodie",
          badgeText: "160 IQ", badgeColor: "#22c55e", expr: "cool", action: "celebrate",
          handR: "trophy", handL: "book", headwear: "grad_cap", backItem: "none",
          scale: 1.05, x: 35, y: 80, flip: false
        },
        {
          id: "c2", name: "Oliver", modelId: "humanoid_teen", outfit: "#3b82f6", clothingStyle: "blazer",
          badgeText: "70 IQ", badgeColor: "#22c55e", expr: "starstruck", action: "talk",
          handR: "laptop", handL: "none", headwear: "headphones", backItem: "none",
          scale: 1.05, x: 66, y: 80, flip: true
        }
      ]
    }
  ];

  window.StickForgeStore = {
    projectId: "proj_" + Date.now(),
    projectTitle: "What If You Could See Everyone's IQ?",
    shots: JSON.parse(JSON.stringify(INITIAL_SHOTS)),
    writingStyles: JSON.parse(JSON.stringify(INITIAL_STYLES)),
    activeStyleId: "conchaser_iq",
    currentShotIndex: 0,
    selectedCharIndex: 0,
    visualStyle: "conchaser",
    aspectRatio: "16:9",
    showCaptions: true,
    showBadges: true,
    showCharacterNames: true,
    showJointPins: false,
    isPlaying: false,
    loopShot: false,
    playbackSpeed: 1.0,
    currentTime: 0,
    shotElapsed: 0,
    enableSpeech: true,
    enableSfx: true,
    voiceRate: 1.05,
    voicePitch: 1.0,
    shotAudioUrls: {},
    bgImageCache: {},
    presetBgImages: {},
    isGeneratingBg: false,
    historyStack: [],
    api: {
      useBackendProxy: true, // Auto-detect and route via /api/ PHP gateway
      llmKey: "",
      llmModel: "gemini-2.5-flash",
      availableModels: [], // Dynamically populated when API key is provided
      isLoadingModels: false,
      imgProvider: "google_flow",
      imgModel: "auto",
      imgKey: "",
      defaultGoogleFlowBg: true,
      ttsProvider: "gemini_31_tts",
      ttsKey: "",
      ttsVoiceName: "Puck",
      ttsStylePrompt: "Engaging, dramatic YouTube stick-story narrator"
    },
    cloud: {
      provider: "server_storage", // Server storage as default for web deployment
      serverProjectId: "",
      awsEndpoint: "",
      awsBucket: "stickforge-studio",
      awsKey: "",
      gdriveToken: "",
      gdriveFileId: "",
      gistToken: "",
      gistId: "",
      lastSynced: "Not synced yet"
    },

    getCurrentShot() {
      return this.shots[this.currentShotIndex] || this.shots[0];
    },
    getActiveStyle() {
      return this.writingStyles.find(s => s.id === this.activeStyleId) || this.writingStyles[0];
    },
    getTotalDuration() {
      return this.shots.reduce((acc, s) => acc + (Number(s.duration) || 5), 0);
    },
    getShotStartTime(idx) {
      let sum = 0;
      for (let i = 0; i < idx && i < this.shots.length; i++) sum += Number(this.shots[i].duration) || 5;
      return sum;
    },
    pushUndo() {
      this.historyStack.push(JSON.stringify(this.shots));
      if (this.historyStack.length > 25) this.historyStack.shift();
    },
    undo() {
      if (!this.historyStack.length) return;
      this.shots = JSON.parse(this.historyStack.pop());
      this.currentShotIndex = Math.min(this.currentShotIndex, this.shots.length - 1);
      window.StickForgeBus.emit("shots:updated");
    },
    exportFullStateJSON() {
      return JSON.stringify({
        version: "5.0",
        id: this.projectId,
        projectTitle: this.projectTitle,
        visualStyle: this.visualStyle,
        aspectRatio: this.aspectRatio,
        showCharacterNames: this.showCharacterNames,
        writingStyles: this.writingStyles,
        modelGallery: window.SF_MODEL_GALLERY,
        motionLibrary: window.SF_MOTION_LIBRARY,
        shots: this.shots
      }, null, 2);
    },
    importFullStateJSON(rawJson) {
      try {
        const data = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
        if (data.id) this.projectId = data.id;
        if (data.projectTitle) this.projectTitle = data.projectTitle;
        if (data.shots && Array.isArray(data.shots)) this.shots = data.shots;
        if (data.writingStyles) this.writingStyles = data.writingStyles;
        if (data.modelGallery) window.SF_MODEL_GALLERY = data.modelGallery;
        if (data.motionLibrary) Object.assign(window.SF_MOTION_LIBRARY, data.motionLibrary);
        this.currentShotIndex = 0;
        this.selectedCharIndex = 0;
        window.StickForgeBus.emit("shots:updated");
        window.StickForgeBus.emit("gallery:updated");
        window.StickForgeBus.emit("motions:updated");
        return true;
      } catch (err) {
        console.error("Failed to parse project state JSON:", err);
        return false;
      }
    },
    loadClientApiSettings() {
      try {
        const saved = localStorage.getItem("stickforge_api_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.llmKey) this.api.llmKey = parsed.llmKey;
          if (parsed.llmModel) this.api.llmModel = parsed.llmModel;
          if (parsed.imgKey) this.api.imgKey = parsed.imgKey;
          if (parsed.imgModel) this.api.imgModel = parsed.imgModel;
          if (parsed.imgProvider) this.api.imgProvider = parsed.imgProvider;
          if (parsed.ttsKey) this.api.ttsKey = parsed.ttsKey;
          if (parsed.ttsProvider) this.api.ttsProvider = parsed.ttsProvider;
          if (parsed.apiBase) this.api.apiBase = parsed.apiBase;
        }
      } catch (e) {}
    },
    saveClientApiSettings() {
      try {
        localStorage.setItem("stickforge_api_settings", JSON.stringify({
          llmKey: this.api.llmKey,
          llmModel: this.api.llmModel,
          imgKey: this.api.imgKey,
          imgModel: this.api.imgModel || "auto",
          imgProvider: this.api.imgProvider,
          ttsKey: this.api.ttsKey,
          ttsProvider: this.api.ttsProvider,
          apiBase: this.api.apiBase || ""
        }));
      } catch (e) {}
    }
  };

  // Auto-restore client API settings from local storage
  window.StickForgeStore.loadClientApiSettings();
})();
