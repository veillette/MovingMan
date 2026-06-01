/**
 * IntroScreenIcon.ts
 *
 * Home-screen / navigation-bar icon for the Introduction screen: the photographic
 * Moving Man standing on the green playground under a blue sky, with his red velocity
 * and green acceleration arrows streaming out to signal motion.
 */

import { Image, LinearGradient, Node, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { Screen, ScreenIcon, type ScreenIconOptions } from "scenerystack/sim";
import MovingManColors from "../../MovingManColors.js";
import standingImageUrl from "../images/man-standing.gif";

const ICON_WIDTH = Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width;
const ICON_HEIGHT = Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height;

// Native pixel size of the standing-man art (feet flush with the bottom edge).
const STANDING_NATIVE = { width: 150, height: 401 };

const ARROW_OPTIONS = { headHeight: 26, headWidth: 30, tailWidth: 12, stroke: null };

function createIconNode(): Node {
  const groundLineY = ICON_HEIGHT * 0.72;

  const sky = new Rectangle(0, 0, ICON_WIDTH, groundLineY, {
    fill: new LinearGradient(0, 0, 0, groundLineY)
      .addColorStop(0, MovingManColors.skyTopProperty)
      .addColorStop(1, MovingManColors.skyBottomProperty),
  });
  const ground = new Rectangle(0, groundLineY, ICON_WIDTH, ICON_HEIGHT - groundLineY, {
    fill: MovingManColors.groundProperty,
  });

  // The man, standing on the ground a little left of center.
  const manHeight = ICON_HEIGHT * 0.66;
  const man = new Image(standingImageUrl, {
    scale: manHeight / STANDING_NATIVE.height,
    initialWidth: STANDING_NATIVE.width,
    initialHeight: STANDING_NATIVE.height,
  });
  man.centerX = ICON_WIDTH * 0.36;
  man.bottom = groundLineY + 2;

  // Velocity (red, longer) above acceleration (green), both streaming to the right.
  const tailX = man.right + 10;
  const velocityArrow = new ArrowNode(tailX, ICON_HEIGHT * 0.3, tailX + 150, ICON_HEIGHT * 0.3, {
    ...ARROW_OPTIONS,
    fill: MovingManColors.velocityProperty,
  });
  const accelerationArrow = new ArrowNode(tailX, ICON_HEIGHT * 0.46, tailX + 95, ICON_HEIGHT * 0.46, {
    ...ARROW_OPTIONS,
    fill: MovingManColors.accelerationProperty,
  });

  return new Node({ children: [sky, ground, man, velocityArrow, accelerationArrow] });
}

export class IntroScreenIcon extends ScreenIcon {
  public constructor(providedOptions?: ScreenIconOptions) {
    super(createIconNode(), {
      maxIconWidthProportion: 1,
      maxIconHeightProportion: 1,
      fill: MovingManColors.skyBottomProperty,
      ...providedOptions,
    });
  }
}
