/**
 * ChartsScreenView.ts
 *
 * The "Charts" screen. A compact play area at the top, three quantity-vs-time charts
 * stacked below (each with its own slider control on the left), a record/playback
 * transport at the bottom, and Reset All in the bottom-right corner.
 *
 * On every frame we ask the bamboo chart nodes to refresh from the latest series
 * values; the cursor inside each chart follows the model time automatically.
 */

import type { Range } from "scenerystack/dot";
import { HBox, type Node, type TColor, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import MovingManColors from "../../MovingManColors.js";
import type { DataSeries } from "../model/DataSeries.js";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";
import { ChartNode } from "./ChartNode.js";
import { PlayAreaNode } from "./PlayAreaNode.js";
import { PlaybackControls } from "./PlaybackControls.js";
import { VariableControl, type VariableControlKind } from "./VariableControl.js";
import { WallsCheckbox } from "./WallsCheckbox.js";

const MARGIN = 10;

const PLAY_AREA_WIDTH = 900;
const PLAY_AREA_HEIGHT = 150;

const VARIABLE_CONTROL_SLIDER_WIDTH = 100;
const CHART_WIDTH = 660;
const CHART_HEIGHT = 100;
const ROW_SPACING = 4;

export type ChartsScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

export class ChartsScreenView extends ScreenView {
  private readonly chartNodes: ChartNode[] = [];

  public constructor(model: MovingManModel, providedOptions: ChartsScreenViewOptions) {
    super(providedOptions);

    const layoutBounds = this.layoutBounds;

    const playArea = new PlayAreaNode(model, { width: PLAY_AREA_WIDTH, height: PLAY_AREA_HEIGHT, compact: true });
    const wallsCheckbox = new WallsCheckbox(model);

    const positionRow = this.makeRow(model, {
      kind: "position",
      controlRange: MovingManConstants.POSITION_RANGE,
      chartRange: MovingManConstants.POSITION_CHART_RANGE,
      yStep: 5,
      color: MovingManColors.positionProperty,
      series: model.movingMan.positionGraphSeries,
    });
    const velocityRow = this.makeRow(model, {
      kind: "velocity",
      controlRange: MovingManConstants.VELOCITY_RANGE,
      chartRange: MovingManConstants.VELOCITY_CHART_RANGE,
      yStep: 6,
      color: MovingManColors.velocityProperty,
      series: model.movingMan.velocityGraphSeries,
    });
    const accelerationRow = this.makeRow(model, {
      kind: "acceleration",
      controlRange: MovingManConstants.ACCELERATION_RANGE,
      chartRange: MovingManConstants.ACCELERATION_CHART_RANGE,
      yStep: 30,
      color: MovingManColors.accelerationProperty,
      series: model.movingMan.accelerationGraphSeries,
    });

    const chartsColumn = new VBox({
      spacing: ROW_SPACING,
      align: "left",
      children: [positionRow, velocityRow, accelerationRow],
    });

    const playbackControls = new PlaybackControls(model);

    const resetAllButton = new ResetAllButton({
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });

    // ── Layout ───────────────────────────────────────────────────────────────
    playArea.left = layoutBounds.minX + MARGIN;
    playArea.top = layoutBounds.minY + MARGIN;

    wallsCheckbox.right = layoutBounds.maxX - MARGIN;
    wallsCheckbox.top = layoutBounds.minY + MARGIN;

    chartsColumn.left = layoutBounds.minX + MARGIN;
    chartsColumn.top = playArea.bottom + MARGIN;

    playbackControls.centerX = layoutBounds.centerX - 60;
    playbackControls.bottom = layoutBounds.maxY - MARGIN;

    resetAllButton.right = layoutBounds.maxX - MARGIN;
    resetAllButton.bottom = layoutBounds.maxY - MARGIN;

    this.children = [playArea, wallsCheckbox, chartsColumn, playbackControls, resetAllButton];
  }

  private makeRow(
    model: MovingManModel,
    spec: {
      kind: VariableControlKind;
      controlRange: Range;
      chartRange: Range;
      yStep: number;
      color: TColor;
      series: DataSeries;
    },
  ): Node {
    const control = new VariableControl(model, {
      kind: spec.kind,
      range: spec.controlRange,
      sliderWidth: VARIABLE_CONTROL_SLIDER_WIDTH,
      decimalPlaces: spec.kind === "acceleration" ? 1 : 2,
    });
    const chart = new ChartNode(model, model.timeProperty, {
      series: spec.series,
      color: spec.color,
      yRange: spec.chartRange,
      yStep: spec.yStep,
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
    });
    this.chartNodes.push(chart);
    return new HBox({ spacing: 12, align: "center", children: [control, chart] });
  }

  public override step(dt: number): void {
    super.step(dt);
    // Refresh the line plots from the latest model series.
    for (const chart of this.chartNodes) {
      chart.refresh();
    }
  }
}
