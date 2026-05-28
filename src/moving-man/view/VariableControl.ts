/**
 * VariableControl.ts
 *
 * A control row for one of the three kinematic quantities. Combines:
 *   - a title in the variable's color (bolded when this is the driving quantity),
 *   - a NumberControl (slider + number display + arrow buttons) for direct manipulation,
 *   - and, for velocity and acceleration, a checkbox toggling the on-man vector arrow.
 *
 * Picking up the slider, typing in the display, or tapping the arrow buttons all set
 * the corresponding driving quantity ("position-driven", etc.) on the man, matching
 * the behavior of the original simulation.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { NumberProperty } from "scenerystack/axon";
import { Dimension2, type Range } from "scenerystack/dot";
import { type Node, type TColor, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, Panel } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import MovingManColors from "../../MovingManColors.js";
import { MotionStrategy } from "../model/MotionStrategy.js";
import type { MovingManModel } from "../model/MovingManModel.js";

const TITLE_FONT_SIZE = 14;
const TITLE_FONT_BOLD = new PhetFont({ size: TITLE_FONT_SIZE, weight: "bold" });
const TITLE_FONT_NORMAL = new PhetFont(TITLE_FONT_SIZE);
const LABEL_FONT = new PhetFont(12);
const PANEL_CORNER_RADIUS = 6;
const PANEL_X_MARGIN = 8;
const PANEL_Y_MARGIN = 6;
const PANEL_VSPACING = 4;
const NUMBER_CONTROL_DELTA = 0.1;

export type VariableControlKind = "position" | "velocity" | "acceleration";

export type VariableControlOptions = {
  kind: VariableControlKind;
  range: Range;
  /** Slider track width in px. */
  sliderWidth?: number;
  /** Decimal places shown in the read-out. */
  decimalPlaces?: number;
};

export class VariableControl extends Panel {
  public constructor(model: MovingManModel, options: VariableControlOptions) {
    const { kind, range, sliderWidth = 240, decimalPlaces = 2 } = options;
    const bundle = VariableControl.resolveBundle(model, kind);

    const titleText = new Text("", { font: TITLE_FONT_NORMAL, fill: bundle.color });
    const updateTitle = (): void => {
      titleText.string = `${bundle.titleStringProperty.value} (${bundle.unitStringProperty.value})`;
    };
    bundle.titleStringProperty.link(updateTitle);
    bundle.unitStringProperty.link(updateTitle);

    // ── Two-property "lock" pattern ──────────────────────────────────────────
    // The NumberControl is bidirectionally bound to a clamped controlProperty so
    // the slider and display never go out of range. A flag tells the model→control
    // link to update silently (avoiding a feedback loop), and a flag on the
    // control→model link distinguishes user input from these silent updates.
    const controlProperty = new NumberProperty(VariableControl.clampToRange(bundle.modelProperty.value, range));
    let suppressModelUpdate = false;
    let suppressControlUpdate = false;

    bundle.modelProperty.link((value) => {
      if (suppressControlUpdate) {
        return;
      }
      suppressModelUpdate = true;
      controlProperty.value = VariableControl.clampToRange(value, range);
      suppressModelUpdate = false;
    });

    controlProperty.lazyLink((value) => {
      if (suppressModelUpdate) {
        return;
      }
      suppressControlUpdate = true;
      bundle.applyUserChange(value);
      suppressControlUpdate = false;
    });

    // Bold the title when this variable is currently driving the man.
    model.movingMan.motionStrategyProperty.link((strategy) => {
      titleText.font = strategy === bundle.strategy ? TITLE_FONT_BOLD : TITLE_FONT_NORMAL;
    });

    const numberControl = new NumberControl(titleText, controlProperty, range, {
      delta: NUMBER_CONTROL_DELTA,
      layoutFunction: NumberControl.createLayoutFunction1({
        align: "center",
        ySpacing: 2,
      }),
      numberDisplayOptions: {
        decimalPlaces,
        textOptions: { font: LABEL_FONT },
      },
      sliderOptions: {
        trackSize: new Dimension2(sliderWidth, 4),
        thumbSize: new Dimension2(14, 22),
      },
      titleNodeOptions: { font: TITLE_FONT_NORMAL },
    });

    const children: Node[] = [numberControl];
    if (bundle.vectorVisibleProperty && bundle.vectorLabelStringProperty) {
      children.push(VariableControl.makeVectorCheckbox(bundle.vectorVisibleProperty, bundle.vectorLabelStringProperty));
    }

    const content = new VBox({ align: "center", spacing: PANEL_VSPACING, children });

    super(content, {
      fill: MovingManColors.panelFillProperty,
      stroke: MovingManColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
    });
  }

  private static resolveBundle(
    model: MovingManModel,
    kind: VariableControlKind,
  ): {
    titleStringProperty: TReadOnlyProperty<string>;
    unitStringProperty: TReadOnlyProperty<string>;
    color: TColor;
    modelProperty: NumberProperty;
    strategy: MotionStrategy;
    vectorVisibleProperty: Property<boolean> | null;
    vectorLabelStringProperty: TReadOnlyProperty<string> | null;
    applyUserChange: (value: number) => void;
  } {
    const strings = StringManager.getInstance();
    const q = strings.getQuantityStrings();
    const u = strings.getUnitStrings();
    const v = strings.getVectorStrings();
    const man = model.movingMan;
    switch (kind) {
      case "position":
        return {
          titleStringProperty: q.positionStringProperty,
          unitStringProperty: u.positionStringProperty,
          color: MovingManColors.positionProperty,
          modelProperty: man.positionProperty,
          strategy: MotionStrategy.POSITION,
          vectorVisibleProperty: null,
          vectorLabelStringProperty: null,
          applyUserChange: (value) => {
            man.setPositionDriven();
            man.setMousePosition(value);
            man.positionProperty.value = value;
          },
        };
      case "velocity":
        return {
          titleStringProperty: q.velocityStringProperty,
          unitStringProperty: u.velocityStringProperty,
          color: MovingManColors.velocityProperty,
          modelProperty: man.velocityProperty,
          strategy: MotionStrategy.VELOCITY,
          vectorVisibleProperty: model.showVelocityVectorProperty,
          vectorLabelStringProperty: v.showVelocityStringProperty,
          applyUserChange: (value) => {
            man.setVelocityDriven();
            man.velocityProperty.value = value;
          },
        };
      case "acceleration":
        return {
          titleStringProperty: q.accelerationStringProperty,
          unitStringProperty: u.accelerationStringProperty,
          color: MovingManColors.accelerationProperty,
          modelProperty: man.accelerationProperty,
          strategy: MotionStrategy.ACCELERATION,
          vectorVisibleProperty: model.showAccelerationVectorProperty,
          vectorLabelStringProperty: v.showAccelerationStringProperty,
          applyUserChange: (value) => {
            man.setAccelerationDriven();
            man.accelerationProperty.value = value;
          },
        };
    }
  }

  private static makeVectorCheckbox(
    visibleProperty: Property<boolean>,
    labelStringProperty: TReadOnlyProperty<string>,
  ): Node {
    const label = new Text(labelStringProperty, { font: LABEL_FONT, fill: MovingManColors.foregroundColorProperty });
    return new Checkbox(visibleProperty, label, { boxWidth: 14 });
  }

  private static clampToRange(value: number, range: Range): number {
    if (value < range.min) {
      return range.min;
    }
    if (value > range.max) {
      return range.max;
    }
    return value;
  }
}
