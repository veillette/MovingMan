/**
 * PlayAreaNode.ts
 *
 * The 2-D play scene the man inhabits: sky and ground, brick walls just inside the ±10 m
 * ends, a meter ruler, a clock readout, and the man himself. Used by both the Introduction
 * and Charts screens (with different sizes — Charts uses a more compact version).
 *
 * The node is laid out in its own local coordinate system spanning (0, 0) … (width, height),
 * with the ground line and ruler computed from the given proportions. The horizontal
 * transform reserves an edge inset so the ±10 m ends sit inside the play area, leaving room
 * for the walls and keeping the man on-screen at the ends. Children are clipped to the
 * play-area rectangle.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Image, LinearGradient, Node, Rectangle, type TColor, Text } from "scenerystack/scenery";
import { PhetFont, RulerNode } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import MovingManColors from "../../MovingManColors.js";
import cottageImage from "../images/cottage.gif";
import treeImage from "../images/tree.png";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";
import { LinearTransform } from "./LinearTransform.js";
import { MovingManSpriteNode } from "./MovingManSpriteNode.js";

const { HALF_CONTAINER_WIDTH } = MovingManConstants;

// Fraction of the height occupied by sky vs. ground.
const SKY_FRACTION = 0.62;

// Wall geometry: the brick column rises this fraction of the play-area height.
const WALL_HEIGHT_FRACTION = 0.46;

// Ruler.
const RULER_HEIGHT = 36;
const RULER_INSET_BELOW_GROUND = 6;
// Must be strictly less than RULER_HEIGHT / 2, which RulerNode asserts.
const RULER_MAJOR_TICK_HEIGHT = 16;
const RULER_FONT = new PhetFont(11);
const RULER_UNITS_FONT = new PhetFont(10);

// Clock readout.
const CLOCK_FONT = new PhetFont({ size: 14, weight: "bold" });
const CLOCK_MARGIN = 8;

// Background scenery (tree on the left, cottage on the right), as fractions of height,
// standing on the ground line. Native art is tree 109×100, cottage 100×88.
const TREE_HEIGHT_FRACTION = 0.42;
const COTTAGE_HEIGHT_FRACTION = 0.36;
const TREE_MODEL_X = -7.3;
const COTTAGE_MODEL_X = 7;

export type PlayAreaNodeOptions = {
  width: number;
  height: number;
  /** Set true to use a smaller man and a more compact clock layout (Charts screen). */
  compact?: boolean;
};

export class PlayAreaNode extends Node {
  public readonly linearTransform: LinearTransform;

  public constructor(model: MovingManModel, options: PlayAreaNodeOptions) {
    super();

    const { width, height, compact = false } = options;

    // Reserve a margin so the ±10 m ends — and the brick walls and the man at them —
    // sit inside the play area rather than flush against its clipped edges.
    const edgeInset = compact ? 26 : 38;
    const wallThickness = edgeInset - 6;

    const transform = new LinearTransform(width, edgeInset);
    this.linearTransform = transform;

    // Clip everything to the play-area rectangle so e.g. very long acceleration vectors
    // do not bleed into surrounding chrome.
    this.clipArea = Shape.rectangle(0, 0, width, height);

    const skyHeight = height * SKY_FRACTION;
    const groundLineY = skyHeight;
    const groundHeight = height - skyHeight;

    const sky = new Rectangle(0, 0, width, skyHeight, {
      fill: new LinearGradient(0, 0, 0, skyHeight)
        .addColorStop(0, MovingManColors.skyTopProperty)
        .addColorStop(1, MovingManColors.skyBottomProperty),
    });
    const ground = new Rectangle(0, groundLineY, width, groundHeight, {
      fill: MovingManColors.groundProperty,
      stroke: MovingManColors.groundStrokeProperty,
      lineWidth: 1,
    });

    // Brick walls just inside the ±10 m ends, hidden when toggled off. They rise from the
    // ground line and stand in the reserved edge margins.
    const wallHeight = height * WALL_HEIGHT_FRACTION;
    const leftWall = PlayAreaNode.createBrickWall(wallThickness, wallHeight);
    leftWall.right = transform.modelToViewX(-HALF_CONTAINER_WIDTH);
    leftWall.bottom = groundLineY;
    const rightWall = PlayAreaNode.createBrickWall(wallThickness, wallHeight);
    rightWall.left = transform.modelToViewX(HALF_CONTAINER_WIDTH);
    rightWall.bottom = groundLineY;
    model.wallsEnabledProperty.link((enabled) => {
      leftWall.visible = enabled;
      rightWall.visible = enabled;
    });

    // Meter ruler running the full track, just below the ground line.
    const labels: string[] = [];
    for (let i = -HALF_CONTAINER_WIDTH; i <= HALF_CONTAINER_WIDTH; i++) {
      // Label only every 2 m to match the original sim's ruler markings.
      labels.push(i % 2 === 0 ? String(i) : "");
    }
    const rulerWidth = transform.pixelsPerMeter * (2 * HALF_CONTAINER_WIDTH);
    const ruler = new RulerNode(rulerWidth, RULER_HEIGHT, transform.pixelsPerMeter, labels, "m", {
      majorTickFont: RULER_FONT,
      unitsFont: RULER_UNITS_FONT,
      majorTickHeight: RULER_MAJOR_TICK_HEIGHT,
      minorTicksPerMajorTick: 0,
      insetsWidth: 0,
      x: transform.modelToViewX(-HALF_CONTAINER_WIDTH),
      y: groundLineY + RULER_INSET_BELOW_GROUND,
    });

    // Background scenery standing on the ground line, behind the man.
    const tree = PlayAreaNode.createScenery(treeImage, height * TREE_HEIGHT_FRACTION, 109, 100);
    tree.centerX = transform.modelToViewX(TREE_MODEL_X);
    tree.bottom = groundLineY + 2;
    const cottage = PlayAreaNode.createScenery(cottageImage, height * COTTAGE_HEIGHT_FRACTION, 100, 88);
    cottage.centerX = transform.modelToViewX(COTTAGE_MODEL_X);
    cottage.bottom = groundLineY + 2;

    // The man stands with his feet on the ground line.
    const manHeight = compact ? 82 : 150;
    const man = new MovingManSpriteNode(model, { transform, feetY: groundLineY, manHeight });

    // Clock readout, top-left of the play area.
    const clock = new ClockReadout(model.timeProperty, compact);
    clock.left = CLOCK_MARGIN;
    clock.top = CLOCK_MARGIN;

    this.children = [sky, ground, tree, cottage, leftWall, rightWall, ruler, man, clock];
  }

