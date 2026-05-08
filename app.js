"use strict";

const { createProblemBank, LEAGUES, EULER_ACCESS_CODE } = window.TEXNIQUE_BANK;
const problems = createProblemBank();

const keys = {
  users: "texnique-users-v2",
  session: "texnique-session-v2"
};

const state = {
  activeUser: null,
  profile: null,
  selectedLeague: "leibniz",
  run: {
    problems: [],
    index: 0,
    score: 0,
    streak: 0,
    startedAt: null
  }
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
  leagueLabel: document.querySelector("#league-label"),
  problemTitle: document.querySelector("#problem-title"),
  problemPretty: document.querySelector("#problem-pretty"),
  problemPrompt: document.querySelector("#problem-prompt"),
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
  resetProfile: document.querySelector("#reset-profile"),
  problemSearch: document.querySelector("#problem-search"),
  categoryFilter: document.querySelector("#category-filter"),
  databaseList: document.querySelector("#database-list")
};

function emptyProfile() {
  return {
    xp: 0,
    bestScore: 0,
    runs: 0,
    leagueWins: {},
    unlockedEuler: false
  };
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
  if (!state.activeUser) {
    return;
  }
  const users = loadUsers();
  if (!users[state.activeUser]) {
    return;
  }
  users[state.activeUser].profile = state.profile;
  saveUsers(users);
}

function showScreen(id) {
  elements.screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
}

function login(username, password) {
  const cleanName = username.trim();
  const users = loadUsers();
  const hash = encodePassword(password);

  if (!users[cleanName]) {
    users[cleanName] = {
      password: hash,
      profile: emptyProfile()
    };
    saveUsers(users);
  } else if (users[cleanName].password !== hash) {
    return { ok: false, message: "That password does not match this local account." };
  }

  state.activeUser = cleanName;
  state.profile = users[cleanName].profile || emptyProfile();
  localStorage.setItem(keys.session, cleanName);
  renderApp();
  showScreen("app-screen");
  return { ok: true, message: users[cleanName].profile.runs ? "Welcome back." : "Account created." };
}

function continueAsGuest() {
  state.activeUser = "Guest";
  state.profile = emptyProfile();
  renderApp();
  showScreen("app-screen");
}

function restoreSession() {
  const username = localStorage.getItem(keys.session);
  const users = loadUsers();
  if (username && users[username]) {
    state.activeUser = username;
    state.profile = users[username].profile || emptyProfile();
    renderApp();
    showScreen("app-screen");
  }
}

function logout() {
  localStorage.removeItem(keys.session);
  state.activeUser = null;
  state.profile = null;
  state.run = { problems: [], index: 0, score: 0, streak: 0, startedAt: null };
  showScreen("landing-screen");
}

