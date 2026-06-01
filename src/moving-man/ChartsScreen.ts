import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { MovingManModel } from "./model/MovingManModel.js";
import { ChartsScreenIcon } from "./view/ChartsScreenIcon.js";
import { ChartsScreenView } from "./view/ChartsScreenView.js";

type ChartsScreenOptions = ScreenOptions & { tandem: Tandem };

export class ChartsScreen extends Screen<MovingManModel, ChartsScreenView> {
  public constructor(options: ChartsScreenOptions) {
    super(
      () => new MovingManModel(),
      (model) => new ChartsScreenView(model, { tandem: options.tandem.createTandem("view") }),
      {
        ...options,
        homeScreenIcon: new ChartsScreenIcon({ size: Screen.MINIMUM_HOME_SCREEN_ICON_SIZE }),
        navigationBarIcon: new ChartsScreenIcon({ size: Screen.MINIMUM_NAVBAR_ICON_SIZE }),
      },
    );
  }
}
