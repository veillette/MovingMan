/**
 * MovingManSpriteNode.ts
 *
 * The iconic Moving Man: the photographic figure (black suit, sunglasses) from the
 * original PhET Java sim, rendered as a Scenery sprite. He stands when at rest and
 * switches to a mid-stride walking frame when moving, facing the direction of travel,
 * with a springy footstep bob, a ground shadow, and a comedic lean-and-recover when he
 * bonks a wall. Velocity (red) and acceleration (green) arrows float above his head.
 *
 * Drop-in replacement for the old vector man — identical public constructor signature
 * and reactive behaviour (position tracking, facing direction, arrow overlays, drag).
 */

import { Shape } from "scenerystack/kite";
import { DragListener, Image, Node, Path } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { Animation, Easing } from "scenerystack/twixt";
import MovingManColors from "../../MovingManColors.js";
import walkingImageUrl from "../images/man-left.gif";
import standingImageUrl from "../images/man-standing.gif";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";
import type { LinearTransform } from "./LinearTransform.js";

const { VELOCITY_SCALE, ACCELERATION_SCALE } = MovingManConstants;

// Native pixel sizes of the source art (feet flush with the bottom edge).
const STANDING_NATIVE = { width: 150, height: 401 };
const WALKING_NATIVE = { width: 150, height: 331 };

// Speed (m/s) above which the man faces his direction of travel and switches to the
// walking frame. Below it he stands still and keeps his last facing.
const FACING_THRESHOLD = 0.1;
const WALK_THRESHOLD = 0.25;

// ── Footstep bob ────────────────────────────────────────────────────────────────
// Peak rise (as a fraction of the man's height), the speed (m/s) at which the bob
// reaches full amplitude, and the step cadence (rad/s).
const BOB_FRACTION = 0.035;
const WALK_REF_SPEED = 6;
const WALK_CADENCE = 9;

// ── Crash wobble ──────────────────────────────────────────────────────────────────
// Lean angle (rad) on a wall hit, eased back to upright over this many seconds.
const CRASH_LEAN = 0.2;
const CRASH_DURATION = 0.5;

const ARROW_GAP_ABOVE_HEAD = 18;
const ARROW_STACK_GAP = 18;

const ARROW_OPTIONS = {
  headHeight: 12,
  headWidth: 14,
  tailWidth: 5,
  stroke: null,
};

export type MovingManSpriteNodeOptions = {
  transform: LinearTransform;
  feetY: number;
  /** Target standing height of the figure, in view pixels. */
  manHeight: number;
};

export class MovingManSpriteNode extends Node {
  public constructor(model: MovingManModel, options: MovingManSpriteNodeOptions) {
    super({ cursor: "pointer" });

    const { transform, feetY, manHeight: h } = options;
    const man = model.movingMan;

    // Both frames share one pixels-per-native-pixel scale so the figure keeps a
    // consistent size; the walking pose is naturally a little shorter (bent stride).
    const scale = h / STANDING_NATIVE.height;
    const figureWidth = STANDING_NATIVE.width * scale;

    const standing = new Image(standingImageUrl, {
      scale,
      initialWidth: STANDING_NATIVE.width,
      initialHeight: STANDING_NATIVE.height,
    });
    // The walking art faces left; mirroring the whole figure makes him face right.
    const walking = new Image(walkingImageUrl, {
      scale,
      initialWidth: WALKING_NATIVE.width,
      initialHeight: WALKING_NATIVE.height,
    });
    for (const frame of [standing, walking]) {
      frame.centerX = 0;
      frame.bottom = 0;
    }
    walking.visible = false;

    // The figure (frames only) lives in its own child so it can be mirrored, bobbed and
    // tilted without disturbing the shadow or the arrows.
    const figure = new Node({ children: [standing, walking] });

    // Soft ground shadow, kept on the ground (outside the bobbing figure).
    const shadow = new Path(Shape.ellipse(0, 0, figureWidth * 0.42, figureWidth * 0.12, 0), {
      fill: "rgba(0,0,0,0.22)",
      y: -2,
    });

    // Arrows sit above the head (head top is at -h in local coords).
    const velocityArrow = new ArrowNode(0, 0, 0, 0, { ...ARROW_OPTIONS, fill: MovingManColors.velocityProperty });
    const accelerationArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: MovingManColors.accelerationProperty,
    });
    const velocityArrowY = -h - ARROW_GAP_ABOVE_HEAD;
    const accelerationArrowY = velocityArrowY - ARROW_STACK_GAP;

    this.children = [shadow, figure, velocityArrow, accelerationArrow];
    this.y = feetY;

    man.positionProperty.link((position) => {
      this.x = transform.modelToViewX(position);
    });

    // ── Facing + walk/stand frame selection ──────────────────────────────────────
    let facing = 1; // +1 faces left (native walking art), -1 faces right
    man.velocityProperty.link((velocity) => {
      if (velocity > FACING_THRESHOLD) {
        facing = -1; // moving right -> mirror the left-facing art
      } else if (velocity < -FACING_THRESHOLD) {
        facing = 1; // moving left -> art as drawn
      }
      figure.setScaleMagnitude(facing, 1);

      const walkingNow = Math.abs(velocity) > WALK_THRESHOLD;
      walking.visible = walkingNow;
      standing.visible = !walkingNow;

      MovingManSpriteNode.updateArrow(
        velocityArrow,
        velocity,
        VELOCITY_SCALE,
        transform.pixelsPerMeter,
        velocityArrowY,
      );
    });

    man.accelerationProperty.link((acceleration) => {
      MovingManSpriteNode.updateArrow(
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

    // ── Footstep bob: a springy rise synced to the stride while moving ────────────
    const maxBob = BOB_FRACTION * h;
    let walkPhase = 0;
    let lastTime = model.timeProperty.value;
    model.timeProperty.link((time) => {
      const dt = time - lastTime;
      lastTime = time;
      // Only advance the stride for forward play (ignore rewinds / scrubs / resets).
      if (dt > 0 && dt < 0.5) {
        const speedFraction = Math.min(Math.abs(man.velocityProperty.value) / WALK_REF_SPEED, 1);
        walkPhase += dt * WALK_CADENCE;
        const rise = speedFraction * maxBob * Math.abs(Math.sin(walkPhase));
        figure.y = -rise;
        // The shadow tightens as he springs up off the ground.
        const shadowScale = 1 - 0.4 * (rise / maxBob || 0);
        shadow.setScaleMagnitude(shadowScale, shadowScale);
      }
    });

    // ── Crash: lean on a wall hit, then ease back upright ─────────────────────────
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
        easing: Easing.CUBIC_OUT,
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
}
