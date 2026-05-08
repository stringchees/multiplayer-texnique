# TeXnique Leagues

A TeX practice website with local login, named leagues, a locked Euler Circle league, ranked runs, live rooms, and a large advanced problem database.

## Run Locally

```sh
npm start
```

Then open http://127.0.0.1:4173.

The local Node server serves the app and powers live multiplayer rooms.

## Leagues

- Leibniz League
- Gauss League
- Galois League
- Newton League
- Euclid League
- Euler Circle, locked by password

Practice sets are unranked. Use each league's **Start Ranked Run** button to record leaderboard scores.

Euler Circle password for this build:

```text
eulercircle
```

## Live Multiplayer

Live 1v1 and group rooms work when the local Node server is running:

```sh
npm start
```

Open the served URL, sign in, use the Multiplayer tab, and share the room code.

## Deploy To Render

This repo includes `render.yaml`, so Render can deploy the live Node server and static frontend together.

1. Push this repo to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Connect `stringchees/multiplayer-texnique`.
4. Render will read `render.yaml` and create the `multiplayer-texnique` web service.
5. After deploy, use the Render URL for the full app and live rooms.

The service uses:

- Build command: `npm install`
- Start command: `npm start`
- Host: `0.0.0.0`
- Port: Render's `PORT` environment variable

## Deploy To GitHub Pages

GitHub Pages can host the static practice app, but not live rooms. The static site is published from the `gh-pages` branch. In GitHub, open `Settings -> Pages`, set source to `Deploy from a branch`, and choose `gh-pages` / `/root`.

```sh
git init
git add .
git commit -m "Build TeXnique Leagues"
git branch -M main
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```
