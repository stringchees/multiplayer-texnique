"use strict";

const { createProblemBank, LEAGUES, EULER_ACCESS_CODE } = window.TEXNIQUE_BANK;
const problems = createProblemBank();
const problemsById = new Map(problems.map((problem) => [problem.id, problem]));

const keys = {
  users: "texnique-users-v3",
  session: "texnique-session-v3",
  guest: "texnique-guest-profile-v3"
};

const blankRun = () => ({
  leagueId: "leibniz",
  mode: "practice",
  problemIds: [],
  index: 0,
  score: 0,
  streak: 0,
  startedAt: null
});

const state = {
  activeUser: null,
  profile: null,
  selectedLeague: "leibniz",
  detailLeague: "leibniz",
  run: blankRun(),
  backendOnline: false,
  room: null,
  roomCode: "",
  playerId: "",
  events: null
};

const elements = {
  screens: document.querySelectorAll(".screen"),
  showLogin: document.querySelector("#show-login"),
  guestStart: document.querySelector("#guest-start"),
  backToLanding: document.querySelector("#back-to-landing"),
  loginForm: document.querySelector("#login-form"),
  loginName: document.querySelector("#login-name"),
  loginPassword: document.querySelector("#login-password"),
  loginMessage: document.querySelector("#login-message"),
  activeUser: document.querySelector("#active-user"),
  logoutButton: document.querySelector("#logout-button"),
  tabButtons: document.querySelectorAll(".tab-button"),
  panels: document.querySelectorAll(".tab-panel"),
  leagueSelect: document.querySelector("#league-select"),
  lockPanel: document.querySelector("#lock-panel"),
  eulerPassword: document.querySelector("#euler-password"),
  unlockEuler: document.querySelector("#unlock-euler"),
  practiceStart: document.querySelector("#practice-start"),
  rankedStart: document.querySelector("#ranked-start"),
  leagueLabel: document.querySelector("#league-label"),
  problemTitle: document.querySelector("#problem-title"),
  problemPretty: document.querySelector("#problem-pretty"),
  problemPrompt: document.querySelector("#problem-prompt"),
  problemSource: document.querySelector("#problem-source"),
  answerForm: document.querySelector("#answer-form"),
  answerInput: document.querySelector("#answer-input"),
  feedbackText: document.querySelector("#feedback-text"),
  hintButton: document.querySelector("#hint-button"),
  roundClock: document.querySelector("#round-clock"),
  runProgress: document.querySelector("#run-progress"),
  scoreValue: document.querySelector("#score-value"),
  streakValue: document.querySelector("#streak-value"),
  bestValue: document.querySelector("#best-value"),
  bankCount: document.querySelector("#bank-count"),
  leagueGrid: document.querySelector("#league-grid"),
  leagueDetail: document.querySelector("#league-detail"),
  resetProfile: document.querySelector("#reset-profile"),
  problemSearch: document.querySelector("#problem-search"),
  categoryFilter: document.querySelector("#category-filter"),
  databaseList: document.querySelector("#database-list"),
  roomPhase: document.querySelector("#room-phase"),
  multiTitle: document.querySelector("#multi-title"),
  multiClock: document.querySelector("#multi-clock"),
  multiProgress: document.querySelector("#multi-progress"),
  multiPretty: document.querySelector("#multi-pretty"),
  multiPrompt: document.querySelector("#multi-prompt"),
  multiSource: document.querySelector("#multi-source"),
  multiAnswerForm: document.querySelector("#multi-answer-form"),
  multiAnswerInput: document.querySelector("#multi-answer-input"),
  multiFeedback: document.querySelector("#multi-feedback"),
  roomName: document.querySelector("#room-name"),
  roomCode: document.querySelector("#room-code"),
  joinRoom: document.querySelector("#join-room"),
  startRoom: document.querySelector("#start-room"),
  roomList: document.querySelector("#room-list")
};

function emptyProfile() {
  return {
    xp: 0,
    bestScore: 0,
    runs: 0,
    leagueWins: {},
    leagueBest: {},
    history: [],
    practiceHistory: [],
    unlockedEuler: false,
    activeRun: null
  };
}

