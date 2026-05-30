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
  cursor inside each chart. Each chart sits in a collapsible box with its own
  value-axis zoom; a shared control zooms the time axis of all three at once.

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

- The original's free-form **"use function"** formula entry is replaced by an
  **x(t) preset menu** (an `x(t):` combo box on both screens) offering linear,
  parabolic, sinusoidal, and root functions; SceneryStack has no built-in text input.
  Choosing one drives position from the function (velocity/acceleration are the usual
  derivatives) and disables the position control; "Off" restores slider/drag control.
- **Collision sound effects** play a thud plus a random grunt on each wall hit
  (tambo `SoundClip`s driven by the model's `collideEmitter`); toggle them with the
  navigation-bar sound button.
- Cosmetic: the man is drawn with vector shapes (not the original sprite) but his
  legs stride while walking and he leans on a wall hit; the original tree and cottage
  art stand on the ground. The easter-egg cloud animation is not included.
