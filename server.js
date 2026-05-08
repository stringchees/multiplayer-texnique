"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { createProblemBank, LEAGUES } = require("./public/problem-bank.js");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
const PUBLIC_DIR = path.join(__dirname, "public");
const PROBLEMS = createProblemBank();
const problemsById = new Map(PROBLEMS.map((problem) => [problem.id, problem]));
const rooms = new Map();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function normalizeAnswer(value) {
  let normalized = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\\[dt]frac/g, "\\frac")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\[,!;:]/g, "");

  for (let pass = 0; pass < 3; pass += 1) {
    normalized = normalized
      .replace(/\\operatorname\*?\{([^{}]+)\}/g, "$1")
      .replace(/\\(?:mathrm|textrm|text|mathnormal)\{([^{}]+)\}/g, "$1")
      .replace(/\\(?:sin|cos|tan|log|ln|lim|det|ker|dim|deg|max|min|sup|inf|gcd|hom|tr)\b/g, (operator) =>
        operator.slice(1)
      )
      .replace(/\\frac\{([^{}]+)\}([A-Za-z0-9])/g, "\\frac{$1}{$2}")
      .replace(/\\frac([A-Za-z0-9])\{([^{}]+)\}/g, "\\frac{$1}{$2}")
      .replace(/\\frac([A-Za-z0-9])([A-Za-z0-9])/g, "\\frac{$1}{$2}")
      .replace(/\\sqrt([A-Za-z0-9])/g, "\\sqrt{$1}")
      .replace(/([_^])\{([A-Za-z0-9])\}/g, "$1$2");
  }

  return normalized;
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 5; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return rooms.has(code) ? makeRoomCode() : code;
}

function sanitizeRoomCode(code) {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function getRoom(code) {
  const roomCode = sanitizeRoomCode(code) || makeRoomCode();
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      code: roomCode,
      createdAt: Date.now(),
      phase: "lobby",
      leagueId: "leibniz",
      round: 0,
      startedAt: null,
      problemIds: [],
      players: new Map(),
      clients: new Set()
    });
  }
  return rooms.get(roomCode);
}

function serializeRoom(room) {
  const players = Array.from(room.players.values()).map((player) => ({
    id: player.id,
    name: player.name,
    score: player.score,
    streak: player.streak,
    misses: player.misses,
    currentIndex: player.currentIndex,
    ready: player.ready,
    finishedAt: player.finishedAt,
    lastResult: player.lastResult
  }));

  return {
    code: room.code,
    phase: room.phase,
    leagueId: room.leagueId,
    round: room.round,
    startedAt: room.startedAt,
    problemIds: room.problemIds,
    problems: room.problemIds.map((id) => problemsById.get(id)).filter(Boolean),
    players: players.sort((a, b) => b.score - a.score || a.finishedAt - b.finishedAt),
    serverTime: Date.now()
  };
}

function sendRoom(room) {
  const payload = `event: state\ndata: ${JSON.stringify(serializeRoom(room))}\n\n`;
  for (const client of room.clients) {
    client.write(payload);
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function pickProblems(leagueId, count = 12) {
  const league = LEAGUES.find((item) => item.id === leagueId) || LEAGUES[0];
  const allowed = PROBLEMS.filter((problem) => league.tiers.includes(problem.tier));
  const pool = allowed.length >= count ? allowed : PROBLEMS;
  return pool
    .map((problem) => ({ problem, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(({ problem }) => problem.id);
}

function startRound(room, leagueId) {
  room.phase = "race";
  room.leagueId = leagueId || room.leagueId;
  room.round += 1;
  room.startedAt = Date.now();
  room.problemIds = pickProblems(room.leagueId);
  for (const player of room.players.values()) {
    player.score = 0;
    player.streak = 0;
    player.misses = 0;
    player.currentIndex = 0;
    player.finishedAt = null;
    player.lastResult = null;
    player.ready = false;
  }
}

function checkAnswer(problem, answer) {
  const normalized = normalizeAnswer(answer);
  const validAnswers = [problem.answer, ...(problem.aliases || [])].map(normalizeAnswer);
  return validAnswers.includes(normalized);
}

function submitAnswer(room, playerId, answer) {
  const player = room.players.get(playerId);
  if (!player || room.phase !== "race" || player.finishedAt) {
    return { ok: false, reason: "Round is not active for this player." };
  }

  const problemId = room.problemIds[player.currentIndex];
  const problem = problemsById.get(problemId);
  if (!problem) {
    return { ok: false, reason: "No problem is active." };
  }

  const correct = checkAnswer(problem, answer);
  if (correct) {
    const elapsed = Math.max(0, Date.now() - room.startedAt);
    const speedBonus = Math.max(0, 40 - Math.floor(elapsed / 2500));
    player.streak += 1;
    player.score += 100 + player.streak * 15 + speedBonus;
    player.currentIndex += 1;
    player.lastResult = { correct: true, at: Date.now(), answer };
    if (player.currentIndex >= room.problemIds.length) {
      player.finishedAt = Date.now();
    }
  } else {
    player.streak = 0;
    player.misses += 1;
    player.score = Math.max(0, player.score - 18);
    player.lastResult = { correct: false, at: Date.now(), answer };
  }

  const everyoneDone = Array.from(room.players.values()).every((item) => item.finishedAt);
  if (everyoneDone && room.players.size > 0) {
    room.phase = "finished";
  }

  return { ok: true, correct };
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=3600"
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (request.method === "GET" && url.pathname === "/api/problems") {
      sendJson(response, 200, { problems: PROBLEMS, leagues: LEAGUES });
      return;
    }

    if (parts[0] === "api" && parts[1] === "rooms") {
      const room = getRoom(parts[2]);

      if (request.method === "GET" && parts[3] === "events") {
        response.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no"
        });
        room.clients.add(response);
        response.write(`event: state\ndata: ${JSON.stringify(serializeRoom(room))}\n\n`);
        request.on("close", () => {
          room.clients.delete(response);
        });
        return;
      }

      if (request.method === "POST" && parts[3] === "join") {
        const body = await readJson(request);
        const id = makeId("p");
        const name = String(body.name || "Player").trim().slice(0, 24) || "Player";
        room.players.set(id, {
          id,
          name,
          score: 0,
          streak: 0,
          misses: 0,
          currentIndex: 0,
          ready: true,
          finishedAt: null,
          lastResult: null
        });
        sendRoom(room);
        sendJson(response, 200, { playerId: id, room: serializeRoom(room) });
        return;
      }

      if (request.method === "POST" && parts[3] === "start") {
        const body = await readJson(request);
        startRound(room, body.leagueId);
        sendRoom(room);
        sendJson(response, 200, { room: serializeRoom(room) });
        return;
      }

      if (request.method === "POST" && parts[3] === "submit") {
        const body = await readJson(request);
        const result = submitAnswer(room, body.playerId, body.answer);
        sendRoom(room);
        sendJson(response, result.ok ? 200 : 400, result);
        return;
      }

      if (request.method === "POST" && parts[3] === "leave") {
        const body = await readJson(request);
        room.players.delete(body.playerId);
        if (room.players.size === 0) {
          room.phase = "lobby";
          room.problemIds = [];
        }
        sendRoom(room);
        sendJson(response, 200, { ok: true });
        return;
      }
    }

    serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.on("error", (error) => {
  console.error(`Could not start TeXnique Arena on ${HOST}:${PORT}: ${error.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`TeXnique Arena running at http://${HOST}:${PORT}`);
});
