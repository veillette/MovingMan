import { Color, ProfileColorProperty } from "scenerystack";
import movingMan from "./MovingManNamespace.js";

const { BLACK, WHITE } = Color;

function profileColor(name: string, def: Color | string, projector: Color | string): ProfileColorProperty {
  return new ProfileColorProperty(movingMan, name, { default: def, projector });
}

// ── Sky / ground scenery ──────────────────────────────────────────────────────
// The original sim paints a blue sky gradient over a green ground. In projector
// mode the scene flattens to white sky / pale ground for maximum contrast.
const SKY_TOP_DEFAULT = new Color(120, 192, 240);
const SKY_BOTTOM_DEFAULT = new Color(206, 233, 250);
const GROUND_DEFAULT = new Color(110, 178, 92);

// ── Panel fills ───────────────────────────────────────────────────────────────
const PANEL_FILL_DEFAULT = new Color(245, 245, 245);
const PANEL_FILL_PROJECTOR = WHITE;
const PANEL_STROKE = "rgba(0, 0, 0, 0.35)";

const MovingManColors = {
  backgroundColorProperty: profileColor("background", SKY_BOTTOM_DEFAULT, WHITE),
  foregroundColorProperty: profileColor("foreground", BLACK, BLACK),

  skyTopProperty: profileColor("skyTop", SKY_TOP_DEFAULT, WHITE),
  skyBottomProperty: profileColor("skyBottom", SKY_BOTTOM_DEFAULT, WHITE),
  groundProperty: profileColor("ground", GROUND_DEFAULT, new Color(225, 235, 225)),
  groundStrokeProperty: profileColor("groundStroke", new Color(70, 120, 60), new Color(120, 120, 120)),

  panelFillProperty: profileColor("panelFill", PANEL_FILL_DEFAULT, PANEL_FILL_PROJECTOR),
  panelStrokeProperty: profileColor("panelStroke", PANEL_STROKE, PANEL_STROKE),

  // The three kinematic quantities. The hues match the original sim's graph lines.
  positionProperty: profileColor("position", "#2575BA", "#2575BA"),
  velocityProperty: profileColor("velocity", "#CD2520", "#CD2520"),
  accelerationProperty: profileColor("acceleration", "#349E34", "#349E34"),

  // The man figure.
  manFillProperty: profileColor("manFill", "#3a78c9", "#2c5fa8"),
  manSkinProperty: profileColor("manSkin", "#f2c9a0", "#f2c9a0"),
  manStrokeProperty: profileColor("manStroke", BLACK, BLACK),

  // Brick walls at the ends of the track (brick + mortar between courses).
  wallFillProperty: profileColor("wallFill", "#b5532c", "#b5532c"),
  wallMortarProperty: profileColor("wallMortar", "#e3c7a6", "#e3c7a6"),
  wallStrokeProperty: profileColor("wallStroke", new Color(90, 40, 20), new Color(90, 40, 20)),

  // Charts.
  chartBackgroundProperty: profileColor("chartBackground", WHITE, WHITE),
  chartGridProperty: profileColor("chartGrid", new Color(220, 220, 220), new Color(220, 220, 220)),
  chartBorderProperty: profileColor("chartBorder", new Color(120, 120, 120), new Color(120, 120, 120)),
  chartCursorProperty: profileColor("chartCursor", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.45)"),
};

movingMan.register("MovingManColors", MovingManColors);

export default MovingManColors;
