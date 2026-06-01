import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { MovingManModel } from "./model/MovingManModel.js";
import { IntroScreenIcon } from "./view/IntroScreenIcon.js";
import { IntroScreenView } from "./view/IntroScreenView.js";

type IntroScreenOptions = ScreenOptions & { tandem: Tandem };

export class IntroScreen extends Screen<MovingManModel, IntroScreenView> {
  public constructor(options: IntroScreenOptions) {
    super(
      () => new MovingManModel({ noRecording: true }),
      (model) => new IntroScreenView(model, { tandem: options.tandem.createTandem("view") }),
      {
        ...options,
        homeScreenIcon: new IntroScreenIcon({ size: Screen.MINIMUM_HOME_SCREEN_ICON_SIZE }),
        navigationBarIcon: new IntroScreenIcon({ size: Screen.MINIMUM_NAVBAR_ICON_SIZE }),
      },
    );
  }
}
