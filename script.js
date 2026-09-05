/* =========================================================================
   CUSTOMIZE ME
   This is the only section you need to touch to personalize the site.
   ========================================================================= */
const NAME = "Noboni";

const PERSONAL_MESSAGE = `I could have just sent you a normal
Happy Birthday message.

But that felt a little too ordinary.

So I made this instead.

I hope your next year is full of things
you genuinely enjoy, people who make
you happy, and moments you'll want
to remember.

Happy Birthday. 🎂 ✨  💖`;

// Optional background music. Leave as an empty string to skip audio entirely.
// If you add a file, place it at assets/music.mp3 and set the path below.
const MUSIC_SRC = "assets/music.mp3";

// Emojis used for the brief celebratory burst behind the Scene 4 reveal.
const REVEAL_EMOJIS = ["🎈", "🎈", "🎂", "💖", "✨", "🎉", "❤️"];

// The little floating messages revealed by tapping stars in Scene 3.
const STAR_MESSAGES = [
  "For the little things that make you smile.",
  "For the random conversations that somehow become memorable.",
  "For all the moments you probably don't realize are special.",
  "For the person who makes ordinary days a little less ordinary.",
  "Some people leave an impression without even trying.",
  "And then there's you.",
  "Okay... enough clues."
];

/* =========================================================================
   END OF CUSTOMIZATION SECTION
   Everything below this line runs the experience itself.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* -----------------------------------------------------------------------
     SCENE MANAGER
     ----------------------------------------------------------------------- */
  const scenes = Array.from(document.querySelectorAll(".scene"));
  let currentScene = 1;

  function goToScene(num) {
    scenes.forEach((s) => s.classList.remove("scene--active"));
    const next = document.getElementById(`scene-${num}`);
    if (next) next.classList.add("scene--active");
    currentScene = num;
    onSceneEnter(num);
  }

  /* -----------------------------------------------------------------------
     BACKGROUND CANVAS — ambient particles + starfield used across scenes
     ----------------------------------------------------------------------- */
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let W, H, DPR;
  let ambientParticles = [];

  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Particle count scales with screen size to stay smooth on mid-range phones
  function particleCountForScreen() {
    const area = W * H;
    return Math.max(30, Math.min(90, Math.round(area / 14000)));
  }

  function makeAmbientParticles() {
    const count = particleCountForScreen();
    ambientParticles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.15,
      drift: (Math.random() - 0.5) * 0.08,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      phase: Math.random() * Math.PI * 2
    }));
  }
  makeAmbientParticles();
  window.addEventListener("resize", makeAmbientParticles);

  // Convergence state used only during the Scene 3 -> Scene 4 transition
  let converging = false;
  let convergeProgress = 0;
  let convergeStars = [];

  function animateBackground() {
    ctx.clearRect(0, 0, W, H);

    // ambient twinkling dust, always drawn softly behind everything
    ambientParticles.forEach((p) => {
      p.phase += p.twinkleSpeed;
      const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.phase));
      p.y += p.drift;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 241, 234, ${alpha.toFixed(3)})`;
      ctx.fill();
    });

    if (converging) {
      drawConvergence();
    }

    requestAnimationFrame(animateBackground);
  }
  requestAnimationFrame(animateBackground);

  function drawConvergence() {
    const cx = W / 2;
    const cy = H / 2.4;
    convergeProgress = Math.min(1, convergeProgress + 0.012);

    convergeStars.forEach((s) => {
      const x = s.x + (cx - s.x) * easeInOutCubic(convergeProgress);
      const y = s.y + (cy - s.y) * easeInOutCubic(convergeProgress);
      const r = s.r * (1 - 0.5 * convergeProgress) + 0.5;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      grad.addColorStop(0, "rgba(255,255,255,0.9)");
      grad.addColorStop(0.5, "rgba(212,175,106,0.5)");
      grad.addColorStop(1, "rgba(212,175,106,0)");
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // soft glow bloom growing at center as stars gather
    if (convergeProgress > 0.6) {
      const bloomAlpha = (convergeProgress - 0.6) / 0.4;
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
      bloom.addColorStop(0, `rgba(212,175,106,${0.35 * bloomAlpha})`);
      bloom.addColorStop(1, "rgba(212,175,106,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* -----------------------------------------------------------------------
     SCENE 1 — mysterious console intro
     ----------------------------------------------------------------------- */
  const consoleLines = [
    { el: document.getElementById("console-line-1"), text: "initializing something special..." },
    { el: document.getElementById("console-line-2"), text: "searching for the right person..." },
    { el: document.getElementById("console-line-3"), text: "found." },
    { el: document.getElementById("console-line-4"), text: "preparing your surprise..." }
  ];
  const scene1Followup = document.getElementById("scene1-followup");
  const enterBtn = document.getElementById("enter-btn");

  function typeLine(lineObj, speed = 32) {
    return new Promise((resolve) => {
      let i = 0;
      const { el, text } = lineObj;
      const interval = setInterval(() => {
        el.textContent = text.slice(0, i + 1);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          el.classList.add("done");
          resolve();
        }
      }, speed);
    });
  }

  async function runIntroSequence() {
    for (const line of consoleLines) {
      await typeLine(line);
      await wait(380);
    }
    await wait(400);
    scene1Followup.classList.add("show");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  runIntroSequence();

  enterBtn.addEventListener("click", () => {
    startMusicIfAvailable();
    goToScene(2);
  });

  /* -----------------------------------------------------------------------
     SCENE 2 — name reveal
     ----------------------------------------------------------------------- */
  const nameReveal = document.getElementById("name-reveal");
  const scene2Line1 = document.getElementById("scene2-line1");
  const scene2Line2 = document.getElementById("scene2-line2");
  let scene2Played = false;

  async function playScene2() {
    if (scene2Played) return;
    scene2Played = true;
    nameReveal.textContent = `Hey, ${NAME}.`;
    await wait(200);
    nameReveal.classList.add("show");
    await wait(1400);
    scene2Line1.classList.add("show");
    await wait(1600);
    scene2Line2.classList.add("show");
    await wait(2600);
    goToScene(3);
  }

  /* -----------------------------------------------------------------------
     SCENE 3 — interactive stars
     ----------------------------------------------------------------------- */
  const starField = document.getElementById("star-field");
  const starProgress = document.getElementById("star-progress");
  const tapHint = document.getElementById("tap-hint");
  let starsClicked = 0;
  let starPositions = [];
  let scene3Built = false;
  let nextMessageIndex = 0; // messages always reveal in STAR_MESSAGES order, regardless of tap order

  function buildStars() {
    if (scene3Built) return;
    scene3Built = true;

    const count = STAR_MESSAGES.length;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Safe zone as % of viewport — keeps stars clear of the "tap a star"
    // hint near the top and the progress counter near the bottom.
    const xMinPct = 10, xMaxPct = 90;
    const yMinPct = 22, yMaxPct = 88;

    // Minimum distance (in real pixels) between star centers, so their
    // touch targets (visible dot + its enlarged invisible tap zone) never
    // overlap. Scales gently with the smaller viewport dimension so it
    // stays sane on both small phones and large desktop screens.
    const minDistancePx = Math.max(58, Math.min(96, Math.min(w, h) * 0.16));

    const placedPx = [];
    const positions = [];

    for (let i = 0; i < count; i++) {
      let placed = false;
      let attempt = 0;
      let currentMin = minDistancePx;

      while (!placed) {
        const xPct = xMinPct + Math.random() * (xMaxPct - xMinPct);
        const yPct = yMinPct + Math.random() * (yMaxPct - yMinPct);
        const xPx = (xPct / 100) * w;
        const yPx = (yPct / 100) * h;

        const farEnough = placedPx.every((p) => {
          const dx = p.x - xPx;
          const dy = p.y - yPx;
          return Math.sqrt(dx * dx + dy * dy) >= currentMin;
        });

        if (farEnough || attempt > 400) {
          placedPx.push({ x: xPx, y: yPx });
          positions.push({ xPct, yPct });
          placed = true;
        }

        attempt++;
        // relax the constraint gradually so placement always terminates,
        // even on unusually small or oddly-shaped viewports
        if (attempt % 60 === 0) currentMin *= 0.85;
      }
    }

    positions.forEach((pos, i) => {
      const x = pos.xPct;
      const y = pos.yPct;

      const star = document.createElement("div");
      star.className = "star";
      star.style.left = x + "%";
      star.style.top = y + "%";
      star.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
      star.dataset.index = i;

      // Message text is assigned at click-time (see handleStarClick) so
      // the reveal order always follows STAR_MESSAGES, no matter which
      // star the user taps first.
      const message = document.createElement("p");
      message.className = "star-message";

      star.addEventListener("click", () => handleStarClick(star, message), { once: true });

      starField.appendChild(star);
      starField.appendChild(message);
      starPositions.push({ el: star, x, y });
    });

    updateProgress();
  }

  // Positions a star's message so it always stays fully inside the
  // viewport, with a comfortable margin on every side. Prefers floating
  // above the star; falls back to below when there isn't room above;
  // clamps left/right so edge-hugging stars never push the message
  // off-screen.
  function positionStarMessage(star, message) {
    const margin = 16;
    const containerRect = starField.getBoundingClientRect();
    const starRect = star.getBoundingClientRect();

    const starCenterX = starRect.left + starRect.width / 2;
    const starCenterY = starRect.top + starRect.height / 2;

    const mw = message.offsetWidth;
    const mh = message.offsetHeight;

    let viewportLeft = starCenterX - mw / 2;
    let viewportTop = starCenterY - mh - 28;

    // not enough room above the star — show the message below it instead
    if (viewportTop < margin) {
      viewportTop = starRect.bottom + 20;
    }

    // clamp fully inside the viewport, using real message dimensions
    viewportLeft = Math.max(margin, Math.min(viewportLeft, window.innerWidth - mw - margin));
    viewportTop = Math.max(margin, Math.min(viewportTop, window.innerHeight - mh - margin));

    // message is absolutely positioned relative to #star-field, so convert
    // from viewport coordinates to coordinates relative to that container
    message.style.left = (viewportLeft - containerRect.left) + "px";
    message.style.top = (viewportTop - containerRect.top) + "px";
  }

  function handleStarClick(star, message) {
    const text = STAR_MESSAGES[nextMessageIndex];
    nextMessageIndex++;

    message.textContent = text;
    star.classList.add("used");

    // measure and position now that the message has real text in it
    positionStarMessage(star, message);
    message.classList.add("show");

    starsClicked++;
    updateProgress();

    // let each message breathe, then drift away naturally
    setTimeout(() => {
      message.style.opacity = "0";
      message.style.transform = "translateY(-24px) scale(0.92)";
    }, 2600);

    if (starsClicked >= STAR_MESSAGES.length) {
      setTimeout(startConvergenceAndAdvance, 2200);
    }
  }

  function updateProgress() {
    starProgress.textContent = `${starsClicked} / ${STAR_MESSAGES.length}`;
  }

  function startConvergenceAndAdvance() {
    // map star DOM positions (percent) to pixel coords for the canvas convergence
    convergeStars = starPositions.map((s) => ({
      x: (s.x / 100) * window.innerWidth,
      y: (s.y / 100) * window.innerHeight,
      r: 5
    }));
    convergeProgress = 0;
    converging = true;
    tapHint.style.opacity = "0";

    setTimeout(() => {
      goToScene(4);
      setTimeout(() => {
        converging = false;
      }, 1400);
    }, 1500);
  }

  /* -----------------------------------------------------------------------
     SCENE 4 — birthday reveal
     ----------------------------------------------------------------------- */
  const birthdayTitle = document.getElementById("birthday-title");
  const birthdayName = document.getElementById("birthday-name");
  const continueWrap = document.querySelector(".continue-wrap");
  const toLetterBtn = document.getElementById("to-letter-btn");
  const titleGlow = document.getElementById("title-glow");
  const emojiBurstContainer = document.getElementById("emoji-burst");
  let scene4Played = false;

  // Spawns a short, subtle burst of floating emojis along the left/right
  // edges of the screen so the HAPPY BIRTHDAY text stays fully readable.
  // Runs once, only during the Scene 4 reveal.
  function spawnEmojiBurst() {
    if (!emojiBurstContainer) return;
    const count = 12 + Math.floor(Math.random() * 7); // 12–18

    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "emoji-particle";
      span.textContent = REVEAL_EMOJIS[Math.floor(Math.random() * REVEAL_EMOJIS.length)];

      // keep spawn points in the side margins, clear of the centered title
      const leftPct = Math.random() < 0.5
        ? 2 + Math.random() * 20    // left band
        : 78 + Math.random() * 20;  // right band

      const duration = 3.2 + Math.random() * 1.8;
      const delay = Math.random() * 0.7;
      const rot = (Math.random() * 50 - 25).toFixed(1) + "deg";
      const size = (1 + Math.random() * 0.5).toFixed(2);

      span.style.left = leftPct + "%";
      span.style.fontSize = size + "rem";
      span.style.animationDuration = duration + "s";
      span.style.animationDelay = delay + "s";
      span.style.setProperty("--rot", rot);

      emojiBurstContainer.appendChild(span);
      setTimeout(() => span.remove(), (duration + delay) * 1000 + 300);
    }
  }

  async function playScene4() {
    if (scene4Played) return;
    scene4Played = true;
    birthdayName.textContent = `${NAME} ✨`;
    await wait(300);
    titleGlow.classList.add("show");
    birthdayTitle.classList.add("show");
    spawnEmojiBurst();
    await wait(700);
    birthdayName.classList.add("show");
    await wait(900);
    continueWrap.classList.add("show");
  }

  toLetterBtn.addEventListener("click", () => goToScene(5));

  /* -----------------------------------------------------------------------
     SCENE 5 — the letter
     ----------------------------------------------------------------------- */
  const letterPrompt = document.getElementById("letter-prompt");
  const envelope = document.getElementById("envelope");
  const envelopeCard = document.querySelector(".envelope__card");
  const envelopeText = document.getElementById("envelope-text");
  const openLetterBtn = document.getElementById("open-letter-btn");
  const finishLetterBtn = document.getElementById("finish-letter-btn");

  // The message may contain manual line breaks the user typed while
  // writing it (like the placeholder text does). Those breaks were
  // authored for a specific card width, so displaying them verbatim
  // (via white-space: pre-line) causes double-wrapping at other font
  // sizes/widths — short authored lines wrap again mid-sentence into
  // orphan words. Blank lines between paragraphs are real paragraph
  // breaks and are kept; single line breaks inside a paragraph are
  // collapsed into spaces so the browser wraps each paragraph naturally
  // based on the card's real width.
  function formatMessageForWrap(text) {
    return text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
      .join("\n\n");
  }

  openLetterBtn.addEventListener("click", async () => {
    letterPrompt.style.opacity = "0";
    await wait(500);
    letterPrompt.hidden = true;
    envelope.hidden = false;
    await wait(50);
    envelopeCard.classList.add("open");
    await wait(600);
    typeMessage(formatMessageForWrap(PERSONAL_MESSAGE));
  });

  function typeMessage(text) {
    let i = 0;
    envelopeText.textContent = "";
    const interval = setInterval(() => {
      envelopeText.textContent = text.slice(0, i + 1);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 22);
  }

  finishLetterBtn.addEventListener("click", () => goToScene(6));

  /* -----------------------------------------------------------------------
     SCENE 6 — final moment
     ----------------------------------------------------------------------- */
  const finalLine1 = document.getElementById("final-line1");
  const finalLine2 = document.getElementById("final-line2");
  const finalLine3 = document.getElementById("final-line3");
  const finalTitle = document.getElementById("final-title");
  const finalSub = document.querySelector(".final-sub");
  const replayBtn = document.getElementById("replay-btn");
  let scene6Played = false;

  async function playScene6() {
    if (scene6Played) return;
    scene6Played = true;
    finalTitle.textContent = `Happy Birthday, ${NAME} ❤️`;

    await wait(400);
    finalLine1.classList.add("show");
    await wait(1600);
    finalLine2.classList.add("show");
    await wait(2000);
    finalLine3.classList.add("show");
    await wait(1800);
    finalTitle.classList.add("show");
    await wait(600);
    finalSub.classList.add("show");
    await wait(900);
    replayBtn.classList.add("show");
  }

  replayBtn.addEventListener("click", () => {
    window.location.reload();
  });

  /* -----------------------------------------------------------------------
     SCENE ENTRY HOOK — triggers the right animation the first time a
     scene becomes active
     ----------------------------------------------------------------------- */
  function onSceneEnter(num) {
    if (num === 2) playScene2();
    if (num === 3) buildStars();
    if (num === 4) playScene4();
    if (num === 6) playScene6();
  }

  /* -----------------------------------------------------------------------
     OPTIONAL BACKGROUND MUSIC — never autoplays; starts only after ENTER
     ----------------------------------------------------------------------- */
  let audio = null;
  let musicStarted = false;
  const soundToggle = document.getElementById("sound-toggle");
  const MUSIC_TARGET_VOLUME = 0.22; // ~20-25%
  const MUSIC_FADE_MS = 2000;

  if (MUSIC_SRC) {
    audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0;
    soundToggle.hidden = false;

    // If the file is missing or fails to load, fail silently — the rest
    // of the site keeps working exactly as before.
    audio.addEventListener("error", () => {
      audio = null;
      soundToggle.hidden = true;
    });
  }

  function fadeAudioIn(el, targetVolume, durationMs) {
    const steps = 40;
    const stepTime = durationMs / steps;
    const increment = targetVolume / steps;
    let step = 0;
    const fade = setInterval(() => {
      step++;
      el.volume = Math.min(targetVolume, increment * step);
      if (step >= steps) clearInterval(fade);
    }, stepTime);
  }

  function startMusicIfAvailable() {
    if (!audio || musicStarted) return;
    musicStarted = true;
    audio.volume = 0;
    audio.play().then(() => {
      soundToggle.classList.add("on");
      fadeAudioIn(audio, MUSIC_TARGET_VOLUME, MUSIC_FADE_MS);
    }).catch(() => {
      // Autoplay was blocked — the site still works fine without sound.
      // The sound toggle lets the user start it manually.
      musicStarted = false;
    });
  }

  soundToggle.addEventListener("click", () => {
    if (!audio) return;
    if (audio.paused) {
      if (!musicStarted) {
        // first play triggered manually via the toggle rather than ENTER
        startMusicIfAvailable();
      } else {
        audio.play();
        soundToggle.classList.add("on");
      }
    } else {
      audio.pause();
      soundToggle.classList.remove("on");
    }
  });

});
