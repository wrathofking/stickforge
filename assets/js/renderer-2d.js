window.StickForgeRenderer = {
      audioCtx: null,
      audioDest: null,

      ensureAudio() {
        if (!this.audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) {
            this.audioCtx = new AC();
            this.audioDest = this.audioCtx.createMediaStreamDestination();
          }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") this.audioCtx.resume();
        return this.audioCtx;
      },

      playSfx(type) {
        if (!window.StickForgeStore.enableSfx || !type || type === "none") return;
        const ctx = this.ensureAudio();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (this.audioDest) gain.connect(this.audioDest);

        if (type === "pop") {
          osc.frequency.setValueAtTime(340, now);
          osc.frequency.exponentialRampToValueAtTime(790, now + 0.09);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.start(now); osc.stop(now + 0.12);
        } else if (type === "ding") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(587.3, now);
          osc.frequency.setValueAtTime(880, now + 0.09);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
          osc.start(now); osc.stop(now + 0.43);
        } else if (type === "buzzer") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(145, now);
          osc.frequency.linearRampToValueAtTime(108, now + 0.3);
          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
          osc.start(now); osc.stop(now + 0.35);
        } else if (type === "whoosh") {
          osc.frequency.setValueAtTime(460, now);
          osc.frequency.exponentialRampToValueAtTime(92, now + 0.22);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.start(now); osc.stop(now + 0.25);
        }
      },

      paintPresetBackgroundToDataUrl(setting) {
        const c = document.createElement("canvas");
        c.width = 960; c.height = 540;
        const ctx = c.getContext("2d");
        const W = 960, H = 540, floorY = H * 0.80;

        const drawRoomShell = (wallTop, wallBot, wainscot, floorTop, floorBot, plankCol) => {
          const wg = ctx.createLinearGradient(0, 0, 0, floorY);
          wg.addColorStop(0, wallTop); wg.addColorStop(1, wallBot);
          ctx.fillStyle = wg; ctx.fillRect(0, 0, W, floorY);
          if (wainscot) {
            ctx.fillStyle = wainscot; ctx.fillRect(0, floorY - 68, W, 68);
            ctx.strokeStyle = "rgba(15,23,42,0.35)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, floorY - 68); ctx.lineTo(W, floorY - 68); ctx.stroke();
          }
          const fg = ctx.createLinearGradient(0, floorY, 0, H);
          fg.addColorStop(0, floorTop); fg.addColorStop(1, floorBot);
          ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H - floorY);
          ctx.strokeStyle = plankCol || "rgba(15,23,42,0.22)"; ctx.lineWidth = 2;
          for (let i = -2; i <= 10; i++) {
            const xTop = (W / 8) * i;
            const xBot = (W / 2) + (xTop - W / 2) * 1.65;
            ctx.beginPath(); ctx.moveTo(xTop, floorY); ctx.lineTo(xBot, H); ctx.stroke();
          }
          ctx.fillStyle = "#1e293b"; ctx.fillRect(0, floorY - 6, W, 8);
        };

        const rRect = (x, y, w, h, r, fill, stroke = "#0f172a", lw = 3.5) => {
          ctx.save();
          ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = lw;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y, w, h, r || 0);
          else ctx.rect(x, y, w, h);
          if (fill !== "none") ctx.fill();
          if (stroke !== "none") ctx.stroke();
          ctx.restore();
        };

        if (setting === "classroom") {
          drawRoomShell("#fef3c7", "#fde68a", "#f59e0b", "#b45309", "#78350f", "rgba(69,26,3,0.35)");
          rRect(48, 56, 130, 210, 8, "#38bdf8", "#1e293b", 5);
          rRect(56, 64, 114, 194, 4, "#bae6fd", "#1e293b", 2);
          ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(113, 64); ctx.lineTo(113, 258); ctx.moveTo(56, 160); ctx.lineTo(170, 160); ctx.stroke();
          rRect(210, 52, 540, 225, 10, "#78350f", "#0f172a", 4.5);
          rRect(224, 66, 512, 197, 6, "#064e3b", "#022c22", 3);
          ctx.fillStyle = "rgba(255,255,255,0.88)";
          ctx.font = '800 22px "JetBrains Mono", monospace';
          ctx.fillText("IQ DISTRIBUTION & APTITUDE TEST", 252, 114);
          ctx.font = '600 18px "JetBrains Mono", monospace';
          ctx.fillStyle = "#fde047";
          ctx.fillText("f(x) = ∫ e^(-x²) dx    ∑ IQ = 160", 252, 162);
          ctx.fillStyle = "#86efac";
          ctx.fillText("POP QUIZ: RESULTS POSTED TODAY!", 252, 210);
          ctx.save();
          ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(845, 110, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(845, 110); ctx.lineTo(845, 82); ctx.moveTo(845, 110); ctx.lineTo(868, 110); ctx.stroke();
          ctx.restore();
          rRect(790, 220, 120, 206, 6, "#92400e", "#0f172a", 4);
        } else if (setting === "bedroom") {
          drawRoomShell("#e0e7ff", "#c7d2fe", "#818cf8", "#7c2d12", "#451a03");
          rRect(62, 68, 175, 195, 8, "#38bdf8", "#1e293b", 5);
          rRect(52, 60, 34, 210, 6, "#ec4899", "#0f172a", 3.5);
          rRect(212, 60, 34, 210, 6, "#ec4899", "#0f172a", 3.5);
          rRect(305, 72, 120, 150, 8, "#1e1b4b", "#0f172a", 4);
          rRect(615, 76, 155, 290, 75, "#f59e0b", "#0f172a", 4.5);
          rRect(627, 88, 131, 266, 65, "#bae6fd", "#0284c7", 3);
          rRect(80, 310, 265, 118, 10, "#92400e", "#0f172a", 4);
          rRect(92, 286, 75, 34, 12, "#ffffff", "#0f172a", 3);
          rRect(90, 322, 245, 75, 8, "#3b82f6", "#0f172a", 3.5);
        } else if (setting === "hallway") {
          drawRoomShell("#dbeafe", "#bfdbfe", "#93c5fd", "#64748b", "#334155");
          rRect(350, 18, 260, 44, 8, "#1e293b", "#0f172a", 3.5);
          ctx.fillStyle = "#facc15"; ctx.font = '800 18px "Inter", sans-serif';
          ctx.textAlign = "center"; ctx.fillText("WESTVIEW HIGH SCHOOL", 480, 46); ctx.textAlign = "left";
          for (let i = 0; i < 7; i++) {
            const lx = 55 + i * 122;
            rRect(lx, 88, 114, floorY - 88, 4, i % 2 === 0 ? "#3b82f6" : "#2563eb", "#0f172a", 4);
          }
        } else if (setting === "library") {
          drawRoomShell("#fef3c7", "#fde68a", "#d97706", "#78350f", "#451a03");
          const palette = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];
          for (let s = 0; s < 3; s++) {
            const sx = 68 + s * 290;
            rRect(sx, 54, 240, floorY - 54, 6, "#78350f", "#0f172a", 4.5);
            for (let r = 0; r < 4; r++) {
              const ry = 128 + r * 74;
              rRect(sx + 8, ry, 224, 12, 2, "#451a03", "#0f172a", 3);
              for (let b = 0; b < 8; b++) {
                rRect(sx + 14 + b * 26, ry - 48, 22, 48, 3, palette[(s + r + b) % palette.length], "#0f172a", 2.5);
              }
            }
          }
        } else if (setting === "auditorium") {
          const bg = ctx.createLinearGradient(0, 0, 0, floorY);
          bg.addColorStop(0, "#090d16"); bg.addColorStop(1, "#1e1b4b");
          ctx.fillStyle = bg; ctx.fillRect(0, 0, W, floorY);
          rRect(0, floorY, W, H - floorY, 0, "#78350f", "#0f172a", 4);
          rRect(0, 0, 110, floorY, 0, "#991b1b", "#0f172a", 4);
          rRect(W - 110, 0, 110, floorY, 0, "#991b1b", "#0f172a", 4);
          rRect(185, 42, 590, 235, 14, "#0284c7", "#38bdf8", 5);
          rRect(200, 56, 560, 207, 10, "#0f172a", "#0284c7", 3);
          ctx.fillStyle = "#ffffff"; ctx.font = '800 28px "Inter", sans-serif'; ctx.textAlign = "center";
          ctx.fillText("NATIONAL STUDENT CHALLENGE", 480, 118);
          ctx.fillStyle = "#facc15"; ctx.font = '700 21px "JetBrains Mono", monospace';
          ctx.fillText("FINAL ROUND: [ 2, 6, 14, 30, 62, ? ]", 480, 175);
          ctx.textAlign = "left";
        } else if (setting === "street") {
          const sky = ctx.createLinearGradient(0, 0, 0, floorY);
          sky.addColorStop(0, "#38bdf8"); sky.addColorStop(1, "#bae6fd");
          ctx.fillStyle = sky; ctx.fillRect(0, 0, W, floorY);
          rRect(40, 60, 190, floorY - 60, 4, "#64748b", "#0f172a", 4);
          rRect(250, 110, 220, floorY - 110, 4, "#b45309", "#0f172a", 4);
          rRect(490, 45, 210, floorY - 45, 4, "#475569", "#0f172a", 4);
          rRect(720, 95, 195, floorY - 95, 4, "#0284c7", "#0f172a", 4);
          rRect(265, 245, 190, 48, 8, "#ef4444", "#0f172a", 3.5);
          ctx.fillStyle = "#ffffff"; ctx.font = '800 20px "Inter", sans-serif';
          ctx.fillText("CITY COFFEE & BOOKS", 278, 276);
          rRect(0, floorY, W, H - floorY, 0, "#94a3b8", "#0f172a", 4);
        } else if (setting === "park") {
          const sky = ctx.createLinearGradient(0, 0, 0, floorY);
          sky.addColorStop(0, "#f97316"); sky.addColorStop(0.55, "#fbbf24"); sky.addColorStop(1, "#fef08a");
          ctx.fillStyle = sky; ctx.fillRect(0, 0, W, floorY);
          ctx.fillStyle = "#fde047";
          ctx.beginPath(); ctx.arc(480, 240, 75, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#16a34a";
          ctx.beginPath(); ctx.moveTo(0, floorY); ctx.quadraticCurveTo(250, floorY - 95, 520, floorY); ctx.quadraticCurveTo(760, floorY - 80, W, floorY); ctx.closePath(); ctx.fill();
          rRect(0, floorY, W, H - floorY, 0, "#4ade80", "#0f172a", 4);
          rRect(110, 210, 34, floorY - 210, 4, "#78350f", "#0f172a", 4);
          ctx.fillStyle = "#15803d"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(127, 175, 78, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          rRect(330, floorY - 62, 300, 22, 6, "#b45309", "#0f172a", 3.5);
          rRect(320, floorY - 36, 320, 16, 6, "#92400e", "#0f172a", 3.5);
        } else if (setting === "cafeteria") {
          drawRoomShell("#fef9c3", "#fde047", "#f59e0b", "#d6d3d1", "#a8a29e");
          rRect(140, 42, 680, 82, 12, "#1e293b", "#0f172a", 4.5);
          ctx.fillStyle = "#facc15"; ctx.font = '800 24px "Inter", sans-serif'; ctx.textAlign = "center";
          ctx.fillText("SCHOOL CAFETERIA · HOT LUNCH & PIZZA", 480, 92); ctx.textAlign = "left";
          rRect(90, 250, 780, 180, 8, "#94a3b8", "#0f172a", 4);
          rRect(80, 236, 800, 22, 6, "#f8fafc", "#0f172a", 3.5);
        } else if (setting === "lab") {
          drawRoomShell("#0f172a", "#1e293b", "#334155", "#1e293b", "#090d16");
          for (let i = 0; i < 2; i++) {
            const tx = i === 0 ? 110 : 690;
            rRect(tx, 68, 150, 310, 16, "rgba(6, 182, 212, 0.35)", "#22d3ee", 4.5);
            rRect(tx - 10, 52, 170, 24, 6, "#475569", "#0f172a", 3.5);
            rRect(tx - 10, 370, 170, 30, 6, "#475569", "#0f172a", 3.5);
          }
          rRect(330, 88, 300, 185, 12, "#111827", "#6366f1", 4);
          ctx.fillStyle = "#38bdf8"; ctx.font = '800 22px "JetBrains Mono", monospace'; ctx.textAlign = "center";
          ctx.fillText("QUANTUM AI RESEARCH LAB", 480, 150); ctx.textAlign = "left";
        }
        return c.toDataURL("image/jpeg", 0.92);
      },

      initPresetPlates() {
        const store = window.StickForgeStore;
        ["classroom", "bedroom", "hallway", "library", "auditorium", "street", "park", "cafeteria", "lab"].forEach(k => {
          const img = new Image();
          img.src = this.paintPresetBackgroundToDataUrl(k);
          store.presetBgImages[k] = img;
        });
      },

      attachDataUrlToShot(shot, sourceUrl) {
        return new Promise((resolve) => {
          if (!shot || !sourceUrl) return resolve(false);
          const store = window.StickForgeStore;
          const img = new Image();
          img.crossOrigin = "anonymous";

          const timeout = setTimeout(() => {
            console.warn("[StickForgeRenderer] Image load timed out:", sourceUrl);
            resolve(false);
          }, 15000);

          img.onload = () => {
            clearTimeout(timeout);
            store.bgImageCache[shot.id] = img;
            shot.setting = "custom_image";

            // If it's an external web URL, convert to Base64 dataURL for offline persistence
            if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
              try {
                const c = document.createElement("canvas");
                c.width = img.naturalWidth || 1280;
                c.height = img.naturalHeight || 720;
                const ctx = c.getContext("2d");
                ctx.drawImage(img, 0, 0);
                shot.bgImage = c.toDataURL("image/jpeg", 0.90);
              } catch (e) {
                shot.bgImage = sourceUrl;
              }
            } else {
              shot.bgImage = sourceUrl;
            }

            window.StickForgeBus.emit("shots:updated");
            window.StickForgeBus.emit("timeline:seek", { time: store.currentTime });
            resolve(true);
          };

          img.onerror = (err) => {
            clearTimeout(timeout);
            console.warn("[StickForgeRenderer] Failed to load background image:", err);
            resolve(false);
          };

          img.src = sourceUrl;
        });
      },

      async buildRichProceduralPlateForShot(shot, promptText) {
        const store = window.StickForgeStore;
        const c = document.createElement("canvas");
        c.width = 960; c.height = 540;
        const ctx = c.getContext("2d");
        const p = (promptText || "").toLowerCase();
        let baseKey = "classroom";
        if (p.includes("bed") || p.includes("mirror") || p.includes("home")) baseKey = "bedroom";
        else if (p.includes("hall") || p.includes("locker")) baseKey = "hallway";
        else if (p.includes("library") || p.includes("book") || p.includes("study")) baseKey = "library";
        else if (p.includes("stage") || p.includes("auditorium")) baseKey = "auditorium";
        else if (p.includes("park") || p.includes("bench") || p.includes("sunset")) baseKey = "park";
        else if (p.includes("cafeteria") || p.includes("lunch")) baseKey = "cafeteria";
        else if (p.includes("lab") || p.includes("science") || p.includes("hospital")) baseKey = "lab";
        else if (p.includes("street") || p.includes("city") || p.includes("rooftop")) baseKey = "street";

        const baseImg = store.presetBgImages[baseKey] || store.presetBgImages["classroom"];
        if (baseImg && baseImg.complete) {
          ctx.save();
          if (p.includes("night") || p.includes("dark") || p.includes("cyber")) {
            ctx.filter = "brightness(0.6) contrast(1.25) hue-rotate(190deg)";
          }
          ctx.drawImage(baseImg, 0, 0, 960, 540);
          ctx.restore();
        } else {
          // Clean 2D cartoon backdrop with flat floor plane for stick actors
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, 960, 410);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 410, 960, 130);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 410);
          ctx.lineTo(960, 410);
          ctx.stroke();
        }
        await this.attachDataUrlToShot(shot, c.toDataURL("image/jpeg", 0.92));
      },

      drawRichEnvironment(ctx, W, H, setting, styleMode, tSec, shot) {
        const store = window.StickForgeStore;
        // 1. Check for custom AI-generated background (Google Flow / Imagen)
        if (shot && (setting === "custom_image" || shot.bgImage)) {
          let bgImg = store.bgImageCache[shot.id];
          if (!bgImg && shot.bgImage) {
            bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            bgImg.src = shot.bgImage;
            store.bgImageCache[shot.id] = bgImg;
          }

          if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
            ctx.save();
            if (styleMode === "neon") ctx.filter = "brightness(0.55) contrast(1.35) hue-rotate(175deg)";
            else if (styleMode === "sketch") ctx.filter = "sepia(0.45) brightness(1.05)";
            ctx.drawImage(bgImg, 0, 0, W, H);
            ctx.restore();
            return;
          }
        }
        const plate = store.presetBgImages[setting] || store.presetBgImages["classroom"];
        if (plate && plate.complete) {
          ctx.save();
          if (styleMode === "neon") ctx.filter = "brightness(0.55) contrast(1.35) hue-rotate(175deg)";
          else if (styleMode === "sketch") ctx.filter = "sepia(0.45) brightness(1.05)";
          ctx.drawImage(plate, 0, 0, W, H);
          ctx.filter = "none";

          // Animated atmospheric light motes / spotlight sweep
          const floorY = H * 0.80;
          if (setting === "classroom" || setting === "library" || setting === "bedroom") {
            ctx.fillStyle = "rgba(254, 240, 138, 0.6)";
            for (let i = 0; i < 16; i++) {
              const mx = ((i * 73 + tSec * 15) % (W * 0.85)) + W * 0.05;
              const my = ((i * 47 + Math.sin(tSec * 1.6 + i) * 18) % (floorY * 0.82)) + 20;
              ctx.beginPath(); ctx.arc(mx, my, (i % 2) + 1.5, 0, Math.PI * 2); ctx.fill();
            }
          } else if (setting === "auditorium") {
            const sweep = Math.sin(tSec * 1.8) * (W * 0.07);
            const sg = ctx.createLinearGradient(W * 0.5 + sweep, 0, W * 0.5 - sweep, floorY);
            sg.addColorStop(0, "rgba(56, 189, 248, 0.24)");
            sg.addColorStop(1, "rgba(56, 189, 248, 0.0)");
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.moveTo(W * 0.35 + sweep, 0);
            ctx.lineTo(W * 0.65 + sweep, 0);
            ctx.lineTo(W * 0.82 - sweep, floorY);
            ctx.lineTo(W * 0.18 - sweep, floorY);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      },

      // Helper to render any 2D Object/Prop/Clothing Attachment from window.SF_MODEL_GALLERY.objectModels
      drawSocketObject(ctx, objId, scale) {
        if (!objId || objId === "none") return;
        const objDef = window.SF_MODEL_GALLERY.objectModels.find(o => o.id === objId);
        if (!objDef || !Array.isArray(objDef.shapes)) return;
        ctx.save();
        objDef.shapes.forEach(sh => {
          ctx.fillStyle = sh.fill || "#ffffff";
          ctx.strokeStyle = sh.stroke || "#0f172a";
          ctx.lineWidth = (sh.lw || 2.5) * scale;
          if (sh.type === "rect" || sh.type === "roundRect") {
            ctx.beginPath();
            if (sh.type === "roundRect" && ctx.roundRect) {
              ctx.roundRect(sh.x * scale, sh.y * scale, sh.w * scale, sh.h * scale, (sh.r || 4) * scale);
            } else {
              ctx.rect(sh.x * scale, sh.y * scale, sh.w * scale, sh.h * scale);
            }
            if (sh.fill !== "none") ctx.fill();
            if (sh.stroke !== "none") ctx.stroke();
          } else if (sh.type === "circle") {
            ctx.beginPath();
            ctx.arc(sh.x * scale, sh.y * scale, sh.r * scale, 0, Math.PI * 2);
            if (sh.fill !== "none") ctx.fill();
            if (sh.stroke !== "none") ctx.stroke();
          } else if (sh.type === "line") {
            ctx.beginPath();
            ctx.moveTo(sh.x1 * scale, sh.y1 * scale);
            ctx.lineTo(sh.x2 * scale, sh.y2 * scale);
            ctx.stroke();
          } else if (sh.type === "polygon" && Array.isArray(sh.points)) {
            ctx.beginPath();
            sh.points.forEach((pt, idx) => {
              if (idx === 0) ctx.moveTo(pt[0] * scale, pt[1] * scale);
              else ctx.lineTo(pt[0] * scale, pt[1] * scale);
            });
            ctx.closePath();
            if (sh.fill !== "none") ctx.fill();
            if (sh.stroke !== "none") ctx.stroke();
          } else if (sh.type === "text") {
            ctx.fillStyle = sh.color || "#0f172a";
            ctx.font = `800 ${Math.round((sh.size || 13) * scale)}px "Inter", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sh.text, sh.x * scale, sh.y * scale);
          }
        });
        ctx.restore();
      },

      // Interpolate pose between keyframes from SF_MOTION_LIBRARY
      sampleActionPose(actionId, tSec, charIndex = 0) {
        const motion = window.SF_MOTION_LIBRARY[actionId] || window.SF_MOTION_LIBRARY.idle;
        const frames = motion.frames || window.SF_MOTION_LIBRARY.idle.frames;
        if (frames.length === 1) return frames[0];
        const speed = motion.loopSpeed || 4.0;
        const rawPhase = (tSec * speed + charIndex * 0.7) % frames.length;
        const idxA = Math.floor(rawPhase);
        const idxB = (idxA + 1) % frames.length;
        const frac = 0.5 - 0.5 * Math.cos((rawPhase - idxA) * Math.PI); // Smooth cosine easing
        const fA = frames[idxA], fB = frames[idxB];
        const pose = {};
        for (const k of Object.keys(fA)) {
          pose[k] = fA[k] + (fB[k] - fA[k]) * frac;
        }
        return pose;
      },

      // Main Articulated Character & Animal Renderer
      drawStickCharacter(ctx, W, H, char, index, isSelected, styleMode, tSec, isTalkingNow, overridePose = null) {
        const store = window.StickForgeStore;
        const modelDef = window.SF_MODEL_GALLERY.characterModels.find(m => m.id === char.modelId) || window.SF_MODEL_GALLERY.characterModels[0];
        const cx = (Number(char.x) / 100) * W;
        const cy = (Number(char.y) / 100) * H;
        const scale = (Number(char.scale) || 1.0) * (H / 540);
        const dir = char.flip ? -1 : 1;

        const strokeMain = styleMode === "neon" ? "#f8fafc" : "#0f172a";
        const lineW = (styleMode === "mspaint" ? 4.5 : 5.5) * scale;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // -----------------------------------------------------------------
        // QUADRUPED ANIMAL STICK MODEL (Dog, Cat, etc.)
        // -----------------------------------------------------------------
        if (modelDef.category === "animal") {
          const bodyLen = (modelDef.bodyLength || 60) * scale;
          const legLen = (modelDef.legLength || 32) * scale;
          const headR = 19 * (modelDef.headScale || 0.85) * scale;
          const isMoving = char.action === "walk" || char.action === "run" || char.action === "celebrate";
          const stride = isMoving ? Math.sin(tSec * 10 + index) * 14 * scale : 0;
          const bounce = isMoving ? Math.abs(Math.cos(tSec * 10 + index)) * 5 * scale : Math.sin(tSec * 3) * 1.5 * scale;

          const hipX = cx - (bodyLen * 0.45) * dir;
          const shoulderX = cx + (bodyLen * 0.45) * dir;
          const spineY = cy - legLen - bounce;

          // Shadow
          ctx.fillStyle = "rgba(15,23,42,0.22)";
          ctx.beginPath(); ctx.ellipse(cx, cy + 4 * scale, bodyLen * 0.65, 7 * scale, 0, 0, Math.PI * 2); ctx.fill();

          // Wagging Tail
          const wag = Math.sin(tSec * 12 + index) * 10 * scale;
          ctx.strokeStyle = strokeMain; ctx.lineWidth = lineW * 0.85;
          ctx.beginPath();
          ctx.moveTo(hipX, spineY);
          ctx.quadraticCurveTo(hipX - 18 * scale * dir, spineY - 18 * scale + wag, hipX - 26 * scale * dir, spineY - 26 * scale + wag);
          ctx.stroke();

          // 4 Articulated Legs with Knees & Paws
          const drawAnimalLeg = (topX, topY, swing, kneeBend) => {
            const kneeX = topX + swing * 0.5 + kneeBend * dir;
            const kneeY = topY + legLen * 0.52;
            const pawX = topX + swing;
            const pawY = cy;
            ctx.beginPath();
            ctx.moveTo(topX, topY); ctx.lineTo(kneeX, kneeY); ctx.lineTo(pawX, pawY);
            ctx.stroke();
            // Paw pad
            ctx.fillStyle = char.outfit || modelDef.defaultColor || "#f59e0b";
            ctx.beginPath(); ctx.ellipse(pawX + 3 * scale * dir, pawY, 5.5 * scale, 3.2 * scale, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          };
          drawAnimalLeg(hipX - 4 * scale, spineY, -stride, -4 * scale);
          drawAnimalLeg(hipX + 4 * scale, spineY, stride, -4 * scale);
          drawAnimalLeg(shoulderX - 4 * scale, spineY, stride, 4 * scale);
          drawAnimalLeg(shoulderX + 4 * scale, spineY, -stride, 4 * scale);

          // Pill Body
          ctx.fillStyle = char.outfit || modelDef.defaultColor || "#f59e0b";
          ctx.strokeStyle = strokeMain; ctx.lineWidth = lineW * 0.85;
          ctx.beginPath();
          ctx.roundRect(Math.min(hipX, shoulderX) - 10 * scale, spineY - 12 * scale, bodyLen + 20 * scale, 24 * scale, 12 * scale);
          ctx.fill(); ctx.stroke();

          // Animal Head
          const headX = shoulderX + 14 * scale * dir;
          const headY = spineY - 16 * scale;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(headX, headY, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

          // Ears
          ctx.fillStyle = char.outfit || modelDef.defaultColor || "#f59e0b";
          if (modelDef.ears === "pointed") {
            ctx.beginPath();
            ctx.moveTo(headX - 12 * scale, headY - 12 * scale);
            ctx.lineTo(headX - 6 * scale, headY - 28 * scale);
            ctx.lineTo(headX + 2 * scale, headY - 15 * scale);
            ctx.closePath(); ctx.fill(); ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.ellipse(headX - 10 * scale * dir, headY + 2 * scale, 6 * scale, 13 * scale, 0.3 * dir, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
          }

          // Eyes & Snout
          ctx.fillStyle = strokeMain;
          ctx.beginPath(); ctx.arc(headX + 6 * scale * dir, headY - 3 * scale, 2.8 * scale, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(headX + 16 * scale * dir, headY + 2 * scale, 3.8 * scale, 0, Math.PI * 2); ctx.fill();

          // Headwear attachment on Animal
          if (char.headwear && char.headwear !== "none") {
            ctx.save();
            ctx.translate(headX, headY - headR);
            this.drawSocketObject(ctx, char.headwear, scale * 0.8);
            ctx.restore();
          }

          // Floating Badge & Name
          this.drawBadgeAndName(ctx, headX, headY - headR, cx, cy, char, index, scale, styleMode, tSec, isSelected);
          ctx.restore();
          return;
        }

        // -----------------------------------------------------------------
        // ARTICULATED 16-JOINT HUMANOID / MECH STICKMAN RIG
        // -----------------------------------------------------------------
        const pose = overridePose || this.sampleActionPose(char.action || "idle", tSec, index);
        const headR = 25 * (modelDef.headScale || 1.0) * scale;
        const torsoLen = (modelDef.torsoLength || 66) * scale;
        const limbLen = (modelDef.limbLength || 52) * scale;
        const uArmLen = limbLen * 0.50, lArmLen = limbLen * 0.50;
        const uLegLen = limbLen * 0.54, lLegLen = limbLen * 0.54;

        const deg2rad = (d) => (d * Math.PI) / 180;
        const tiltRad = deg2rad((pose.torsoTilt || 0) * dir);

        const hipX = cx;
        const hipY = cy - (uLegLen + lLegLen) * 0.94 + (pose.bounceY || 0) * scale;
        const neckX = hipX + Math.sin(tiltRad) * torsoLen;
        const neckY = hipY - Math.cos(tiltRad) * torsoLen;
        const shoulderX = hipX + Math.sin(tiltRad) * (torsoLen * 0.84);
        const shoulderY = hipY - Math.cos(tiltRad) * (torsoLen * 0.84);
        const headX = neckX + Math.sin(deg2rad((pose.headNod || 0) * dir)) * (headR * 0.25);
        const headY = neckY - headR * 0.96;

        // Calculate Left & Right Leg Joints (Hip -> Knee -> Ankle -> Foot)
        const calcLimb = (origX, origY, upperDeg, lowerDeg, len1, len2) => {
          const a1 = deg2rad(upperDeg * dir);
          const midX = origX + Math.sin(a1) * len1;
          const midY = origY + Math.cos(a1) * len1;
          const a2 = a1 + deg2rad(lowerDeg * dir);
          const endX = midX + Math.sin(a2) * len2;
          const endY = midY + Math.cos(a2) * len2;
          return { midX, midY, endX, endY, endAngle: a2 };
        };

        const lLeg = calcLimb(hipX - 7 * scale, hipY, pose.lHip, pose.lKnee, uLegLen, lLegLen);
        const rLeg = calcLimb(hipX + 7 * scale, hipY, pose.rHip, pose.rKnee, uLegLen, lLegLen);
        const lArm = calcLimb(shoulderX - 13 * scale, shoulderY, pose.lShoulder, pose.lElbow, uArmLen, lArmLen);
        const rArm = calcLimb(shoulderX + 13 * scale, shoulderY, pose.rShoulder, pose.rElbow, uArmLen, lArmLen);

        // Ground shadow
        ctx.fillStyle = "rgba(15, 23, 42, 0.24)";
        ctx.beginPath(); ctx.ellipse(cx, cy + 5 * scale, 35 * scale, 8 * scale, 0, 0, Math.PI * 2); ctx.fill();

        // 1. BACK SOCKET ATTACHMENT (Backpack / Cape / Wings)
        if (char.backItem && char.backItem !== "none") {
          ctx.save();
          ctx.translate(shoulderX - 12 * scale * dir, shoulderY + 14 * scale);
          this.drawSocketObject(ctx, char.backItem, scale);
          ctx.restore();
        }

        // 2. UPPER & LOWER LEGS + KNEES + FEET/SHOES
        ctx.strokeStyle = strokeMain;
        ctx.lineWidth = lineW;
        [lLeg, rLeg].forEach((leg, lIdx) => {
          const startX = lIdx === 0 ? hipX - 7 * scale : hipX + 7 * scale;
          ctx.beginPath();
          ctx.moveTo(startX, hipY);
          ctx.lineTo(leg.midX, leg.midY);
          ctx.lineTo(leg.endX, leg.endY);
          ctx.stroke();

          // Articulated Sneaker / Foot
          if (modelDef.hasFeet !== false) {
            ctx.save();
            ctx.fillStyle = char.outfit && char.outfit !== "stick" ? char.outfit : "#f8fafc";
            ctx.strokeStyle = strokeMain;
            ctx.lineWidth = lineW * 0.65;
            ctx.beginPath();
            ctx.ellipse(leg.endX + 6 * scale * dir, leg.endY, 10.5 * scale, 4.8 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        });

        // 3. TORSO & CLOTHING STYLE (Hoodie, Blazer + Tie, Sweater, Suit, or Pure Stick)
        const cStyle = char.clothingStyle || "hoodie";
        if (char.outfit && char.outfit !== "stick" && cStyle !== "none" && styleMode !== "neon") {
          ctx.save();
          ctx.translate((neckX + hipX) / 2, (neckY + hipY) / 2);
          ctx.rotate(tiltRad);
          const tw = (modelDef.torsoWidth || 40) * scale;
          const th = torsoLen - 4 * scale;
          ctx.fillStyle = char.outfit;
          ctx.strokeStyle = strokeMain;
          ctx.lineWidth = lineW * 0.85;
          ctx.beginPath();
          ctx.roundRect(-tw / 2, -th / 2, tw, th, 12 * scale);
          ctx.fill(); ctx.stroke();

          if (cStyle === "blazer" || cStyle === "suit") {
            // White shirt V-neck & red tie
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(-8 * scale, -th / 2);
            ctx.lineTo(8 * scale, -th / 2);
            ctx.lineTo(0, -th / 2 + 22 * scale);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(-2.5 * scale, -th / 2 + 8 * scale, 5 * scale, 22 * scale);
          } else if (cStyle === "hoodie") {
            // Hoodie drawstrings & kangaroo pocket
            ctx.beginPath();
            ctx.moveTo(-6 * scale, -th / 2 + 4 * scale); ctx.lineTo(-6 * scale, -th / 2 + 19 * scale);
            ctx.moveTo(6 * scale, -th / 2 + 4 * scale); ctx.lineTo(6 * scale, -th / 2 + 19 * scale);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.strokeStyle = styleMode === "neon" ? (char.outfit !== "stick" ? char.outfit : "#38bdf8") : strokeMain;
          ctx.lineWidth = lineW;
          ctx.beginPath(); ctx.moveTo(neckX, neckY); ctx.lineTo(hipX, hipY); ctx.stroke();
        }

        // 4. LEFT ARM (Upper -> Elbow -> Forearm -> Hand + Left Hand Socket)
        const drawArticulatedArm = (arm, startX, handSocketId) => {
          ctx.strokeStyle = strokeMain;
          ctx.lineWidth = lineW;
          ctx.beginPath();
          ctx.moveTo(startX, shoulderY);
          ctx.lineTo(arm.midX, arm.midY);
          ctx.lineTo(arm.endX, arm.endY);
          ctx.stroke();

          // Articulated Hand Mitten / Palm
          if (modelDef.hasHands !== false) {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = strokeMain;
            ctx.lineWidth = lineW * 0.65;
            ctx.beginPath();
            ctx.arc(arm.endX, arm.endY, 5.2 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Hand Socket Prop Attachment
          if (handSocketId && handSocketId !== "none") {
            ctx.save();
            ctx.translate(arm.endX, arm.endY);
            this.drawSocketObject(ctx, handSocketId, scale);
            ctx.restore();
          }
        };

        drawArticulatedArm(lArm, shoulderX - 13 * scale, char.handL);

        // 5. HEAD & 14 EXPRESSIONS
        ctx.fillStyle = styleMode === "neon" ? "#0f172a" : "#ffffff";
        ctx.strokeStyle = strokeMain;
        ctx.lineWidth = lineW * 0.9;
        ctx.beginPath();
        if (modelDef.headShape === "box") {
          ctx.roundRect(headX - headR, headY - headR, headR * 2, headR * 1.85, 8 * scale);
        } else {
          ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        }
        ctx.fill(); ctx.stroke();

        if (modelDef.antenna) {
          ctx.beginPath();
          ctx.moveTo(headX, headY - headR); ctx.lineTo(headX, headY - headR - 12 * scale);
          ctx.stroke();
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath(); ctx.arc(headX, headY - headR - 14 * scale, 4 * scale, 0, Math.PI * 2); ctx.fill();
        }

        this.drawFacialExpression(ctx, headX, headY, headR, char, scale, dir, strokeMain, tSec, isTalkingNow, index);

        // 6. HEADWEAR SOCKET ATTACHMENT (Crown, Cap, Headphones)
        if (char.headwear && char.headwear !== "none") {
          ctx.save();
          ctx.translate(headX, headY - headR * 0.92);
          this.drawSocketObject(ctx, char.headwear, scale);
          ctx.restore();
        }

        // 7. RIGHT ARM (Foreground Arm + Right Hand Socket)
        drawArticulatedArm(rArm, shoulderX + 13 * scale, char.handR || char.prop);

        // 8. OPTIONAL JOINT PINS VISUALIZER (For Rigging / Motion Studio Preview)
        if (store.showJointPins) {
          ctx.fillStyle = "#38bdf8";
          [[neckX, neckY], [hipX, hipY], [lArm.midX, lArm.midY], [rArm.midX, rArm.midY], [lLeg.midX, lLeg.midY], [rLeg.midX, rLeg.midY]].forEach(pt => {
            ctx.beginPath(); ctx.arc(pt[0], pt[1], 3.5 * scale, 0, Math.PI * 2); ctx.fill();
          });
        }

        // 9. OVERHEAD FLOATING METRIC BADGE & OPTIONAL CHARACTER NAME TAG
        this.drawBadgeAndName(ctx, headX, headY - headR, cx, cy, char, index, scale, styleMode, tSec, isSelected);
        ctx.restore();
      },

      drawFacialExpression(ctx, headX, headY, headRadius, char, scale, dir, strokeMain, tSec, isTalkingNow, index) {
        const eyeOffX = 7 * scale * dir;
        const eyeY = headY - 4 * scale;
        ctx.fillStyle = strokeMain;
        ctx.strokeStyle = strokeMain;
        ctx.lineWidth = 2.4 * scale;

        if (char.expr === "cool") {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(headX + eyeOffX - 14 * scale, eyeY - 5 * scale, 12 * scale, 8 * scale);
          ctx.fillRect(headX + eyeOffX + 2 * scale, eyeY - 5 * scale, 12 * scale, 8 * scale);
          ctx.beginPath(); ctx.moveTo(headX - headRadius * 0.7, eyeY - 2 * scale); ctx.lineTo(headX + headRadius * 0.9, eyeY - 2 * scale); ctx.stroke();
        } else if (char.expr === "starstruck") {
          ctx.fillStyle = "#facc15";
          ctx.font = `900 ${Math.round(14 * scale)}px "Inter", sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("★", headX + eyeOffX - 6 * scale, eyeY);
          ctx.fillText("★", headX + eyeOffX + 8 * scale, eyeY);
          ctx.fillStyle = strokeMain;
        } else if (char.expr === "laughing") {
          ctx.beginPath();
          ctx.moveTo(headX + eyeOffX - 10 * scale, eyeY + 2 * scale);
          ctx.lineTo(headX + eyeOffX - 6 * scale, eyeY - 3 * scale);
          ctx.lineTo(headX + eyeOffX - 2 * scale, eyeY + 2 * scale);
          ctx.moveTo(headX + eyeOffX + 4 * scale, eyeY + 2 * scale);
          ctx.lineTo(headX + eyeOffX + 8 * scale, eyeY - 3 * scale);
          ctx.lineTo(headX + eyeOffX + 12 * scale, eyeY + 2 * scale);
          ctx.stroke();
        } else if (char.expr === "deadpan" || char.expr === "suspicious") {
          ctx.beginPath();
          ctx.moveTo(headX + eyeOffX - 10 * scale, eyeY); ctx.lineTo(headX + eyeOffX - 2 * scale, eyeY);
          ctx.moveTo(headX + eyeOffX + 4 * scale, eyeY); ctx.lineTo(headX + eyeOffX + 12 * scale, eyeY);
          ctx.stroke();
        } else if (char.expr === "shocked" || char.expr === "mindblown") {
          ctx.beginPath();
          ctx.arc(headX + eyeOffX - 6 * scale, eyeY, 4.2 * scale, 0, Math.PI * 2);
          ctx.arc(headX + eyeOffX + 8 * scale, eyeY, 4.2 * scale, 0, Math.PI * 2);
          ctx.stroke();
          if (char.expr === "mindblown") {
            ctx.strokeStyle = "#f59e0b";
            for (let a = 0; a < 5; a++) {
              const ang = -Math.PI * 0.85 + a * 0.42;
              ctx.beginPath();
              ctx.moveTo(headX + Math.cos(ang) * (headRadius + 3 * scale), headY + Math.sin(ang) * (headRadius + 3 * scale));
              ctx.lineTo(headX + Math.cos(ang) * (headRadius + 12 * scale), headY + Math.sin(ang) * (headRadius + 12 * scale));
              ctx.stroke();
            }
            ctx.strokeStyle = strokeMain;
          }
        } else {
          ctx.beginPath();
          ctx.arc(headX + eyeOffX - 6 * scale, eyeY, 2.8 * scale, 0, Math.PI * 2);
          ctx.arc(headX + eyeOffX + 8 * scale, eyeY, 2.8 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        if (char.expr === "crying") {
          ctx.fillStyle = "#38bdf8";
          const tearOff = ((tSec * 22) % 10) * scale;
          ctx.beginPath();
          ctx.arc(headX + eyeOffX - 6 * scale, eyeY + 5 * scale + tearOff, 2.5 * scale, 0, Math.PI * 2);
          ctx.arc(headX + eyeOffX + 8 * scale, eyeY + 5 * scale + tearOff, 2.5 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = strokeMain;
        } else if (char.expr === "sweat") {
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.ellipse(headX - 13 * scale * dir, headY - 6 * scale, 3 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = strokeMain;
        }

        const mouthY = headY + 9 * scale;
        const mouthOpen = isTalkingNow && (char.action === "talk" || index === 0) ? Math.abs(Math.sin(tSec * 18)) * 5.5 * scale : 0;
        ctx.beginPath();
        if (mouthOpen > 1.5 * scale) {
          ctx.ellipse(headX + eyeOffX, mouthY, 5 * scale, mouthOpen, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (char.expr === "happy" || char.expr === "smug" || char.expr === "cool" || char.expr === "laughing" || char.expr === "starstruck") {
          ctx.arc(headX + eyeOffX, mouthY - 2 * scale, 6.5 * scale, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
        } else if (char.expr === "sad" || char.expr === "crying" || char.expr === "angry") {
          ctx.arc(headX + eyeOffX, mouthY + 5 * scale, 6 * scale, 1.15 * Math.PI, 1.85 * Math.PI);
          ctx.stroke();
        } else if (char.expr === "shocked" || char.expr === "mindblown") {
          ctx.arc(headX + eyeOffX, mouthY + 1 * scale, 4.5 * scale, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.moveTo(headX + eyeOffX - 6 * scale, mouthY);
          ctx.lineTo(headX + eyeOffX + 6 * scale, mouthY);
          ctx.stroke();
        }
      },

      drawBadgeAndName(ctx, headX, topHeadY, cx, cy, char, index, scale, styleMode, tSec, isSelected) {
        const store = window.StickForgeStore;
        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = "rgba(99, 102, 241, 0.9)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(cx - 58 * scale, topHeadY - 58 * scale, 116 * scale, (cy - topHeadY) + 84 * scale);
          ctx.restore();
        }

        if (store.showBadges && char.badgeText && char.badgeText.trim()) {
          const floatY = topHeadY - 26 * scale + Math.sin(tSec * 4 + index) * 3.5 * scale;
          const bCol = char.badgeColor || "#22c55e";
          ctx.font = `800 ${Math.round(15 * scale)}px "JetBrains Mono", monospace`;
          const tw = ctx.measureText(char.badgeText).width;
          const boxW = tw + 22 * scale, boxH = 27 * scale;

          ctx.save();
          ctx.shadowColor = bCol; ctx.shadowBlur = 12 * scale;
          ctx.fillStyle = "rgba(11, 14, 20, 0.92)";
          ctx.strokeStyle = bCol; ctx.lineWidth = 2.5 * scale;
          ctx.beginPath(); ctx.roundRect(headX - boxW / 2, floatY - boxH / 2, boxW, boxH, 8 * scale);
          ctx.fill(); ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = bCol;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(char.badgeText, headX, floatY + 1 * scale);
          ctx.restore();
        }

        // Toggleable Character Name Tag under feet
        if (store.showCharacterNames && char.name && char.name.trim()) {
          ctx.save();
          ctx.font = `700 ${Math.round(11 * scale)}px "Inter", sans-serif`;
          const nw = ctx.measureText(char.name).width + 14 * scale;
          ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
          ctx.beginPath();
          ctx.roundRect(cx - nw / 2, cy + 8 * scale, nw, 18 * scale, 6 * scale);
          ctx.fill();
          ctx.fillStyle = "#e2e8f0";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(char.name, cx, cy + 17 * scale);
          ctx.restore();
        }
      },

      drawTimedCaptions(ctx, W, H, narration, shotElapsed, shotDuration) {
        const store = window.StickForgeStore;
        if (!store.showCaptions || !narration) return;
        const clean = narration.replace(/\[[^\]]+\]/g, "").trim();
        if (!clean) return;
        const words = clean.split(/\s+/);
        const prog = Math.max(0, Math.min(0.999, shotElapsed / Math.max(1, shotDuration)));
        const curIdx = Math.floor(prog * words.length);
        const chunkSz = store.aspectRatio === "9:16" ? 4 : 7;
        const start = Math.floor(curIdx / chunkSz) * chunkSz;
        const chunk = words.slice(start, start + chunkSz);

        ctx.save();
        const fSize = store.aspectRatio === "9:16" ? 23 : 21;
        ctx.font = `800 ${fSize}px "Inter", sans-serif`;
        const lineStr = chunk.join(" ");
        const lw = ctx.measureText(lineStr).width;
        const boxW = Math.min(W * 0.92, lw + 34), boxH = fSize + 20;
        const bx = (W - boxW) / 2, by = H - boxH - 14;

        ctx.fillStyle = "rgba(8, 11, 16, 0.88)";
        ctx.strokeStyle = "rgba(99, 102, 241, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 10); ctx.fill(); ctx.stroke();

        let curX = W / 2 - lw / 2;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        chunk.forEach((w, i) => {
          const gIdx = start + i;
          ctx.fillStyle = gIdx === curIdx ? "#facc15" : gIdx < curIdx ? "#ffffff" : "#94a3b8";
          ctx.fillText(w, curX, by + boxH / 2 + 1);
          curX += ctx.measureText(w + " ").width;
        });
        ctx.restore();
      }
    };

    window.StickForgeRenderer.initPresetPlates();