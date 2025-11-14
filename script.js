// script.js — initial static placeholder before Start is pressed
// 20s fixed test. Paragraphs edited in PARAGRAPHS.

// Configuration
const DURATION = 20;

// ---------- EDIT PARAGRAPHS HERE ----------
const PARAGRAPHS = [
  "apple frog impressive whoever made this wow cake happy cat david sure can create nifty things windy somersault imagine having him on your team like what can't he do bottle palimpsest party cool website dude",
  "joyful exuberance david rhee is cool type fast notice not subliminal internalize love for david grass random filler some of my hobbies include tennis pottery brainwashing also obviously this is kind of a joke but imagine if it worked on somebody",
  "painting sassafras mogul window if you're still here on your third go thanks for sticking around this vibe coding experiment did take more time than i thought it would honestly this javascript is in double digit iterations but what a world we live in that someone like me with limited coding experience can drum this up in one morning hope you enjoyed"
];
// ----------------------------------------------------------------

// Result tiers
const RESULTS_RANGES = [
  { min: 0, max: 69, label: "Diaper", emoji: "👶", description: "Oof. Maybe my code isn't working properly." },
  { min: 70, max: 110, label: "Yummy Noodles", emoji: "🍜", description: "I love noodles but I think you can do better." },
  { min: 111, max: 9999, label: "Fast as Lightning", emoji: "⚡", description: "Bravo. Perhaps by now you've memorized all 3 of my for-sure-randomly-generated prompts?" }
];

function $id(id) { return document.getElementById(id); }

const paragraphWindow = $id("paragraphWindow");
const input = $id("input");
const startBtn = $id("startBtn");
const restartBtn = $id("restartBtn");
const timeEl = $id("time");
const wpmEl = $id("wpm");
const accuracyEl = $id("accuracy");

const typingArea = $id("typingArea");
const resultsArea = $id("resultsArea");
const resultEmoji = $id("resultEmoji");
const resultWpm = $id("resultWpm");
const resultLabel = $id("resultLabel");
const resultDesc = $id("resultDesc");
const resultWpmSmall = $id("resultWpmSmall");
const resultAccSmall = $id("resultAccSmall");
const tryAgainBtn = $id("tryAgainBtn");

// Basic guards
if (!paragraphWindow || !input) {
  console.error("Critical DOM elements missing (#paragraphWindow or #input). Check index.html IDs.");
}

let paragraphIndex = 0;
let target = "";
let timer = null;
let timeLeft = DURATION;
let started = false;
let totalTypedChars = 0;
let correctChars = 0;

// render the selected paragraph as character spans
function renderParagraph() {
  if (!paragraphWindow) return;
  paragraphWindow.innerHTML = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch;
    paragraphWindow.appendChild(span);
  }
  const first = paragraphWindow.querySelector(".char");
  if (first) first.classList.add("current");
}

// show the static placeholder before the test is started
function showPlaceholder() {
  if (!paragraphWindow) return;
  paragraphWindow.innerHTML = "";
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = "Press Start when you're ready to go";
  paragraphWindow.appendChild(div);
}

// reset state and load paragraph (used for Restart and when starting a test)
function resetState() {
  clearInterval(timer);
  hideResults();
  timeLeft = DURATION;
  if (timeEl) timeEl.textContent = timeLeft;
  started = false;
  totalTypedChars = 0;
  correctChars = 0;

  if (input) {
    input.value = "";
    input._lastLength = 0;
    input.disabled = true; // keep disabled until Start
    input.tabIndex = -1;
  }

  // pick paragraph by index and cycle
  target = (PARAGRAPHS[paragraphIndex % PARAGRAPHS.length] || "").trim();
  paragraphIndex = (paragraphIndex + 1) % PARAGRAPHS.length;

  renderParagraph();
  updateStats();
}