function migrateProfile(profile) {
  return { ...emptyProfile(), ...(profile || {}) };
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(keys.users)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(keys.users, JSON.stringify(users));
}

function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(`texnique:${password}`)));
}

function saveActiveProfile() {
  if (!state.activeUser || !state.profile) {
    return;
  }

  state.profile.activeRun = serializeRun();
  if (state.activeUser === "Guest") {
    localStorage.setItem(keys.guest, JSON.stringify(state.profile));
    return;
  }

  const users = loadUsers();
  if (!users[state.activeUser]) {
    return;
  }
  users[state.activeUser].profile = state.profile;
  saveUsers(users);
}

function serializeRun() {
  if (!state.run.problemIds.length) {
    return null;
  }
  return {
    leagueId: state.run.leagueId,
    mode: state.run.mode,
    problemIds: state.run.problemIds,
    index: state.run.index,
    score: state.run.score,
    streak: state.run.streak,
    startedAt: state.run.startedAt
  };
}

function restoreRun(savedRun) {
  if (!savedRun || !Array.isArray(savedRun.problemIds)) {
    state.run = blankRun();
    return;
  }
  state.run = {
    ...blankRun(),
    ...savedRun,
    problemIds: savedRun.problemIds.filter((id) => problemsById.has(id))
  };
  state.selectedLeague = state.run.leagueId || state.selectedLeague;
}

function showScreen(id) {
  elements.screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
}

function login(username, password) {
  const cleanName = username.trim();
  if (!cleanName) {
    return { ok: false, message: "Enter a username." };
  }

  const users = loadUsers();
  const hash = encodePassword(password);
  const existing = users[cleanName];

  if (!existing) {
    users[cleanName] = { password: hash, profile: emptyProfile() };
    saveUsers(users);
  } else if (existing.password !== hash) {
    return { ok: false, message: "That password does not match this local account." };
  }

  state.activeUser = cleanName;
  state.profile = migrateProfile(users[cleanName].profile);
  restoreRun(state.profile.activeRun);
  localStorage.setItem(keys.session, cleanName);
  renderApp();
  showScreen("app-screen");
  return { ok: true, message: existing ? "Welcome back." : "Account created." };
}

function continueAsGuest() {
  state.activeUser = "Guest";
  try {
    state.profile = migrateProfile(JSON.parse(localStorage.getItem(keys.guest)));
  } catch {
    state.profile = emptyProfile();
  }
  restoreRun(state.profile.activeRun);
  renderApp();
  showScreen("app-screen");
}

function restoreSession() {
  const username = localStorage.getItem(keys.session);
  const users = loadUsers();
  if (username && users[username]) {
    state.activeUser = username;
    state.profile = migrateProfile(users[username].profile);
    restoreRun(state.profile.activeRun);
    renderApp();
    showScreen("app-screen");
  }
}

function logout() {
  saveActiveProfile();
  localStorage.removeItem(keys.session);
  closeRoom();
  state.activeUser = null;
  state.profile = null;
  state.run = blankRun();
  showScreen("landing-screen");
}

function currentLeague() {
  return LEAGUES.find((league) => league.id === state.selectedLeague) || LEAGUES[0];
}

function getLeague(id) {
  return LEAGUES.find((league) => league.id === id) || LEAGUES[0];
}

function isLeagueUnlocked(league) {
  return !league.locked || Boolean(state.profile && state.profile.unlockedEuler);
}

function normalize(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "");
}

function isCorrect(problem, answer) {
  return [problem.answer, ...(problem.aliases || [])].map(normalize).includes(normalize(answer));
}

