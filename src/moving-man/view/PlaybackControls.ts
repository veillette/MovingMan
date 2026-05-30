/**
 * PlaybackControls.ts
 *
 * The bottom-of-screen transport for the Charts screen: a Record/Playback radio,
 * rewind/play-pause/step transport buttons, a Clear button, and a Playback-Speed
 * slider. (Reset All lives in the screen view.)
 */

import { DerivedProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2 } from "scenerystack/dot";
import { HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, PlayPauseButton, StepBackwardButton, StepForwardButton } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, HSlider, TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import MovingManColors from "../../MovingManColors.js";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";

const LABEL_FONT = new PhetFont(13);
const SMALL_FONT = new PhetFont(10);

const RADIO_BUTTON_SPACING = 12;
const RADIO_BUTTON_RADIUS = 8;
const TRANSPORT_BUTTON_RADIUS = 16;
const PLAY_PAUSE_BUTTON_RADIUS = 20;
const CONTROLS_SPACING = 20;
const SPEED_SLIDER_WIDTH = 130;

function labelText(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: LABEL_FONT, fill: MovingManColors.foregroundColorProperty });
}

export class PlaybackControls extends HBox {
  public constructor(model: MovingManModel) {
    const playback = StringManager.getInstance().getPlaybackStrings();

    // ── Record / Playback radio bound to a side-effecting wrapper property ────
    // We can't bind the radio directly to recordingProperty because flipping it must
    // also run model.record() / model.stopRecording() (they pause and clear).
    const recordingChoiceProperty = new Property<boolean>(model.recordingProperty.value);
    model.recordingProperty.link((recording) => {
      recordingChoiceProperty.value = recording;
    });
    recordingChoiceProperty.lazyLink((choice) => {
      if (choice === model.recordingProperty.value) {
        return;
      }
      if (choice) {
        model.record();
      } else {
        model.stopRecording();
      }
    });

    const recordPlaybackGroup = new AquaRadioButtonGroup<boolean>(
      recordingChoiceProperty,
      [
        { value: true, createNode: () => labelText(playback.recordStringProperty) },
        { value: false, createNode: () => labelText(playback.playbackStringProperty) },
      ],
      {
        orientation: "horizontal",
        spacing: RADIO_BUTTON_SPACING,
        radioButtonOptions: { radius: RADIO_BUTTON_RADIUS, stroke: MovingManColors.foregroundColorProperty },
      },
    );

    const rewindButton = new StepBackwardButton({
      radius: TRANSPORT_BUTTON_RADIUS,
      listener: () => model.rewind(),
    });

    const playPauseButton = new PlayPauseButton(model.isPlayingProperty, { radius: PLAY_PAUSE_BUTTON_RADIUS });

    const stepForwardButton = new StepForwardButton({
      radius: TRANSPORT_BUTTON_RADIUS,
      enabledProperty: DerivedProperty.not(model.isPlayingProperty),
      listener: () => model.stepOnce(),
    });

    const clearButton = new TextPushButton(playback.clearStringProperty, {
      font: LABEL_FONT,
      listener: () => model.clear(),
    });

    // ── Speed slider ─────────────────────────────────────────────────────────
    const speedSlider = new HSlider(model.playbackSpeedProperty, MovingManConstants.PLAYBACK_SPEED_RANGE, {
      trackSize: new Dimension2(SPEED_SLIDER_WIDTH, 3),
    });
    // Tick labels at slow / normal / fast — the slider's own helpers ensure they line up.
    speedSlider.addMajorTick(MovingManConstants.PLAYBACK_SPEED_RANGE.min, new Text("0.2×", { font: SMALL_FONT }));
    speedSlider.addMajorTick(1, new Text("1×", { font: SMALL_FONT }));
    speedSlider.addMajorTick(MovingManConstants.PLAYBACK_SPEED_RANGE.max, new Text("4×", { font: SMALL_FONT }));

    const speedBox = new VBox({
      spacing: 2,
      align: "center",
      children: [
        new Text(playback.playbackSpeedStringProperty, {
          font: SMALL_FONT,
          fill: MovingManColors.foregroundColorProperty,
        }),
        speedSlider,
      ],
    });

    super({
      spacing: CONTROLS_SPACING,
      align: "center",
      children: [recordPlaybackGroup, rewindButton, playPauseButton, stepForwardButton, clearButton, speedBox],
    });
  }
}
