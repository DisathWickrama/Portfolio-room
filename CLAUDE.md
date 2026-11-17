# Portfolio Room — project rules

Disath's portfolio as an interactive 3D lo-fi bedroom at 2am.

## Stack

- **Three.js** (WebGL scene, post-processing from `three/examples/jsm`)
- **Vite** (dev server + build, `base: './'` so it runs under any GitHub Pages path)
- **TypeScript** (strict; `npm run build` type-checks before bundling)
- **Web Audio API** for all sound (no audio files)
- Plain DOM + CSS for UI overlays (terminal, HUD, panels). No UI framework.

## Hard rules

1. **All models are built in code.** Geometry comes from Three.js primitives and
   helpers in `src/scene/`. No `.glb`/`.obj`/downloaded meshes.
2. **No copyrighted assets.** No downloaded textures, fonts, samples, logos, or
   characters. Textures are drawn on `<canvas>`; audio is synthesised. The
   terminal's "90s mecha emergency UI" look is a *style* only — never use names,
   logos, quotes or characters from any existing anime or franchise.
3. **Small commits.** One feature or fix per commit, pushed right after. Message
   says what changed and why.
4. **Explain the architecture as you go.** Each module starts with a short
   header comment saying what it owns and how it connects to the rest. Keep the
   folder map below in sync when files move.
5. **Content lives in one place.** Portfolio text (about, skills, projects,
   contact) is only in `src/data/portfolio.ts`. The terminal and the posters
   both read from it.
6. **Mobile must keep working.** Anything expensive (bloom, shadows, high pixel
   ratio) goes through `src/core/quality.ts`. Every hotspot must also be
   reachable from the HUD buttons (no hover-only interactions).

## Commands

```bash
npm install        # once
npm run dev        # dev server with HMR
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ locally
```

Deploy: pushing to the deploy branch runs `.github/workflows/deploy.yml`, which
builds and publishes `dist/` to GitHub Pages.

## Folder map

```
index.html              page shell: canvas mount + UI overlay roots
src/
  main.ts               composition root: builds everything and runs the frame loop
  style.css             HUD, panels, intro and terminal styling
  data/
    portfolio.ts        ALL portfolio content (about, skills, projects, contact)
  core/                 engine-level systems, no scene knowledge
    quality.ts          device detection -> quality tier (mobile fallback)
    post.ts             render pipeline: bloom + film grain/vignette
    cameraRig.ts        eased camera: home view, focus views, pointer parallax
    interactions.ts     raycast hotspots: hover, click/tap, highlight
  scene/                everything you can see; each file builds one thing
    kit.ts              low-poly helpers (box, cyl, flat materials, canvas textures)
    room.ts             floor, walls, window frame, furniture
    cityView.ts         Sydney skyline backdrop (canvas) + falling rain outside
    windowRain.ts       rain-on-glass shader
    dayNight.ts         lighting rig + day/night blend
    props/
      crt.ts            CRT monitor with live canvas screen
      lamp.ts           desk lamp + warm light
      mug.ts            mug + steam
      cat.ts            sleeping cat (breathing)
      vinyl.ts          record player (spins with the music)
      posters.ts        project posters drawn on canvas
  audio/
    engine.ts           shared AudioContext + master bus
    lofi.ts             generative lo-fi beat sequencer
    rain.ts             ambient rain noise
  ui/
    hud.ts              top bar toggles, hints, back button, quick-nav
    panels.ts           project (poster) panel and vinyl player panel
    terminal.ts         full-screen retro command terminal
```

## Architecture in one paragraph

`main.ts` is the only file that knows about everything. It builds the scene
from `scene/*` builders (each returns a `THREE.Group` plus an optional
`update(time, dt)`), registers clickable objects with `core/interactions.ts`,
and maps each hotspot to a camera view in `core/cameraRig.ts` and a UI action
in `ui/*`. State flows one way: user input -> `main.ts` handlers -> scene /
audio / UI modules. Modules never import each other sideways (UI does not
import scene, scene does not import audio); they expose small methods and
callbacks that `main.ts` wires together.

## Conventions

- Units are metres. Room interior is 6 (x) by 5 (z), walls 3.2 high; +y up;
  the camera sits in the open +x/+z corner looking at the back-left corner.
- Low-poly look: `flatShading` materials, few segments, colours from `kit.ts`.
- Emissive things that should bloom use bright `MeshBasicMaterial` colours.
- Never start audio before a user gesture (the intro "enter" button unlocks it).
