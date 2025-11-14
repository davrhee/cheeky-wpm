// script.js — placeholder + caret visible while running + results hardened
// 20s fixed test. Edit PARAGRAPHS and RESULTS_RANGES below.

const DURATION = 20;

// ---------- EDIT PARAGRAPHS HERE ----------
const PARAGRAPHS = [
  "Paragraph 1 placeholder. Replace these lines in script.js with your actual flattering paragraph that will be shown to users.",
  "Paragraph 2 placeholder. Keep sentences natural and punctuation attached; the test compares by character.",
  "Paragraph 3 placeholder. When you're ready, edit these strings to the paragraphs you want to present in the typing test."
];
// ----------------------------------------------------------------

// Result tiers (customize)
const RESULTS_RANGES = [
  { min: 0,   max: 60,  label: "Wet Noodle",    emoji: "🫧", description: "A gentle warm‑up — try again and relax into the flow." },
  { min: 61,  max: 80,  label: "Casual Coder",  emoji: "🦥", description: "Nice pace — cozy vibe, steady hands." },
  { min: 81,  max: 100, label: "Fleet Fox",     emoji: "🦊", description: "Quick and tidy — you’ve got momentum." },
  { min: 101, max: 9999,label: "Lightning Bolt",emoji: "⚡", description: "Blazing speed — top‑tier vibe‑coding energy." }
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

// render target paragraph as character spans
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

// placeholder shown before Start is pressed
function showPlaceholder() {
  if (!paragraphWindow) return;
  paragraphWindow.innerHTML = "";
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = "Press Start when you're ready to go";
  paragraphWindow.appendChild(div);
}

// reset state: prepare next paragraph but keep input disabled and caret hidden
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
    // hide caret when idle
    try { input.style.caretColor = "transparent"; } catch (e) {}
  }

  // preload target so restart loads next paragraph; but we don't render it when showing placeholder
  target = (PARAGRAPHS[paragraphIndex % PARAGRAPHS.length] || "").trim();
  paragraphIndex = (paragraphIndex + 1) % PARAGRAPHS.length;

  // For the static state, show the placeholder message
  showPlaceholder();
  updateStats();
}

// start the test: enable input, show paragraph, start timer, show caret
function startTest() {
  if (started) return;

  // ensure target is set and render the paragraph (start consumes the paragraph)
  if (!target || target.length === 0) {
    target = (PARAGRAPHS[paragraphIndex % PARAGRAPHS.length] || "").trim();
    paragraphIndex = (paragraphIndex + 1) % PARAGRAPHS.length;
  }
  renderParagraph();

  hideResults();
  started = true;
  timeLeft = DURATION;
  if (timeEl) timeEl.textContent = timeLeft;

  if (input) {
    input.value = "";
    input._lastLength = 0;
    input.disabled = false;
    input.tabIndex = 0;
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    // apply caret color from CSS variable so caret becomes visible while the test runs
    try {
      const paraBlue = getComputedStyle(document.documentElement).getPropertyValue('--para-blue').trim() || '#9ad1ff';
      input.style.caretColor = paraBlue;
    } catch (e) {}
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

// end the test: disable input, hide caret, show results
function endTest() {
  clearInterval(timer);
  started = false;
  if (input) {
    input.disabled = true;
    input.tabIndex = -1;
    try { input.style.caretColor = "transparent"; } catch (e) {}
  }
  updateStats(true);
  showResults();
}

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

// handle typing: compare typed value to target char-by-char
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

// Initialize: show placeholder on load
document.addEventListener("DOMContentLoaded", () => {
  resetState();
  if (timeEl) timeEl.textContent = DURATION;
  if (wpmEl) wpmEl.textContent = 0;
  if (accuracyEl) accuracyEl.textContent = "100%";
  console.log("Typing test ready — placeholder shown. Press Start to begin.");
});