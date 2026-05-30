/**
 * FunctionComboBox.ts
 *
 * A labelled dropdown for choosing a preset position-vs-time function x(t) that drives
 * the man (see model/functionPresets.ts). "Off" returns control to the sliders / drag.
 * Stands in for the original sim's free-form formula entry, which is impractical without
 * a native text input in SceneryStack.
 */

import { HBox, type Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ComboBox } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import MovingManColors from "../../MovingManColors.js";
import type { MovingManFunctionPreset } from "../model/functionPresets.js";
import { FUNCTION_PRESETS } from "../model/functionPresets.js";
import type { MovingManModel } from "../model/MovingManModel.js";

const LABEL_FONT = new PhetFont({ size: 13, weight: "bold" });
const ITEM_FONT = new PhetFont(13);

export class FunctionComboBox extends HBox {
  /**
   * @param model
   * @param listParent - a Node high in the scene graph; the open list renders into it
   *                     so it sits above neighbouring controls.
   */
  public constructor(model: MovingManModel, listParent: Node, listPosition: "above" | "below" = "below") {
    const items: { value: MovingManFunctionPreset | null; createNode: () => Node; tandemName: string }[] = [
      {
        value: null,
        createNode: () => new Text("Off", { font: ITEM_FONT, fill: MovingManColors.foregroundColorProperty }),
        tandemName: "offItem",
      },
      ...FUNCTION_PRESETS.map((preset, index) => ({
        value: preset as MovingManFunctionPreset | null,
        createNode: () => new Text(preset.labelString, { font: ITEM_FONT, fill: MovingManColors.positionProperty }),
        tandemName: `preset${index}Item`,
      })),
    ];

    const comboBox = new ComboBox<MovingManFunctionPreset | null>(model.movingMan.functionProperty, items, listParent, {
      tandem: Tandem.OPT_OUT,
      listPosition,
      xMargin: 8,
      yMargin: 4,
    });

    super({
      spacing: 6,
      children: [new Text("x(t):", { font: LABEL_FONT, fill: MovingManColors.positionProperty }), comboBox],
    });
  }
}
