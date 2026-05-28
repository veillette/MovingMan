/**
 * MovingMan.ts
 *
 * The man who moves along the 1-D track. He keeps position, velocity and acceleration
 * and updates them from the currently driving quantity (the MotionStrategy):
 *   - POSITION-driven: pointer/slider sets position; v and a are differentiated.
 *   - VELOCITY-driven: slider sets velocity; position is integrated, a differentiated.
 *   - ACCELERATION-driven: slider sets acceleration; v and position are integrated.
 *
 * Ported faithfully from the original moving-man.js. Backbone attributes become axon
 * Properties and the model's `trigger('collide')` becomes the collideEmitter.
 */

import { Emitter, NumberProperty, Property } from "scenerystack/axon";
import { type DataPoint, type DataSeries, LimitedSizeDataSeries, LimitedTimeDataSeries } from "./DataSeries.js";
import { MotionStrategy } from "./MotionStrategy.js";
import MovingManConstants from "./MovingManConstants.js";
import { estimateDerivative } from "./motionMath.js";

const {
  NUMBER_MOUSE_POINTS_TO_AVERAGE,
  DERIVATIVE_RADIUS,
  SERIES_SIZE_LIMIT,
  SERIES_TIME_LIMIT,
  NUM_TIME_POINTS_TO_RECORD,
} = MovingManConstants;

/** Below this magnitude the differentiated value wiggles around ±1e-12, so snap to 0. */
const ZERO_THRESHOLD = 1e-6;

/** What the man needs to know about the surrounding simulation. */
export interface ManContext {
  readonly wallsEnabled: boolean;
  readonly halfContainerWidth: number;
  isPaused(): boolean;
}

type WallResult = { position: number; collided: boolean };

/** Snapshot of the man's instantaneous state, stored for playback. */
export type ManState = {
  position: number;
  velocity: number;
  acceleration: number;
  motionStrategy: MotionStrategy;
};

export class MovingMan {
  public readonly positionProperty = new NumberProperty(0);
  public readonly velocityProperty = new NumberProperty(0);
  public readonly accelerationProperty = new NumberProperty(0);
  public readonly motionStrategyProperty = new Property<MotionStrategy>(MotionStrategy.POSITION);

  public readonly collideEmitter = new Emitter();
  public readonly historyClearedEmitter = new Emitter();