function chooseProblemIds(leagueId, count = 18) {
  const league = getLeague(leagueId);
  const pool = problems.filter((problem) => league.tiers.includes(problem.tier));
  return pool
    .map((problem) => ({ problem, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map((item) => item.problem.id);
}

function startRun(mode, leagueId = state.selectedLeague) {
  const league = getLeague(leagueId);
  state.selectedLeague = league.id;
  if (!isLeagueUnlocked(league)) {
    setFeedback("Euler Circle is locked. Enter eulercircle to unlock it.", false);
    elements.eulerPassword.focus();
    return;
  }

  state.run = {
    leagueId: league.id,
    mode,
    problemIds: chooseProblemIds(league.id, league.id === "euler-circle" ? 24 : 18),
    index: 0,
    score: 0,
    streak: 0,
    startedAt: Date.now()
  };
  renderLeagueSelect();
  setFeedback(`${mode === "ranked" ? "Ranked run" : "Practice set"} started. Enter exact TeX for the displayed expression.`, true);
  elements.answerInput.value = "";
  elements.answerInput.focus();
  saveActiveProfile();
  renderProblem();
  renderStats();
}

function startPractice() {
  startRun("practice");
}

function startRankedRun(leagueId = state.selectedLeague) {
  startRun("ranked", leagueId);
}

function finishRun() {
  const league = getLeague(state.run.leagueId);
  const finalScore = state.run.score;
  const completed = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    leagueId: league.id,
    leagueName: league.name,
    mode: state.run.mode,
    score: finalScore,
    solved: state.run.index,
    total: state.run.problemIds.length,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - state.run.startedAt
  };

  state.profile.runs += 1;
  state.profile.xp += Math.floor(finalScore / (state.run.mode === "ranked" ? 1 : 3));
  if (state.run.mode === "ranked") {
    state.profile.bestScore = Math.max(state.profile.bestScore || 0, finalScore);
    state.profile.leagueBest[league.id] = Math.max(state.profile.leagueBest[league.id] || 0, finalScore);
    state.profile.leagueWins[league.id] = (state.profile.leagueWins[league.id] || 0) + 1;
    state.profile.history = [completed, ...(state.profile.history || [])].slice(0, 120);
  } else {
    state.profile.practiceHistory = [completed, ...(state.profile.practiceHistory || [])].slice(0, 60);
  }
  state.run = blankRun();
  state.profile.activeRun = null;
  saveActiveProfile();
  setFeedback(`${completed.mode === "ranked" ? "Ranked run" : "Practice set"} complete: ${finalScore} points in ${formatClock(completed.durationMs)}.`, true);
  renderProblem();
  renderStats();
  renderLeagues();
  renderLeagueDetail();
}

function handleAnswer(event) {
  event.preventDefault();
  const problem = activeProblem();
  if (!problem) {
    setFeedback("Start a practice set or ranked run first.", false);
    return;
  }

  if (isCorrect(problem, elements.answerInput.value)) {
    state.run.streak += 1;
    state.run.score += 125 + state.run.streak * 20 + problem.tier * 12;
    state.run.index += 1;
    setFeedback("Correct.", true);
    if (state.run.index >= state.run.problemIds.length) {
      elements.answerInput.value = "";
      finishRun();
      return;
    }
  } else {
    state.run.streak = 0;
    state.run.score = Math.max(0, state.run.score - 25);
    setFeedback(state.run.mode === "ranked" ? "Incorrect. No hints are shown during ranked runs." : `Incorrect. ${problem.hint}`, false);
  }

  elements.answerInput.value = "";
  saveActiveProfile();
  renderProblem();
  renderStats();
}

function activeProblem() {
  return problemsById.get(state.run.problemIds[state.run.index]) || null;
}

function renderProblem() {
  const league = currentLeague();
  const problem = activeProblem();
  elements.leagueLabel.textContent = league.name;

  if (!problem) {
    elements.problemTitle.textContent = isLeagueUnlocked(league) ? "Start a set" : "Locked league";
    elements.problemPretty.textContent = isLeagueUnlocked(league)
      ? "Select a league and start practice, or use Ranked Run for leaderboard scoring."
      : "Euler Circle requires the password eulercircle.";
    elements.problemPrompt.textContent = "Problems are sampled from the selected league tiers.";
    elements.problemSource.textContent = "";
    elements.answerInput.placeholder = "Type TeX";
  } else {
    elements.problemTitle.textContent = problem.category;
    elements.problemPretty.textContent = problem.pretty;
    elements.problemPrompt.textContent = `${problem.prompt}. Tier ${problem.tier}.`;
    elements.problemSource.textContent = `Expected notation family: ${problem.category}`;
    elements.answerInput.placeholder = problem.answer;
  }

  elements.runProgress.textContent = `${state.run.mode === "ranked" ? "ranked" : "practice"} · ${state.run.index}/${state.run.problemIds.length}`;
}

function renderStats() {
  elements.scoreValue.textContent = state.run.score;
  elements.streakValue.textContent = state.run.streak;
  elements.bestValue.textContent = state.profile ? state.profile.bestScore || 0 : 0;
  elements.bankCount.textContent = problems.length;
}

function renderLeagueSelect() {
  elements.leagueSelect.innerHTML = LEAGUES.map((league) => {
    const suffix = league.locked && !isLeagueUnlocked(league) ? " (locked)" : "";
    return `<option value="${league.id}">${league.name}${suffix}</option>`;
  }).join("");
  elements.leagueSelect.value = state.selectedLeague;
  renderLockPanel();
}

function renderLockPanel() {
  const league = currentLeague();
  elements.lockPanel.classList.toggle("is-visible", Boolean(league.locked && !isLeagueUnlocked(league)));
}

function leaderboardForLeague(leagueId) {
  const users = loadUsers();
  const rows = Object.entries(users).map(([name, user]) => {
    const profile = migrateProfile(user.profile);
    const leagueRuns = (profile.history || []).filter((run) => run.leagueId === leagueId);
    return {
      name,
      best: profile.leagueBest?.[leagueId] || 0,
      runs: leagueRuns.length,
      last: leagueRuns[0]?.completedAt || null
    };
  });

  if (state.activeUser === "Guest" && state.profile) {
    const leagueRuns = (state.profile.history || []).filter((run) => run.leagueId === leagueId);
    rows.push({
      name: "Guest",
      best: state.profile.leagueBest?.[leagueId] || 0,
      runs: leagueRuns.length,
      last: leagueRuns[0]?.completedAt || null
    });
  }

  return rows
    .filter((row) => row.best > 0 || row.runs > 0)
    .sort((a, b) => b.best - a.best || b.runs - a.runs)
    .slice(0, 10);
}

function renderLeagues() {
  elements.leagueGrid.innerHTML = LEAGUES.map((league) => {
    const wins = state.profile ? state.profile.leagueWins[league.id] || 0 : 0;
    const unlocked = isLeagueUnlocked(league);
    const selected = state.detailLeague === league.id;
    const best = state.profile?.leagueBest?.[league.id] || 0;
    const progress = Math.min(100, Math.max(4, wins * 18 + Math.floor((state.profile?.xp || 0) / 750)));
    return `
      <button class="league-card ${unlocked ? "" : "is-locked"} ${selected ? "is-selected" : ""}" data-league-detail="${league.id}" type="button">
        <div class="league-top">
          <div>
            <p class="eyebrow">${unlocked ? "Open" : "Locked"}</p>
            <h3>${league.name}</h3>
          </div>
          <span class="badge" style="background:${league.accent}">${league.badge}</span>
        </div>
        <p>${league.brief}</p>
        <div class="meter" style="--meter:${league.accent};--progress:${progress}%"><span></span></div>
        <p>${wins} completed runs · best ${best} · tiers ${league.tiers.join(", ")}</p>
      </button>
    `;
  }).join("");

  elements.leagueGrid.querySelectorAll("[data-league-detail]").forEach((card) => {
    card.addEventListener("click", () => {
      state.detailLeague = card.dataset.leagueDetail;
      renderLeagues();
      renderLeagueDetail();
    });
  });
}

function renderLeagueDetail() {
  const league = getLeague(state.detailLeague);
  const rows = leaderboardForLeague(league.id);
  const examples = problems.filter((problem) => league.tiers.includes(problem.tier)).slice(0, 6);
  const recent = (state.profile?.history || []).filter((run) => run.leagueId === league.id).slice(0, 5);

  elements.leagueDetail.innerHTML = `
    <div class="league-detail-head">
      <div>
        <p class="eyebrow">League Detail</p>
        <h3>${league.name}</h3>
      </div>
      <div class="league-actions">
        <button class="secondary-action" id="practice-detail-league" type="button">Practice ${league.badge}</button>
        <button class="primary-action" id="ranked-detail-league" type="button">Start Ranked Run</button>
      </div>
    </div>
    <div class="detail-grid">
      <section>
        <h4>Leaderboard</h4>
        <div class="leaderboard-list">
          ${
            rows.length
              ? rows
                  .map(
                    (row, index) => `
                      <div class="leaderboard-row">
                        <span>${index + 1}. ${escapeHtml(row.name)}</span>
                        <strong>${row.best}</strong>
                        <small>${row.runs} run${row.runs === 1 ? "" : "s"}</small>
                      </div>
                    `
                  )
                  .join("")
              : `<p class="status-text">No completed runs in this league yet.</p>`
          }
        </div>
      </section>
      <section>
        <h4>Recent Runs</h4>
        <div class="leaderboard-list">
          ${
            recent.length
              ? recent
                  .map(
                    (run) => `
                      <div class="leaderboard-row">
                        <span>${new Date(run.completedAt).toLocaleDateString()}</span>
                        <strong>${run.score}</strong>
                        <small>${run.solved}/${run.total}</small>
                      </div>
                    `
                  )
                  .join("")
              : `<p class="status-text">Complete a set to record progress.</p>`
          }
        </div>
      </section>
      <section>
        <h4>Sample Notation</h4>
        <div class="example-list">
          ${examples.map((problem) => `<code>${escapeHtml(problem.answer)}</code>`).join("")}
        </div>
      </section>
    </div>
  `;

  const practiceDetail = elements.leagueDetail.querySelector("#practice-detail-league");
  const rankedDetail = elements.leagueDetail.querySelector("#ranked-detail-league");

  practiceDetail?.addEventListener("click", () => {
    state.selectedLeague = league.id;
    renderLeagueSelect();
    setTab("practice");
    startPractice();
  });
  rankedDetail?.addEventListener("click", () => {
    state.selectedLeague = league.id;
    renderLeagueSelect();
    setTab("practice");
    startRankedRun(league.id);
  });
}

function renderDatabaseOptions() {
  const categories = Array.from(new Set(problems.map((problem) => problem.category))).sort();
  elements.categoryFilter.innerHTML = `<option value="all">All categories</option>${categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("")}`;
}

function renderDatabase() {
  const search = elements.problemSearch.value.trim().toLowerCase();
  const category = elements.categoryFilter.value;
  const visible = problems
    .filter((problem) => category === "all" || problem.category === category)
    .filter((problem) => {
      const text = `${problem.title} ${problem.pretty} ${problem.answer} ${problem.category}`.toLowerCase();
      return !search || text.includes(search);
    })
    .slice(0, 180);

  elements.databaseList.innerHTML = visible
    .map(
      (problem) => `
        <article class="database-card">
          <div class="chips">
            <span class="chip">Tier ${problem.tier}</span>
            <span class="chip">${escapeHtml(problem.category)}</span>
          </div>
          <h3>${escapeHtml(problem.pretty)}</h3>
          <code>${escapeHtml(problem.answer)}</code>
          <p>${escapeHtml(problem.hint)}</p>
        </article>
      `
    )
    .join("");
}

function renderApp() {
  elements.activeUser.textContent = state.activeUser || "Guest";
  elements.roomName.value = state.activeUser || "";
  renderLeagueSelect();
  renderProblem();
  renderStats();
  renderLeagues();
  renderLeagueDetail();
  renderDatabaseOptions();
  renderDatabase();
  pingBackend();
}

function setFeedback(message, good) {
  elements.feedbackText.textContent = message;
  elements.feedbackText.classList.toggle("is-good", Boolean(good));
  elements.feedbackText.classList.toggle("is-bad", !good);
}

function setMultiFeedback(message, good) {
  elements.multiFeedback.textContent = message;
  elements.multiFeedback.classList.toggle("is-good", Boolean(good));
  elements.multiFeedback.classList.toggle("is-bad", !good);
}

function setTab(tab) {
  elements.tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  elements.panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === `${tab}-panel`));
}

