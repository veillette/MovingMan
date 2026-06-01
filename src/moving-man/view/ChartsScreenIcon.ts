/**
 * ChartsScreenIcon.ts
 *
 * Home-screen / navigation-bar icon for the Charts screen: three stacked plots —
 * position (blue), velocity (red), and acceleration (green) — over a light grid,
 * echoing the screen's quantity-vs-time graphs.
 *
 * The curves form a physically faithful derivative chain for sinusoidal motion:
 * position = sin, velocity = d/dt(position) = cos, acceleration = d/dt(velocity) = -sin.
 * So velocity peaks where position is steepest, each curve crosses zero where the one
 * above it turns around, and acceleration mirrors position (a = -ω²x).
 */

import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle, type TColor } from "scenerystack/scenery";
import { Screen, ScreenIcon, type ScreenIconOptions } from "scenerystack/sim";
import MovingManColors from "../../MovingManColors.js";

const ICON_WIDTH = Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width;
const ICON_HEIGHT = Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height;

const PADDING = 26;
const ROW_GAP = 14;
const CURVE_SAMPLES = 64;

// Oscillations spanning the row width. One full cycle keeps the phase relationship
// between the three curves easy to read.
const CYCLES = 1;

// One quantity row: a light grid (midline + verticals) with a colored curve on top.
// `shape(theta)` returns the curve value in [-1, 1] as a function of the phase angle,
// so the three rows can share one frequency and express the derivative chain.
function buildRow(width: number, height: number, color: TColor, shape: (theta: number) => number): Node {
  const baseline = height / 2;
  const amplitude = height * 0.34;

  const grid = new Shape();
  grid.moveTo(0, baseline).lineTo(width, baseline);
  const verticals = 4;
  for (let i = 1; i < verticals; i++) {
    const x = (width * i) / verticals;
    grid.moveTo(x, height * 0.12).lineTo(x, height * 0.88);
  }

  const curve = new Shape();
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const u = i / CURVE_SAMPLES;
    const x = u * width;
    const y = baseline - amplitude * shape(u * 2 * Math.PI * CYCLES);
    if (i === 0) {
      curve.moveTo(x, y);
    } else {
      curve.lineTo(x, y);
    }
  }

  return new Node({
    children: [
      new Path(grid, { stroke: MovingManColors.chartGridProperty, lineWidth: 1.5 }),
      new Path(curve, { stroke: color, lineWidth: 6, lineCap: "round", lineJoin: "round" }),
    ],
  });
}

function createIconNode(): Node {
  const card = new Rectangle(0, 0, ICON_WIDTH, ICON_HEIGHT, {
    fill: MovingManColors.chartBackgroundProperty,
    stroke: MovingManColors.chartBorderProperty,
    lineWidth: 2,
    cornerRadius: 10,
  });

  const plotWidth = ICON_WIDTH - 2 * PADDING;
  const rowHeight = (ICON_HEIGHT - 2 * PADDING - 2 * ROW_GAP) / 3;

  const specs = [
    { color: MovingManColors.positionProperty, shape: (t: number) => Math.sin(t) },
    { color: MovingManColors.velocityProperty, shape: (t: number) => Math.cos(t) },
    { color: MovingManColors.accelerationProperty, shape: (t: number) => -Math.sin(t) },
  ];

  const rows = specs.map((spec, i) => {
    const row = buildRow(plotWidth, rowHeight, spec.color, spec.shape);
    row.x = PADDING;
    row.y = PADDING + i * (rowHeight + ROW_GAP);
    return row;
  });

  return new Node({ children: [card, ...rows] });
}

export class ChartsScreenIcon extends ScreenIcon {
  public constructor(providedOptions?: ScreenIconOptions) {
    super(createIconNode(), {
      maxIconWidthProportion: 1,
      maxIconHeightProportion: 1,
      fill: MovingManColors.chartBackgroundProperty,
      ...providedOptions,
    });
  }
}
