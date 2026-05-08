# TeXnique Leagues

A static TeX practice website with a landing screen, working local login, named leagues, a locked Euler Circle league, and a large advanced problem database.

## Run Locally

```sh
npm start
```

Then open http://127.0.0.1:4173.

The hosted GitHub Pages app is static and uses browser storage for login/progress. The local Node server remains only as a tiny static server/API sandbox.

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

Open the served URL, sign in, use the Multiplayer tab, and share the room code. GitHub Pages is static, so it can host practice, login, progress, league leaderboards, and the database, but it cannot run the live room server by itself.

## Deploy To GitHub Pages

The static site is published from the `gh-pages` branch. In GitHub, open `Settings -> Pages`, set source to `Deploy from a branch`, and choose `gh-pages` / `/root`.

```sh
git init
git add .
git commit -m "Build TeXnique Leagues"
git branch -M main
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```
