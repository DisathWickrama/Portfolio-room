# Portfolio Room

Disath's portfolio as an interactive 3D lo-fi bedroom at 2am: rain on the
window, Sydney outside, a CRT that boots into a command terminal, posters that
are projects, and a record player that generates its own lo-fi beats.

**Live:** https://disathwickrama.github.io/Portfolio-room/

Three.js + Vite + TypeScript. Every model, texture and sound is generated in
code; there are no asset files.

```bash
npm install
npm run dev
```

- Edit portfolio text and projects in `src/data/portfolio.ts`.
- Project rules, folder map and architecture notes are in `CLAUDE.md`.
- Pushing to the deploy branch publishes to GitHub Pages
  (`.github/workflows/deploy.yml`).