  // Rolling windows used to estimate centered derivatives.
  private readonly mouseDataSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);
  private readonly positionModelSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);
  private readonly velocityModelSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);
  private readonly accelerationModelSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);

  // The series displayed on the Charts screen.
  public readonly positionGraphSeries: DataSeries;
  public readonly velocityGraphSeries: DataSeries;
  public readonly accelerationGraphSeries: DataSeries;

  private readonly context: ManContext;
  private time = 0;
  private times: number[] = [];
  private mousePosition = 0;
  private readonly wallResult: WallResult = { position: 0, collided: false };

  public constructor(context: ManContext, noRecording: boolean) {
    this.context = context;

    if (noRecording) {
      this.positionGraphSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);
      this.velocityGraphSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);
      this.accelerationGraphSeries = new LimitedSizeDataSeries(SERIES_SIZE_LIMIT);
    } else {
      this.positionGraphSeries = new LimitedTimeDataSeries(SERIES_TIME_LIMIT);
      this.velocityGraphSeries = new LimitedTimeDataSeries(SERIES_TIME_LIMIT);
      this.accelerationGraphSeries = new LimitedTimeDataSeries(SERIES_TIME_LIMIT);
    }
  }

  // ── Motion-strategy helpers ───────────────────────────────────────────────────

  public get positionDriven(): boolean {
    return this.motionStrategyProperty.value === MotionStrategy.POSITION;
  }

  public get velocityDriven(): boolean {
    return this.motionStrategyProperty.value === MotionStrategy.VELOCITY;
  }

  public get accelerationDriven(): boolean {
    return this.motionStrategyProperty.value === MotionStrategy.ACCELERATION;
  }

  public setPositionDriven(): void {
    this.motionStrategyProperty.value = MotionStrategy.POSITION;
  }

  public setVelocityDriven(): void {
    this.motionStrategyProperty.value = MotionStrategy.VELOCITY;
  }

  public setAccelerationDriven(): void {
    this.motionStrategyProperty.value = MotionStrategy.ACCELERATION;
  }

  // ── History management ────────────────────────────────────────────────────────

  public clear(): void {
    this.time = 0;
    this.times.length = 0;
    this.setMousePosition(this.positionProperty.value);

    this.mouseDataSeries.clear();
    this.positionModelSeries.clear();
    this.velocityModelSeries.clear();
    this.accelerationModelSeries.clear();
    this.positionGraphSeries.clear();
    this.velocityGraphSeries.clear();
    this.accelerationGraphSeries.clear();

    this.historyClearedEmitter.emit();
  }

  public clearHistoryAfter(time: number): void {
    this.times.length = 0;

    this.mouseDataSeries.clearPointsAfter(time);
    this.positionModelSeries.clearPointsAfter(time);
    this.velocityModelSeries.clearPointsAfter(time);
    this.accelerationModelSeries.clearPointsAfter(time);
    this.positionGraphSeries.clearPointsAfter(time);
    this.velocityGraphSeries.clearPointsAfter(time);
    this.accelerationGraphSeries.clearPointsAfter(time);

    this.historyClearedEmitter.emit();
  }

  public getState(): ManState {
    return {
      position: this.positionProperty.value,
      velocity: this.velocityProperty.value,
      acceleration: this.accelerationProperty.value,
      motionStrategy: this.motionStrategyProperty.value,
    };
  }

  public applyState(time: number, state: ManState): void {
    this.time = time;
    this.times = [];
    this.positionProperty.value = state.position;
    this.velocityProperty.value = state.velocity;
    this.accelerationProperty.value = state.acceleration;
    this.motionStrategyProperty.value = state.motionStrategy;
    this.setMousePosition(state.position);
  }

  // ── Stepping ──────────────────────────────────────────────────────────────────

  public update(time: number, delta: number): void {
    this.time = time;

    this.times.push(this.time);
    if (this.times.length > NUM_TIME_POINTS_TO_RECORD) {
      this.times.shift();
    }

    if (this.positionDriven) {
      this.updateFromPosition(time);
    } else if (this.velocityDriven) {
      this.updateFromVelocity(time, delta);
    } else if (this.accelerationDriven) {
      this.updateFromAcceleration(time, delta);
    }
  }

  private updateFromPosition(time: number): void {
    const previousPosition = this.positionProperty.value;

    this.mouseDataSeries.add(this.clampIfWalled(this.mousePosition).position, time);

    // Average of the latest pointer samples.
    const positions = this.mouseDataSeries.getPointsInRange(
      this.mouseDataSeries.size() - NUMBER_MOUSE_POINTS_TO_AVERAGE,
      this.mouseDataSeries.size(),
    );
    let sum = 0;
    for (const point of positions) {
      sum += point.value;
    }
    const x = positions.length > 0 ? sum / positions.length : 0;
    const position = this.clampIfWalled(x).position;
    this.positionModelSeries.add(position, time);

    // Differentiate position → velocity → acceleration.
    this.velocityModelSeries.setData(this.estimatedCenteredDerivatives(this.positionModelSeries));
    this.accelerationModelSeries.setData(this.estimatedCenteredDerivatives(this.velocityModelSeries));

    // We read midpoints from the sampling windows to obtain centered derivatives.
    // Per PhET, this makes the readouts lag by up to 2*dt; the reported time is
    // substituted so the graphs still line up with the current time.
    const time1StepsAgo = this.getTimeNTimeStepsAgo(1);
    const time2StepsAgo = this.getTimeNTimeStepsAgo(2);

    this.positionGraphSeries.add(position, time);
    this.velocityGraphSeries.addPoint(this.getPointAtTime(this.velocityModelSeries, time1StepsAgo, time));
    this.accelerationGraphSeries.addPoint(this.getPointAtTime(this.accelerationModelSeries, time2StepsAgo, time));

    this.positionProperty.value = position;
    this.velocityProperty.value = this.snapToZero(this.velocityGraphSeries.getLastPoint()?.value ?? 0);
    this.accelerationProperty.value = this.snapToZero(this.accelerationGraphSeries.getLastPoint()?.value ?? 0);

    if (!this.hitsWall(previousPosition) && this.hitsWall(this.positionProperty.value)) {
      this.collideEmitter.emit();
    }
  }

  private updateFromVelocity(time: number, delta: number): void {
    // So switching to pointer mode won't remember a stale location.
    this.mouseDataSeries.clear();

    const velocity = this.velocityProperty.value;
    this.velocityModelSeries.add(velocity, time);
    this.velocityGraphSeries.add(velocity, time);

    this.accelerationModelSeries.setData(this.estimatedCenteredDerivatives(this.velocityModelSeries));
    const accelerationMid = this.accelerationModelSeries.getMidPoint();
    if (accelerationMid) {
      this.accelerationGraphSeries.addPoint(accelerationMid);
    }

    const wallResult = this.clampIfWalled(this.positionProperty.value + velocity * delta);
    this.positionModelSeries.add(wallResult.position, time);
    this.positionGraphSeries.add(wallResult.position, time);

    this.setMousePosition(wallResult.position);
    this.positionProperty.value = wallResult.position;
    this.accelerationProperty.value = this.snapToZero(this.accelerationGraphSeries.getLastPoint()?.value ?? 0);

    if (wallResult.collided) {
      this.velocityProperty.value = 0;
      this.collideEmitter.emit();
    }
  }

  private updateFromAcceleration(time: number, delta: number): void {
    this.mouseDataSeries.clear();

    const acceleration = this.accelerationProperty.value;
    const newVelocity = this.velocityProperty.value + acceleration * delta;
    const estVelocity = (this.velocityProperty.value + newVelocity) / 2;
    const wallResult = this.clampIfWalled(this.positionProperty.value + estVelocity * delta);

    // A deceleration spike when crashing into a wall: switch to velocity-driven and
    // rerun the step so the wall stops the man rather than the acceleration carrying on.
    if (wallResult.collided) {
      this.setVelocityDriven();
      this.velocityProperty.value = newVelocity;
      this.update(time - delta, delta);
      return;
    }

    this.accelerationModelSeries.add(acceleration, time);
    this.accelerationGraphSeries.add(acceleration, time);

    this.velocityGraphSeries.add(newVelocity, time);
    this.velocityModelSeries.add(newVelocity, time);
    this.positionGraphSeries.add(wallResult.position, time);
    this.positionModelSeries.add(wallResult.position, time);

    this.setMousePosition(wallResult.position);
    this.positionProperty.value = wallResult.position;
    this.velocityProperty.value = newVelocity;

    if (wallResult.collided) {
      this.velocityProperty.value = 0;
      this.accelerationProperty.value = 0;
    }
  }

  // ── Pointer input ─────────────────────────────────────────────────────────────

  public setMousePosition(x: number): void {
    if (this.mousePosition !== x) {
      this.mousePosition = this.clampIfWalled(x).position;
      if (this.context.isPaused()) {
        this.positionProperty.value = this.mousePosition;
      }
    }
  }

  public getMousePosition(): number {
    return this.mousePosition;
  }

  // ── Walls ─────────────────────────────────────────────────────────────────────

  /** Clamp x to the walls (if enabled), reporting whether a collision occurred. */
  public clampIfWalled(x: number): WallResult {
    this.wallResult.position = x;
    this.wallResult.collided = false;

    if (this.context.wallsEnabled) {
      const half = this.context.halfContainerWidth;
      if (x < -half) {
        this.wallResult.position = -half;
        this.wallResult.collided = true;
      } else if (x > half) {
        this.wallResult.position = half;
        this.wallResult.collided = true;
      }
    }
    return this.wallResult;
  }

  private hitsWall(x: number): boolean {
    return -this.context.halfContainerWidth === x || this.context.halfContainerWidth === x;
  }

  // ── Derivative bookkeeping ────────────────────────────────────────────────────

  private snapToZero(value: number): number {
    return Math.abs(value) < ZERO_THRESHOLD ? 0 : value;
  }

  /**
   * Look up the point in `series` whose time equals lookupTime, returning a copy
   * stamped with reportedTime. If no exact match exists (shouldn't happen with the
   * fixed timestep), fall back to the most recent point.
   */
  private getPointAtTime(series: DataSeries, lookupTime: number, reportedTime: number): DataPoint {
    for (let i = 0; i < series.size(); i++) {
      const point = series.getPoint(i);
      if (point && point.time === lookupTime) {
        return { value: point.value, time: reportedTime };
      }
    }
    return { value: series.getLastPoint()?.value ?? 0, time: reportedTime };
  }

  /** Centered least-squares derivative of every point in the series. */
  private estimatedCenteredDerivatives(series: DataSeries): DataPoint[] {
    const radius = DERIVATIVE_RADIUS;
    const points: DataPoint[] = [];
    for (let i = 0; i < series.size(); i++) {
      const range = series.getPointsInRange(i - radius, i + radius);
      points.push({
        value: estimateDerivative(range),
        time: (series.getPoint(i) as DataPoint).time,
      });
    }
    return points;
  }

  private getTimeNTimeStepsAgo(n: number): number {
    let index = this.times.length - 1 - n;
    if (index < 0) {
      index = this.times.length - 1;
    }
    return this.times[index] ?? this.time;
  }
}