function currentLeague() {
  return LEAGUES.find((league) => league.id === state.selectedLeague) || LEAGUES[0];
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

function chooseProblems(leagueId, count = 18) {
  const league = LEAGUES.find((item) => item.id === leagueId) || LEAGUES[0];
  const pool = problems.filter((problem) => league.tiers.includes(problem.tier));
  return pool
    .map((problem) => ({ problem, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map((item) => item.problem);
}

function startPractice() {
  const league = currentLeague();
  if (!isLeagueUnlocked(league)) {
    setFeedback("Euler Circle is locked. Enter the password first.", false);
    elements.eulerPassword.focus();
    return;
  }

  state.run = {
    problems: chooseProblems(league.id, league.id === "euler-circle" ? 22 : 18),
    index: 0,
    score: 0,
    streak: 0,
    startedAt: Date.now()
  };
  setFeedback("Run started.", true);
  elements.answerInput.value = "";
  elements.answerInput.focus();
  renderProblem();
  renderStats();
}

function finishRun() {
  const league = currentLeague();
  const oldBest = state.profile.bestScore || 0;
  state.profile.bestScore = Math.max(oldBest, state.run.score);
  state.profile.runs += 1;
  state.profile.xp += state.run.score + league.tiers.reduce((sum, tier) => sum + tier * 10, 0);
  state.profile.leagueWins[league.id] = (state.profile.leagueWins[league.id] || 0) + 1;
  saveActiveProfile();
  setFeedback(`Run complete. Final score: ${state.run.score}.`, true);
  state.run.problems = [];
  state.run.index = 0;
  renderProblem();
  renderStats();
  renderLeagues();
}

function handleAnswer(event) {
  event.preventDefault();
  const problem = activeProblem();
  if (!problem) {
    setFeedback("Start a practice run first.", false);
    return;
  }

  const correct = isCorrect(problem, elements.answerInput.value);
  if (correct) {
    state.run.streak += 1;
    state.run.score += 125 + state.run.streak * 20 + problem.tier * 12;
    state.run.index += 1;
    setFeedback("Correct.", true);
    if (state.run.index >= state.run.problems.length) {
      finishRun();
    }
  } else {
    state.run.streak = 0;
    state.run.score = Math.max(0, state.run.score - 25);
    setFeedback(`Not quite. ${problem.hint}`, false);
  }

  elements.answerInput.value = "";
  renderProblem();
  renderStats();
}

function activeProblem() {
  return state.run.problems[state.run.index] || null;
}

function renderProblem() {
  const league = currentLeague();
  const problem = activeProblem();
  elements.leagueLabel.textContent = league.name;

  if (!problem) {
    elements.problemTitle.textContent = isLeagueUnlocked(league) ? "Start a run" : "Locked league";
    elements.problemPretty.textContent = isLeagueUnlocked(league)
      ? "Choose a league, then start practice."
      : "Euler Circle requires a password.";
    elements.problemPrompt.textContent = "The prompt appears here.";
    elements.answerInput.placeholder = "Type TeX";
  } else {
    elements.problemTitle.textContent = problem.title;
    elements.problemPretty.textContent = problem.pretty;
    elements.problemPrompt.textContent = problem.prompt;
    elements.answerInput.placeholder = problem.answer;
  }

  elements.runProgress.textContent = `${state.run.index}/${state.run.problems.length}`;
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

function renderLeagues() {
  elements.leagueGrid.innerHTML = LEAGUES.map((league) => {
    const wins = state.profile ? state.profile.leagueWins[league.id] || 0 : 0;
    const unlocked = isLeagueUnlocked(league);
    const progress = Math.min(100, Math.max(4, wins * 18 + Math.floor((state.profile?.xp || 0) / 750)));
    return `
      <article class="league-card ${unlocked ? "" : "is-locked"}">
        <div class="league-top">
          <div>
            <p class="eyebrow">${unlocked ? "Open" : "Locked"}</p>
            <h3>${league.name}</h3>
          </div>
          <span class="badge" style="background:${league.accent}">${league.badge}</span>
        </div>
        <p>${league.brief}</p>
        <div class="meter" style="--meter:${league.accent};--progress:${progress}%"><span></span></div>
        <p>${wins} completed runs · tiers ${league.tiers.join(", ")}</p>
      </article>
    `;
  }).join("");
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
  renderLeagueSelect();
  renderProblem();
  renderStats();
  renderLeagues();
  renderDatabaseOptions();
  renderDatabase();
}

function setFeedback(message, good) {
  elements.feedbackText.textContent = message;
  elements.feedbackText.classList.toggle("is-good", Boolean(good));
  elements.feedbackText.classList.toggle("is-bad", !good);
}

function setTab(tab) {
  elements.tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  elements.panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === `${tab}-panel`));
}

function unlockEuler() {
  if (elements.eulerPassword.value.trim() !== EULER_ACCESS_CODE) {
    setFeedback("Wrong Euler Circle password.", false);
    return;
  }
  state.profile.unlockedEuler = true;
  saveActiveProfile();
  elements.eulerPassword.value = "";
  renderLeagueSelect();
  renderLeagues();
  setFeedback("Euler Circle unlocked.", true);
}

function showHint() {
  const problem = activeProblem();
  setFeedback(problem ? problem.hint : "Start a run first.", Boolean(problem));
}

function resetProgress() {
  state.profile = emptyProfile();
  saveActiveProfile();
  state.run = { problems: [], index: 0, score: 0, streak: 0, startedAt: null };
  renderApp();
  setFeedback("Progress reset.", true);
}

function tickClock() {
  if (!state.run.startedAt || !state.run.problems.length) {
    elements.roundClock.textContent = "00:00";
    return;
  }
  const seconds = Math.floor((Date.now() - state.run.startedAt) / 1000);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  elements.roundClock.textContent = `${minutes}:${rest}`;
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
    state.run = { problems: [], index: 0, score: 0, streak: 0, startedAt: null };
    renderLockPanel();
    renderProblem();
    renderStats();
  });
  elements.unlockEuler.addEventListener("click", unlockEuler);
  elements.practiceStart.addEventListener("click", startPractice);
  elements.answerForm.addEventListener("submit", handleAnswer);
  elements.hintButton.addEventListener("click", showHint);
  elements.resetProfile.addEventListener("click", resetProgress);
  elements.problemSearch.addEventListener("input", renderDatabase);
  elements.categoryFilter.addEventListener("change", renderDatabase);
}

bindEvents();
restoreSession();
setInterval(tickClock, 250);
