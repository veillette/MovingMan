/**
 * LinearTransform.ts
 *
 * The 1-D model↔view mapping for the play area: model x (meters, 0 at track center)
 * to view x (pixels). Shared by the play-area scene, the man, the walls and the ruler.
 */

import MovingManConstants from "../model/MovingManConstants.js";

export class LinearTransform {
  public readonly pixelsPerMeter: number;
  public readonly centerX: number;

  public constructor(viewWidth: number) {
    this.pixelsPerMeter = viewWidth / MovingManConstants.CONTAINER_WIDTH;
    this.centerX = viewWidth / 2;
  }

  public modelToViewX(modelX: number): number {
    return this.centerX + modelX * this.pixelsPerMeter;
  }

  public viewToModelX(viewX: number): number {
    return (viewX - this.centerX) / this.pixelsPerMeter;
  }
}