  /**
   * A background image scaled to the given target height (px). The native pixel size is
   * passed so bounds are known immediately (the image itself loads asynchronously).
   */
  private static createScenery(url: string, targetHeight: number, nativeWidth: number, nativeHeight: number): Node {
    return new Image(url, {
      scale: targetHeight / nativeHeight,
      initialWidth: nativeWidth,
      initialHeight: nativeHeight,
    });
  }

  /**
   * A vector brick wall of the given size: staggered courses of bricks over a mortar
   * background, with a soft top highlight on each course. Drawn at (0, 0)…(width, height)
   * and clipped to a rounded rectangle, so callers position it with the usual layout setters.
   */
  private static createBrickWall(width: number, height: number): Node {
    const node = new Node();
    const brickFill: TColor = MovingManColors.wallFillProperty;
    const mortarFill: TColor = MovingManColors.wallMortarProperty;
    const outline: TColor = MovingManColors.wallStrokeProperty;

    const courseHeight = Math.max(7, height / 9);
    const mortar = 2;
    const brickWidth = width * 0.56;
    const highlight = "rgba(255,255,255,0.18)";

    node.addChild(new Rectangle(0, 0, width, height, { fill: mortarFill }));

    let course = 0;
    for (let y = mortar; y < height - 1; y += courseHeight + mortar) {
      const h = Math.min(courseHeight, height - mortar - y);
      if (h <= 1) {
        break;
      }
      // Alternate courses are offset by half a brick for the running-bond look.
      const startX = (course % 2 === 0 ? 0 : -brickWidth / 2) - brickWidth;
      for (let x = startX; x < width; x += brickWidth) {
        const bx = Math.max(0, x + mortar / 2);
        const bw = Math.min(x + brickWidth - mortar / 2, width) - bx;
        if (bw <= 0) {
          continue;
        }
        node.addChild(new Rectangle(bx, y, bw, h, { fill: brickFill }));
        node.addChild(new Rectangle(bx, y, bw, Math.max(1, h * 0.3), { fill: highlight }));
      }
      course++;
    }

    // Rounded outline + clip so the courses read as one tidy wall.
    node.clipArea = Shape.roundRectangle(0, 0, width, height, 3, 3);
    node.addChild(new Rectangle(0, 0, width, height, { stroke: outline, lineWidth: 1.5, cornerRadius: 3 }));
    return node;
  }
}

class ClockReadout extends Node {
  public constructor(timeProperty: TReadOnlyProperty<number>, compact: boolean) {
    super();
    const clockStrings = StringManager.getInstance().getClockStrings();
    const units = clockStrings.secondsStringProperty;

    const valueFont = new PhetFont({ size: compact ? 12 : 14, weight: "bold" });
    const value = new Text("", { font: valueFont, fill: MovingManColors.foregroundColorProperty });

    const updateValue = (): void => {
      value.string = `${timeProperty.value.toFixed(1)} ${units.value}`;
    };
    timeProperty.link(updateValue);
    units.link(updateValue);

    // The full readout includes a "Time:" label; the compact form just shows the value.
    const content = new Node();
    if (compact) {
      content.addChild(value);
    } else {
      const label = new Text(clockStrings.timeStringProperty, {
        font: CLOCK_FONT,
        fill: MovingManColors.foregroundColorProperty,
      });
      value.left = label.right + 6;
      value.centerY = label.centerY;
      content.children = [label, value];
    }

    // Background pill so the readout stays legible over the sky gradient.
    const padding = 5;
    const bounds = content.bounds.dilated(padding);
    const background = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height, {
      fill: "rgba(255,255,255,0.7)",
      cornerRadius: 4,
    });

    this.children = [background, content];
  }
}
