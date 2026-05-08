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

Default Euler Circle password for this build:

```text
euler1736
```

## Deploy To GitHub Pages

This repo includes `.github/workflows/pages.yml`. Push the repo to GitHub with GitHub Pages enabled for Actions, and the workflow deploys the `public/` folder as the website.

```sh
git init
git add .
git commit -m "Build TeXnique Leagues"
git branch -M main
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
```
