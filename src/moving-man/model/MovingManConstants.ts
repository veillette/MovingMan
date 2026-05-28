/**
 * MovingManConstants.ts
 *
 * Numeric physics and layout constants, ported from the original HTML5 Moving Man
 * (itself a port of the PhET "Moving Man" Java sim). Colors live in MovingManColors;
 * user-facing strings live in StringManager.
 */

import { Range } from "scenerystack/dot";

const MovingManConstants = {
  // The track runs from -HALF_CONTAINER_WIDTH to +HALF_CONTAINER_WIDTH meters.
  CONTAINER_WIDTH: 20,
  HALF_CONTAINER_WIDTH: 10,

  // Longest stretch of motion that the Charts screen records / plays back, in seconds.
  MAX_TIME: 20,

  // The model advances on a fixed internal timestep. The original derivative workaround
  // notes a "dt*2 = 80 ms" centering error, i.e. dt = 40 ms (25 fps). Every derivative /
  // integration step is calibrated around this dt, so we substep instead of using the
  // (variable) real frame dt.
  FIXED_DT: 0.04,
  MAX_CATCHUP_STEPS: 10,

  // ── Derivative / sampling tuning (from PhET) ─────────────────────────────────
  // Number of recent mouse samples averaged to smooth pointer-driven position.
  NUMBER_MOUSE_POINTS_TO_AVERAGE: 4,
  // Half-window of the centered least-squares derivative.
  DERIVATIVE_RADIUS: 1,
  // Fixed-size queues used to compute centered derivatives.
  SERIES_SIZE_LIMIT: 6,
  // Time-limited graph series only retain points up to MAX_TIME seconds.
  SERIES_TIME_LIMIT: 20,
  // How many recent frame times the man remembers (for the centered-derivative lookup).
  NUM_TIME_POINTS_TO_RECORD: 10,

  // ── View arrow scaling (from PhET; tuned so the arrows read well on screen) ───
  VELOCITY_SCALE: 0.2,
  ACCELERATION_SCALE: 0.8,

  // ── Control ranges ───────────────────────────────────────────────────────────
  POSITION_RANGE: new Range(-10, 10),
  VELOCITY_RANGE: new Range(-16, 16),
  ACCELERATION_RANGE: new Range(-60, 60),
  PLAYBACK_SPEED_RANGE: new Range(0.2, 4),

  // ── Chart y-axis ranges (from the original Charts tab) ───────────────────────
  POSITION_CHART_RANGE: new Range(-10, 10),
  VELOCITY_CHART_RANGE: new Range(-12, 12),
  ACCELERATION_CHART_RANGE: new Range(-60, 60),
} as const;

export default MovingManConstants;
