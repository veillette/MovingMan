/**
 * MovingManNode.ts
 *
 * The draggable man, drawn as a simple cartoon figure with vector shapes, plus the
 * velocity (red) and acceleration (green) arrows that float above his head. Dragging
 * him horizontally makes him position-driven, exactly as in the original sim.
 */

import { Circle, DragListener, Line, Node, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { Animation, Easing } from "scenerystack/twixt";
import MovingManColors from "../../MovingManColors.js";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";
import type { LinearTransform } from "./LinearTransform.js";

const { VELOCITY_SCALE, ACCELERATION_SCALE } = MovingManConstants;

// Velocity above which the figure flips to face the direction of travel.
const FACING_THRESHOLD = 0.1;

// ── Walking animation ─────────────────────────────────────────────────────────
// Foot swing (as a fraction of figure height) at full stride, the speed (m/s) at which
// the stride reaches full amplitude, and the leg cadence (rad/s of the swing phase).
const MAX_FOOT_SWING_FRACTION = 0.07;
const WALK_REF_SPEED = 4;
const WALK_CADENCE = 11;

// ── Crash wobble ──────────────────────────────────────────────────────────────
// Lean angle (rad) on a wall hit, eased back to upright over this many seconds.
const CRASH_LEAN = 0.22;
const CRASH_DURATION = 0.45;

// Vertical gap (px) between the head and the first (velocity) arrow, and between arrows.
const ARROW_GAP_ABOVE_HEAD = 16;
const ARROW_STACK_GAP = 18;

const ARROW_OPTIONS = {
  headHeight: 12,
  headWidth: 14,
  tailWidth: 5,
  stroke: null,
};

export type MovingManNodeOptions = {
  transform: LinearTransform;
  feetY: number;
  manHeight: number;
};

export class MovingManNode extends Node {
  public constructor(model: MovingManModel, options: MovingManNodeOptions) {
    super({ cursor: "pointer" });

    const { transform, feetY, manHeight: h } = options;
    const man = model.movingMan;

    // The drawn figure (in local coords: feet at origin, body rising along -y).
    // Kept in its own child so it can be mirrored without flipping the arrows.
    const { figure, leftLeg, rightLeg, leftFootX, rightFootX } = MovingManNode.createFigure(h);

    const headTopY = -0.99 * h;
    const velocityArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: MovingManColors.velocityProperty,
    });
    const accelerationArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: MovingManColors.accelerationProperty,
    });
    const velocityArrowY = headTopY - ARROW_GAP_ABOVE_HEAD;
    const accelerationArrowY = velocityArrowY - ARROW_STACK_GAP;

    this.children = [figure, velocityArrow, accelerationArrow];

    this.y = feetY;

    // Position follows the model.
    man.positionProperty.link((position) => {
      this.x = transform.modelToViewX(position);
    });

    // Face the direction of motion.
    man.velocityProperty.link((velocity) => {
      if (velocity > FACING_THRESHOLD) {
        figure.setScaleMagnitude(1, 1);
      } else if (velocity < -FACING_THRESHOLD) {
        figure.setScaleMagnitude(-1, 1);
      }
      MovingManNode.updateArrow(velocityArrow, velocity, VELOCITY_SCALE, transform.pixelsPerMeter, velocityArrowY);
    });

    man.accelerationProperty.link((acceleration) => {
      MovingManNode.updateArrow(
        accelerationArrow,
        acceleration,
        ACCELERATION_SCALE,
        transform.pixelsPerMeter,
        accelerationArrowY,
      );
    });

    model.showVelocityVectorProperty.link((visible) => {
      velocityArrow.visible = visible;
    });
    model.showAccelerationVectorProperty.link((visible) => {
      accelerationArrow.visible = visible;
    });

    // ── Walking: swing the legs while moving, scaled by speed ────────────────────
    const maxSwing = MAX_FOOT_SWING_FRACTION * h;
    let walkPhase = 0;
    let lastTime = model.timeProperty.value;
    model.timeProperty.link((time) => {
      const dt = time - lastTime;
      lastTime = time;
      // Ignore rewinds / scrubs / resets (only advance the stride for forward play).
      if (dt > 0 && dt < 0.5) {
        const speedFraction = Math.min(Math.abs(man.velocityProperty.value) / WALK_REF_SPEED, 1);
        walkPhase += dt * WALK_CADENCE;
        const stride = speedFraction * maxSwing * Math.sin(walkPhase);
        leftLeg.x2 = leftFootX + stride;
        rightLeg.x2 = rightFootX - stride;
      }
    });

    // ── Crash: lean on a wall hit, then ease back upright ────────────────────────
    let crashAnimation: Animation | null = null;
    man.collideEmitter.addListener(() => {
      crashAnimation?.stop();
      figure.rotation = man.positionProperty.value >= 0 ? CRASH_LEAN : -CRASH_LEAN;
      crashAnimation = new Animation({
        setValue: (r: number) => {
          figure.rotation = r;
        },
        getValue: () => figure.rotation,
        to: 0,
        duration: CRASH_DURATION,
        easing: Easing.QUADRATIC_OUT,
      });
      crashAnimation.start();
    });

    // Dragging the man drives him from position (and, on the Charts screen, records).
    this.addInputListener(
      new DragListener({
        start: () => {
          man.setPositionDriven();
          if (!(model.noRecording || model.recordingProperty.value)) {
            model.record();
          }
          if (!model.isPlayingProperty.value) {
            model.play();
          }
        },
        drag: (event) => {
          const localX = this.globalToParentPoint(event.pointer.point).x;
          man.setMousePosition(transform.viewToModelX(localX));
          man.setPositionDriven();
        },
      }),
    );
  }

  /** Lay the (possibly zero-length) arrow horizontally from the man's center. */
  private static updateArrow(arrow: ArrowNode, value: number, scale: number, ppm: number, y: number): void {
    const length = Math.abs(value) * scale * ppm;
    if (length < 1) {
      arrow.setTailAndTip(0, y, 0, y);
    } else {
      arrow.setTailAndTip(0, y, Math.sign(value) * length, y);
    }
  }

  private static createFigure(h: number): {
    figure: Node;
    leftLeg: Line;
    rightLeg: Line;
    leftFootX: number;
    rightFootX: number;
  } {
    const figure = new Node();

    const skin = MovingManColors.manSkinProperty;
    const shirt = MovingManColors.manFillProperty;
    const outline = MovingManColors.manStrokeProperty;

    const hipY = -0.42 * h;
    const shoulderY = -0.78 * h;
    const headCenterY = -0.88 * h;
    const headRadius = 0.12 * h;
    const limbWidth = 0.06 * h;
    const torsoWidth = 0.2 * h;

    // Legs (drawn slightly apart, mid-stride). The feet (x2) swing while walking.
    const legOptions = { stroke: outline, lineWidth: limbWidth, lineCap: "round" as const };
    const leftFootX = -0.09 * h;
    const rightFootX = 0.09 * h;
    const leftLeg = new Line(-0.02 * h, hipY, leftFootX, 0, legOptions);
    const rightLeg = new Line(0.02 * h, hipY, rightFootX, 0, legOptions);
    figure.addChild(leftLeg);
    figure.addChild(rightLeg);

    // Torso (the shirt).
    figure.addChild(
      new Rectangle(-torsoWidth / 2, shoulderY, torsoWidth, hipY - shoulderY, {
        cornerRadius: torsoWidth / 3,
        fill: shirt,
        stroke: outline,
        lineWidth: 1,
      }),
    );

    // Arms.
    const armOptions = { stroke: skin, lineWidth: limbWidth, lineCap: "round" as const };
    figure.addChild(new Line(-0.04 * h, shoulderY + 0.02 * h, -0.16 * h, hipY, armOptions));
    figure.addChild(new Line(0.04 * h, shoulderY + 0.02 * h, 0.18 * h, shoulderY + 0.12 * h, armOptions));

    // Head.
    figure.addChild(new Circle(headRadius, { y: headCenterY, fill: skin, stroke: outline, lineWidth: 1 }));

    return { figure, leftLeg, rightLeg, leftFootX, rightFootX };
  }
}
