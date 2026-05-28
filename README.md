# Moving Man

A [SceneryStack](https://scenerystack.org) port of the **Moving Man** simulation.
Originally a PhET Java sim, then an HTML5 / Backbone port at
`simulations/moving-man`; this version rebuilds it in TypeScript on top of
SceneryStack, in the same architectural style as the LadyBug and RadioWaves ports.

## Screens

- **Introduction** — A man, two walls, and a ruler. Drag the man (or use the
  Position / Velocity / Acceleration sliders) to drive his motion. Toggle the
  velocity and acceleration vector arrows from the controls.
- **Charts** — Same play area, plus a stack of three time-series charts (one per
  quantity). Record motion, then scrub through it with a record/playback radio,
  rewind / play / step transport, playback-speed slider, and a click-to-seek
  cursor inside each chart.

## Scripts

```bash
npm install         # install dependencies
npm run dev         # start the Vite dev server
npm run build       # tsc + vite build
npm run preview     # preview the built site
npm run lint        # biome check
npm run check       # tsc --noEmit (both src and scripts)
npm run icons       # rasterize public/icons/icon.svg into the PWA icons
```

## Notable deviations from the original

- The **expression evaluator / "use function"** feature (typing a formula for the
  position-vs-time function) is omitted; SceneryStack does not provide a built-in
  text input. The three slider/spinner controls still drive position, velocity,
  and acceleration.
- **Collision sound effects** are omitted. The model still fires a `collideEmitter`,
  so wiring up tambo is a small follow-up.
- Cosmetic: the man is drawn with vector shapes instead of the original sprite,
  and the easter-egg cloud animation is not included.
