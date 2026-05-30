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

const MARGIN = 12;
const PLAY_AREA_WIDTH = 900;
const PLAY_AREA_HEIGHT = 320;
const CONTROL_SLIDER_WIDTH = 220;
const PLAY_PAUSE_RADIUS = 22;

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
      spacing: 12,
      align: "top",
      children: [positionControl, velocityControl, accelerationControl],
    });

    const wallsCheckbox = new WallsCheckbox(model);

    // The combo box's dropdown list renders into this parent so it sits above siblings.
    const comboListParent = new Node();
    const functionComboBox = new FunctionComboBox(model, comboListParent, "below");

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

    wallsCheckbox.right = layoutBounds.maxX - MARGIN;
    wallsCheckbox.top = playArea.top;

    controlsRow.centerX = layoutBounds.centerX;
    controlsRow.top = playArea.bottom + MARGIN;

    functionComboBox.left = controlsRow.left;
    functionComboBox.top = controlsRow.bottom + 2 * MARGIN;

    resetAllButton.right = layoutBounds.maxX - MARGIN;
    resetAllButton.bottom = layoutBounds.maxY - MARGIN;

    playPauseButton.right = resetAllButton.left - 2 * MARGIN;
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
