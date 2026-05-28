import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { MovingManModel } from "./model/MovingManModel.js";
import { ChartsScreenView } from "./view/ChartsScreenView.js";

type ChartsScreenOptions = ScreenOptions & { tandem: Tandem };

export class ChartsScreen extends Screen<MovingManModel, ChartsScreenView> {
  public constructor(options: ChartsScreenOptions) {
    super(
      () => new MovingManModel(),
      (model) => new ChartsScreenView(model, { tandem: options.tandem.createTandem("view") }),
      options,
    );
  }
}