function unlockEuler() {
  if (elements.eulerPassword.value.trim().toLowerCase() !== EULER_ACCESS_CODE) {
    setFeedback("Wrong Euler Circle password. Use eulercircle.", false);
    return;
  }
  state.profile.unlockedEuler = true;
  saveActiveProfile();
  elements.eulerPassword.value = "";
  renderLeagueSelect();
  renderLeagues();
  renderLeagueDetail();
  setFeedback("Euler Circle unlocked.", true);
}

function showHint() {
  const problem = activeProblem();
  if (problem && state.run.mode === "ranked") {
    setFeedback("Hints are disabled during ranked runs.", false);
    return;
  }
  setFeedback(problem ? problem.hint : "Start a run first.", Boolean(problem));
}

function resetProgress() {
  state.profile = emptyProfile();
  state.run = blankRun();
  saveActiveProfile();
  renderApp();
  setFeedback("Progress reset.", true);
}

function formatClock(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function tickClock() {
  elements.roundClock.textContent =
    state.run.startedAt && state.run.problemIds.length ? formatClock(Date.now() - state.run.startedAt) : "00:00";
  elements.multiClock.textContent =
    state.room && state.room.startedAt && state.room.phase === "race"
      ? formatClock(Date.now() - state.room.startedAt)
      : "00:00";
}

async function pingBackend() {
  try {
    const response = await fetch("api/problems", { cache: "no-store" });
    state.backendOnline = response.ok && response.headers.get("content-type")?.includes("application/json");
  } catch {
    state.backendOnline = false;
  }
  renderRoom();
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

async function joinRoom() {
  const league = currentLeague();
  if (!isLeagueUnlocked(league)) {
    setMultiFeedback("Unlock Euler Circle before creating an Euler room.", false);
    return;
  }

  const code = elements.roomCode.value.trim().toUpperCase() || randomRoomCode();
  const name = elements.roomName.value.trim() || state.activeUser || "Player";
  try {
    const response = await fetch(`api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!response.ok) {
      throw new Error("Join failed");
    }
    const data = await response.json();
    state.playerId = data.playerId;
    state.room = data.room;
    state.roomCode = data.room.code;
    elements.roomCode.value = state.roomCode;
    connectEvents(state.roomCode);
    setMultiFeedback(`Joined room ${state.roomCode}. Share this code.`, true);
    renderRoom();
  } catch {
    setMultiFeedback("Live rooms need the local Node server. Run npm start, then open this page from that server.", false);
  }
}

function connectEvents(code) {
  if (state.events) {
    state.events.close();
  }
  state.events = new EventSource(`api/rooms/${code}/events`);
  state.events.addEventListener("state", (event) => {
    state.room = JSON.parse(event.data);
    renderRoom();
  });
  state.events.addEventListener("error", () => {
    setMultiFeedback("Room connection is retrying.", false);
  });
}

async function startRoom() {
  if (!state.playerId) {
    await joinRoom();
  }
  if (!state.playerId || !state.roomCode) {
    return;
  }
  try {
    const response = await fetch(`api/rooms/${state.roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: state.playerId, leagueId: state.selectedLeague })
    });
    if (!response.ok) {
      throw new Error("Start failed");
    }
    const data = await response.json();
    state.room = data.room;
    elements.multiAnswerInput.value = "";
    elements.multiAnswerInput.focus();
    setMultiFeedback("Live race started.", true);
    renderRoom();
  } catch {
    setMultiFeedback("Could not start the live room.", false);
  }
}

