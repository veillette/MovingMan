// Load init.ts/assert.ts/splash.ts before we load brand information (especially since it includes images).
import "./splash.js";

import type { TBrand } from "scenerystack/brand";
import { brand, madeWithSceneryStackOnDark, madeWithSceneryStackOnLight } from "scenerystack/brand";

const Brand: TBrand = {
  // Nickname for the brand; matches the ?brand query parameter and the brand registered in init.ts.
  id: "made-with-scenerystack",

  // Optional brand name shown at the top of the About dialog (null = none).
  name: null,

  // Optional copyright statement shown in the About dialog (null = none).
  copyright: null,

  // Any links to appear in the About dialog.
  getLinks: () => [],

  logoOnBlackBackground: madeWithSceneryStackOnDark,
  logoOnWhiteBackground: madeWithSceneryStackOnLight,
};

brand.register("Brand", Brand);