// start test (lock duration and start countdown)
function startTest() {
  if (started) return;
  // If the paragraph hasn't been loaded by resetState (e.g., placeholder shown), load it now:
  // We want Start to always begin a test with a paragraph, so ensure target is set.
  if (!target || target.length === 0) {
    target = (PARAGRAPHS[paragraphIndex % PARAGRAPHS.length] || "").trim();
    paragraphIndex = (paragraphIndex + 1) % PARAGRAPHS.length;
    renderParagraph();
  }

  hideResults();
  started = true;
  timeLeft = DURATION;
  if (timeEl) timeEl.textContent = timeLeft;

  if (input) {
    input.value = "";
    input._lastLength = 0;
    input.disabled = false;
    input.tabIndex = 0;
    // focus the overlay input so typed keystrokes go there
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
  }

  totalTypedChars = 0;
  correctChars = 0;
  updateStats();

  timer = setInterval(() => {
    timeLeft--;
    if (timeEl) timeEl.textContent = timeLeft;
    updateStats();
    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}

// stop and finalize
function endTest() {
  clearInterval(timer);
  started = false;
  if (input) {
    input.disabled = true;
    input.tabIndex = -1;
  }
  updateStats(true);
  showResults();
}

// compute WPM using correct chars and elapsed time
function computeWPM() {
  const elapsed = Math.max(1, (DURATION - timeLeft));
  const minutes = elapsed / 60;
  const wpm = Math.round((correctChars / 5) / minutes);
  return isFinite(wpm) ? Math.max(0, wpm) : 0;
}

function updateStats(final = false) {
  if (wpmEl) wpmEl.textContent = computeWPM();
  const acc = totalTypedChars ? Math.round((correctChars / totalTypedChars) * 100) : 100;
  if (accuracyEl) accuracyEl.textContent = `${acc}%`;
  if (final) {
    const current = paragraphWindow && paragraphWindow.querySelector(".char.current");
    if (current) current.classList.remove("current");
  }
}

// typing handler
if (input) {
  input.addEventListener("input", (e) => {
    if (!started) {
      // prevent typing before test begins
      input.value = "";
      input._lastLength = 0;
      return;
    }
    const val = input.value;
    const chars = paragraphWindow ? paragraphWindow.querySelectorAll(".char") : [];
    totalTypedChars = totalTypedChars + (val.length - (input._lastLength || 0));
    input._lastLength = val.length;

    let liveCorrect = 0;
    for (let i = 0; i < chars.length; i++) {
      const span = chars[i];
      span.classList.remove("correct", "incorrect", "current");
      const expected = target[i] || "";
      const typed = val[i] || "";
      if (!typed) {
        // untouched
      } else if (typed === expected) {
        span.classList.add("correct");
        liveCorrect++;
      } else {
        span.classList.add("incorrect");
      }
    }
    const curIndex = Math.min(val.length, Math.max(0, target.length - 1));
    if (chars[curIndex]) chars[curIndex].classList.add("current");

    correctChars = liveCorrect;
    updateStats();
  });

  input.addEventListener("keydown", (e) => {
    if (!started) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      input.value += " ";
      const ev = new Event('input', { bubbles: true });
      input.dispatchEvent(ev);
    }
  });
}

// Attach controls safely
if (startBtn) startBtn.addEventListener("click", () => { resetState(); startTest(); });
if (restartBtn) restartBtn.addEventListener("click", () => { resetState(); });

// results helpers
function pickResultRange(wpm) {
  for (const r of RESULTS_RANGES) {
    if (wpm >= r.min && wpm <= r.max) return r;
  }
  return RESULTS_RANGES[RESULTS_RANGES.length - 1];
}

function showResults() {
  try {
    if (!resultsArea || !typingArea) {
      console.warn("showResults: resultsArea or typingArea not found", { resultsArea, typingArea });
      return;
    }
    const finalWpm = computeWPM();
    const acc = totalTypedChars ? Math.round((correctChars / totalTypedChars) * 100) : 100;
    const range = pickResultRange(finalWpm);

    if (resultEmoji) resultEmoji.textContent = range.emoji || "⭐";
    if (resultWpm) resultWpm.textContent = `${finalWpm} WPM`;
    if (resultLabel) resultLabel.textContent = range.label || "";
    if (resultDesc) resultDesc.textContent = range.description || "";
    if (resultWpmSmall) resultWpmSmall.textContent = finalWpm;
    if (resultAccSmall) resultAccSmall.textContent = `${acc}%`;

    // Force visible swap
    try {
      typingArea.style.display = "none";
      resultsArea.style.display = "block";
      resultsArea.setAttribute("aria-hidden", "false");
      resultsArea.classList.add("show");
    } catch (err) {
      console.error("showResults: error toggling display:", err);
    }
  } catch (err) {
    console.error("showResults: unexpected error", err);
  }
}

function hideResults() {
  if (!resultsArea || !typingArea) return;
  resultsArea.classList.remove("show");
  resultsArea.setAttribute("aria-hidden", "true");
  resultsArea.style.display = "none";
  typingArea.style.display = "block";
}

if (tryAgainBtn) {
  tryAgainBtn.addEventListener("click", () => {
    resetState();
    startTest();
  });
}

// Expose helpers for debugging
window.__typingTest = {
  resetState,
  startTest,
  endTest,
  showResults,
  hideResults,
  computeWPM: () => computeWPM(),
  getState: () => ({ started, timeLeft, totalTypedChars, correctChars })
};

// Initialize: show placeholder (static just-opened state)
document.addEventListener("DOMContentLoaded", () => {
  // ensure input is disabled initially and placeholder shows instead of paragraph
  if (input) {
    input.disabled = true;
    input._lastLength = 0;
    input.tabIndex = -1;
  }
  showPlaceholder();
  if (timeEl) timeEl.textContent = DURATION;
  if (wpmEl) wpmEl.textContent = 0;
  if (accuracyEl) accuracyEl.textContent = "100%";
  console.log("script initialized — static placeholder shown. Press Start to begin.");
});