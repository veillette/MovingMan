/**
 * main.ts
 *
 * Entry point for the Moving Man application. Initializes the simulation,
 * creates the Introduction and Charts screens, and starts the main event loop.
 */

// NOTE: brand.js needs to be the first import. SceneryStack sims require a specific load order:
// init.ts => assert.ts => splash.ts => brand.ts => everything else (here).
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import MovingManColors from "./MovingManColors.js";
import movingMan from "./MovingManNamespace.js";
import { ChartsScreen } from "./moving-man/ChartsScreen.js";
import { IntroScreen } from "./moving-man/IntroScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const screenNames = stringManager.getScreenNames();

  const screens = [
    new IntroScreen({
      name: screenNames.introStringProperty,
      tandem: Tandem.ROOT.createTandem("introScreen"),
      backgroundColorProperty: MovingManColors.backgroundColorProperty,
    }),
    new ChartsScreen({
      name: screenNames.chartsStringProperty,
      tandem: Tandem.ROOT.createTandem("chartsScreen"),
      backgroundColorProperty: MovingManColors.backgroundColorProperty,
    }),
  ];

  const simOptions = {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      localizationOptions: {
        supportsDynamicLocale: true,
      },
    }),
  };

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, simOptions);
  movingMan.register("sim", sim);
  sim.start();
});
