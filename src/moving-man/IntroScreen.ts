import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { MovingManModel } from "./model/MovingManModel.js";
import { IntroScreenView } from "./view/IntroScreenView.js";

type IntroScreenOptions = ScreenOptions & { tandem: Tandem };

export class IntroScreen extends Screen<MovingManModel, IntroScreenView> {
  public constructor(options: IntroScreenOptions) {
    super(
      () => new MovingManModel({ noRecording: true }),
      (model) => new IntroScreenView(model, { tandem: options.tandem.createTandem("view") }),
      options,
    );
  }
}