function currentRoomProblem() {
  if (!state.room || state.room.phase !== "race") {
    return null;
  }
  const player = state.room.players.find((item) => item.id === state.playerId);
  if (!player || player.finishedAt) {
    return null;
  }
  return state.room.problems[player.currentIndex] || null;
}

async function submitRoomAnswer(event) {
  event.preventDefault();
  const problem = currentRoomProblem();
  if (!problem) {
    setMultiFeedback("Join and start a live race first.", false);
    return;
  }
  try {
    const response = await fetch(`api/rooms/${state.roomCode}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: state.playerId, answer: elements.multiAnswerInput.value })
    });
    const result = await response.json();
    setMultiFeedback(result.correct ? "Correct." : `Incorrect. ${problem.hint}`, Boolean(result.correct));
    elements.multiAnswerInput.value = "";
  } catch {
    setMultiFeedback("Could not submit to the live room.", false);
  }
}

function closeRoom() {
  if (state.events) {
    state.events.close();
  }
  state.events = null;
  state.room = null;
  state.roomCode = "";
  state.playerId = "";
}

function renderRoom() {
  if (!state.backendOnline && !state.room) {
    elements.roomPhase.textContent = "Static hosting";
    elements.multiTitle.textContent = "Live server offline";
    elements.multiPretty.textContent = "Run npm start for live 1v1s and group rooms.";
    elements.multiPrompt.textContent = "GitHub Pages serves the practice app; it cannot hold live room state.";
    elements.multiSource.textContent = "";
    elements.multiProgress.textContent = "0/0";
    elements.roomList.innerHTML = `<p class="status-text">No room connection.</p>`;
    return;
  }

  if (!state.room) {
    elements.roomPhase.textContent = "Ready";
    elements.multiTitle.textContent = "Join a room";
    elements.multiPretty.textContent = "Use one room code for 1v1 or group play.";
    elements.multiPrompt.textContent = "The first player can start the selected league race.";
    elements.multiSource.textContent = "";
    elements.multiProgress.textContent = "0/0";
    elements.roomList.innerHTML = `<p class="status-text">Waiting for players.</p>`;
    return;
  }

  const problem = currentRoomProblem();
  const player = state.room.players.find((item) => item.id === state.playerId);
  elements.roomPhase.textContent = `${state.room.phase} · ${state.room.code}`;
  elements.multiTitle.textContent = getLeague(state.room.leagueId).name;
  elements.multiProgress.textContent = `${player?.currentIndex || 0}/${state.room.problemIds.length || 0}`;

  if (problem) {
    elements.multiPretty.textContent = problem.pretty;
    elements.multiPrompt.textContent = `${problem.prompt}. Tier ${problem.tier}.`;
    elements.multiSource.textContent = `Expected notation family: ${problem.category}`;
    elements.multiAnswerInput.placeholder = problem.answer;
  } else if (state.room.phase === "finished") {
    elements.multiPretty.textContent = "Race complete.";
    elements.multiPrompt.textContent = "Start another race with the same room.";
    elements.multiSource.textContent = "";
  } else {
    elements.multiPretty.textContent = "Waiting for race start.";
    elements.multiPrompt.textContent = "Players in the room will appear below.";
    elements.multiSource.textContent = "";
  }

  elements.roomList.innerHTML = state.room.players
    .map(
      (roomPlayer, index) => `
        <div class="leaderboard-row">
          <span>${index + 1}. ${escapeHtml(roomPlayer.name)}</span>
          <strong>${roomPlayer.score}</strong>
          <small>${roomPlayer.currentIndex}/${state.room.problemIds.length || 0}</small>
        </div>
      `
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bindEvents() {
  elements.showLogin.addEventListener("click", () => showScreen("login-screen"));
  elements.guestStart.addEventListener("click", continueAsGuest);
  elements.backToLanding.addEventListener("click", () => showScreen("landing-screen"));
  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = login(elements.loginName.value, elements.loginPassword.value);
    elements.loginMessage.textContent = result.message;
    elements.loginMessage.classList.toggle("is-bad", !result.ok);
    elements.loginMessage.classList.toggle("is-good", result.ok);
  });
  elements.logoutButton.addEventListener("click", logout);
  elements.tabButtons.forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
  elements.leagueSelect.addEventListener("change", (event) => {
    state.selectedLeague = event.target.value;
    state.run = blankRun();
    saveActiveProfile();
    renderLockPanel();
    renderProblem();
    renderStats();
  });
  elements.unlockEuler.addEventListener("click", unlockEuler);
  elements.practiceStart.addEventListener("click", startPractice);
  elements.rankedStart.addEventListener("click", () => startRankedRun());
  elements.answerForm.addEventListener("submit", handleAnswer);
  elements.hintButton.addEventListener("click", showHint);
  elements.resetProfile.addEventListener("click", resetProgress);
  elements.problemSearch.addEventListener("input", renderDatabase);
  elements.categoryFilter.addEventListener("change", renderDatabase);
  elements.joinRoom.addEventListener("click", joinRoom);
  elements.startRoom.addEventListener("click", startRoom);
  elements.multiAnswerForm.addEventListener("submit", submitRoomAnswer);
  window.addEventListener("beforeunload", saveActiveProfile);
}

bindEvents();
restoreSession();
setInterval(tickClock, 250);
