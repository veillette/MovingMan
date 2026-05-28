import { init, madeWithSceneryStackSplashDataURI } from "scenerystack/init";

init({
  name: "movingMan",
  version: "1.0.0",
  brand: "made-with-scenerystack",
  locale: "en",
  availableLocales: ["en", "fr"],
  splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: true,
  colorProfiles: ["default", "projector"],
});
