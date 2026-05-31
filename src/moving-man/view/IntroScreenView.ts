/**
 * IntroScreenView.ts
 *
 * The "Introduction" screen. A play area with the man, walls, and ruler on top; a row
 * of three quantity controls (Position, Velocity, Acceleration) below; a small Walls
 * checkbox; play/pause + Reset All controls bottom-right.
 *
 * No recording / playback chrome — that's reserved for the Charts screen, matching the
 * original sim's simplification of the Intro tab (see Deviations.md in the source).
 */

import { HBox, Node } from "scenerystack/scenery";
import { PlayPauseButton, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";
import { FunctionComboBox } from "./FunctionComboBox.js";
import { addCollisionSounds } from "./MovingManSounds.js";
import { PlayAreaNode } from "./PlayAreaNode.js";
import { VariableControl } from "./VariableControl.js";
import { WallsCheckbox } from "./WallsCheckbox.js";

const MARGIN = 14;
const PLAY_AREA_WIDTH = 980;
const PLAY_AREA_HEIGHT = 384;
const CONTROL_SLIDER_WIDTH = 240;
const PLAY_PAUSE_RADIUS = 28;

export type IntroScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

export class IntroScreenView extends ScreenView {
  public constructor(model: MovingManModel, providedOptions: IntroScreenViewOptions) {
    super(providedOptions);

    const layoutBounds = this.layoutBounds;

    addCollisionSounds(model.movingMan.collideEmitter);

    const playArea = new PlayAreaNode(model, { width: PLAY_AREA_WIDTH, height: PLAY_AREA_HEIGHT });

    const positionControl = new VariableControl(model, {
      kind: "position",
      range: MovingManConstants.POSITION_RANGE,
      sliderWidth: CONTROL_SLIDER_WIDTH,
    });
    const velocityControl = new VariableControl(model, {
      kind: "velocity",
      range: MovingManConstants.VELOCITY_RANGE,
      sliderWidth: CONTROL_SLIDER_WIDTH,
    });
    const accelerationControl = new VariableControl(model, {
      kind: "acceleration",
      range: MovingManConstants.ACCELERATION_RANGE,
      sliderWidth: CONTROL_SLIDER_WIDTH,
    });

    const controlsRow = new HBox({
      spacing: 18,
      align: "top",
      children: [positionControl, velocityControl, accelerationControl],
    });

    const wallsCheckbox = new WallsCheckbox(model);

    // The combo box's dropdown list renders into this parent so it sits above siblings;
    // it opens upward because the chooser now sits at the bottom of the screen.
    const comboListParent = new Node();
    const functionComboBox = new FunctionComboBox(model, comboListParent, "above");

    const playPauseButton = new PlayPauseButton(model.isPlayingProperty, { radius: PLAY_PAUSE_RADIUS });

    const resetAllButton = new ResetAllButton({
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });

    // ── Layout ───────────────────────────────────────────────────────────────
    playArea.centerX = layoutBounds.centerX;
    playArea.top = layoutBounds.minY + MARGIN;

    // Walls toggle tucked into the top-right corner of the sky, like the original sim.
    wallsCheckbox.right = playArea.right - 10;
    wallsCheckbox.top = playArea.top + 10;

    controlsRow.centerX = layoutBounds.centerX;
    controlsRow.top = playArea.bottom + 20;

    // Preset position-function chooser, bottom-left.
    functionComboBox.left = layoutBounds.minX + MARGIN;
    functionComboBox.bottom = layoutBounds.maxY - MARGIN;

    resetAllButton.right = layoutBounds.maxX - MARGIN;
    resetAllButton.bottom = layoutBounds.maxY - MARGIN;

    playPauseButton.right = resetAllButton.left - 3 * MARGIN;
    playPauseButton.centerY = resetAllButton.centerY;

    this.children = [
      playArea,
      wallsCheckbox,
      controlsRow,
      functionComboBox,
      playPauseButton,
      resetAllButton,
      comboListParent,
    ];
  }
}
