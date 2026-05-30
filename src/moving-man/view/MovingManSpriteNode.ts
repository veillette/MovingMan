/**
 * MovingManSpriteNode.ts
 *
 * A Scenery-node "sprite" for the moving man: chibi proportions, large expressive
 * head with eyes/hair/shine, gradient-filled body with highlight stripe, bold
 * outlines, and a ground shadow — the look a Pixi.js sprite-based simulation
 * would produce, rendered entirely from vector Node primitives.
 *
 * Drop-in replacement for MovingManNode — identical public constructor signature
 * and reactive behaviour (position tracking, facing direction, arrow overlays).
 */

import { Shape } from "scenerystack/kite";
import { Circle, DragListener, Line, Node, Path, RadialGradient, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import MovingManColors from "../../MovingManColors.js";
import MovingManConstants from "../model/MovingManConstants.js";
import type { MovingManModel } from "../model/MovingManModel.js";
import type { LinearTransform } from "./LinearTransform.js";

const { VELOCITY_SCALE, ACCELERATION_SCALE } = MovingManConstants;

const FACING_THRESHOLD = 0.1;
const ARROW_GAP_ABOVE_HEAD = 16;
const ARROW_STACK_GAP = 18;

const ARROW_OPTIONS = {
  headHeight: 12,
  headWidth: 14,
  tailWidth: 5,
  stroke: null,
};

// Sprite colour palette — vivid, game-character style.
const SKIN_BASE   = '#FFCC99';
const SKIN_DARK   = '#E8956D';
const SHIRT_COLOR = '#1565C0';   // vibrant royal blue
const SHIRT_LITE  = 'rgba(255,255,255,0.25)';
const PANTS_COLOR = '#1A237E';   // deep indigo
const SHOE_COLOR  = '#212121';
const HAIR_COLOR  = '#3E2009';   // dark espresso brown
const OUTLINE     = '#0D0D1A';   // near-black navy
const WHITE       = '#FFFFFF';

export type MovingManSpriteNodeOptions = {
  transform: LinearTransform;
  feetY: number;
  manHeight: number;
};

export class MovingManSpriteNode extends Node {
  public constructor( model: MovingManModel, options: MovingManSpriteNodeOptions ) {
    super( { cursor: 'pointer' } );

    const { transform, feetY, manHeight: h } = options;
    const man = model.movingMan;

    const figure = MovingManSpriteNode.createFigure( h );

    // Arrows sit above the head (head top is at -h in local coords).
    const headTopY = -h;
    const velocityArrow = new ArrowNode( 0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: MovingManColors.velocityProperty,
    } );
    const accelerationArrow = new ArrowNode( 0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: MovingManColors.accelerationProperty,
    } );
    const velocityArrowY     = headTopY - ARROW_GAP_ABOVE_HEAD;
    const accelerationArrowY = velocityArrowY - ARROW_STACK_GAP;

    this.children = [ figure, velocityArrow, accelerationArrow ];
    this.y = feetY;

    man.positionProperty.link( position => {
      this.x = transform.modelToViewX( position );
    } );

    man.velocityProperty.link( velocity => {
      if ( velocity > FACING_THRESHOLD ) {
        figure.setScaleMagnitude( 1, 1 );
      }
      else if ( velocity < -FACING_THRESHOLD ) {
        figure.setScaleMagnitude( -1, 1 );
      }
      MovingManSpriteNode.updateArrow(
        velocityArrow, velocity, VELOCITY_SCALE, transform.pixelsPerMeter, velocityArrowY
      );
    } );

    man.accelerationProperty.link( acceleration => {
      MovingManSpriteNode.updateArrow(
        accelerationArrow, acceleration, ACCELERATION_SCALE, transform.pixelsPerMeter, accelerationArrowY
      );
    } );

    model.showVelocityVectorProperty.link(     visible => { velocityArrow.visible     = visible; } );
    model.showAccelerationVectorProperty.link( visible => { accelerationArrow.visible = visible; } );

    this.addInputListener( new DragListener( {
      start: () => {
        man.setPositionDriven();
        if ( !( model.noRecording || model.recordingProperty.value ) ) { model.record(); }
        if ( !model.isPlayingProperty.value ) { model.play(); }
      },
      drag: ( event ) => {
        const localX = this.globalToParentPoint( event.pointer.point ).x;
        man.setMousePosition( transform.viewToModelX( localX ) );
        man.setPositionDriven();
      },
    } ) );
  }

  private static updateArrow(
    arrow: ArrowNode, value: number, scale: number, ppm: number, y: number
  ): void {
    const length = Math.abs( value ) * scale * ppm;
    if ( length < 1 ) {
      arrow.setTailAndTip( 0, y, 0, y );
    }
    else {
      arrow.setTailAndTip( 0, y, Math.sign( value ) * length, y );
    }
  }

  // ─── Figure construction ────────────────────────────────────────────────────

  private static createFigure( h: number ): Node {
    const figure = new Node();

    // ── Proportions ──────────────────────────────────────────────────────────
    const headRadius  = 0.17 * h;
    const headCenterY = -( h - headRadius );         // head top exactly at -h
    const shoulderY   = headCenterY + headRadius + 0.06 * h;
    const hipY        = -0.36 * h;
    const torsoW      = 0.28 * h;
    const torsoH      = hipY - shoulderY;            // negative (upward)
    const limbW       = 0.09 * h;
    const shoeH       = 0.045 * h;
    const shoeW       = 0.12 * h;

    // ── Ground shadow ─────────────────────────────────────────────────────────
    figure.addChild( new Rectangle( -torsoW * 0.7, -shoeH * 0.5, torsoW * 1.4, shoeH * 0.8, {
      fill:         'rgba(0,0,0,0.18)',
      cornerRadius: 6,
    } ) );

    // ── Legs (pants-coloured thick rounded strokes) ───────────────────────────
    const legOpts = { stroke: PANTS_COLOR, lineWidth: limbW, lineCap: 'round' as const };
    // slightly splayed for a mid-stride pose
    figure.addChild( new Line( -0.055 * h, hipY, -0.075 * h, -shoeH, legOpts ) );
    figure.addChild( new Line(  0.055 * h, hipY,  0.075 * h, -shoeH, legOpts ) );

    // Outline over legs
    const legOutlineOpts = { stroke: OUTLINE, lineWidth: 1, lineCap: 'round' as const };
    figure.addChild( new Line( -0.055 * h, hipY, -0.075 * h, -shoeH, legOutlineOpts ) );
    figure.addChild( new Line(  0.055 * h, hipY,  0.075 * h, -shoeH, legOutlineOpts ) );

    // ── Shoes (dark rounded rectangles at foot-level) ─────────────────────────
    figure.addChild( new Rectangle( -0.075 * h - shoeW * 0.55, -shoeH, shoeW, shoeH, {
      fill: SHOE_COLOR, cornerRadius: shoeH * 0.5,
    } ) );
    figure.addChild( new Rectangle(  0.075 * h - shoeW * 0.45, -shoeH, shoeW, shoeH, {
      fill: SHOE_COLOR, cornerRadius: shoeH * 0.5,
    } ) );
    // toe highlights
    figure.addChild( new Rectangle( -0.075 * h - shoeW * 0.45, -shoeH + 2, shoeW * 0.35, 3, {
      fill: 'rgba(255,255,255,0.25)', cornerRadius: 2,
    } ) );
    figure.addChild( new Rectangle(  0.075 * h - shoeW * 0.35, -shoeH + 2, shoeW * 0.35, 3, {
      fill: 'rgba(255,255,255,0.25)', cornerRadius: 2,
    } ) );

    // ── Torso (shirt) ─────────────────────────────────────────────────────────
    figure.addChild( new Rectangle( -torsoW / 2, shoulderY, torsoW, torsoH, {
      cornerRadius: torsoW * 0.22,
      fill:         SHIRT_COLOR,
      stroke:       OUTLINE,
      lineWidth:    1.5,
    } ) );
    // Vertical highlight stripe (left-of-centre) — gives a Pixi-style depth illusion.
    figure.addChild( new Rectangle( -torsoW / 2 + 4, shoulderY + 5, torsoW * 0.2, torsoH - 10, {
      cornerRadius: 4,
      fill:         SHIRT_LITE,
    } ) );

    // ── Arms (skin-coloured, with dark outline) ───────────────────────────────
    const armW = limbW * 0.9;
    // left arm swings forward (toward viewer's left = man's right in forward facing)
    figure.addChild( new Line( -torsoW / 2,       shoulderY + 0.025 * h,
                                -torsoW / 2 - 0.1 * h, hipY + 0.04 * h,
      { stroke: SKIN_BASE, lineWidth: armW, lineCap: 'round' } ) );
    figure.addChild( new Line( -torsoW / 2,       shoulderY + 0.025 * h,
                                -torsoW / 2 - 0.1 * h, hipY + 0.04 * h,
      { stroke: OUTLINE, lineWidth: 1, lineCap: 'round' } ) );

    // right arm swings back (slightly raised)
    figure.addChild( new Line(  torsoW / 2,       shoulderY + 0.025 * h,
                                 torsoW / 2 + 0.08 * h, shoulderY + 0.2 * h,
      { stroke: SKIN_BASE, lineWidth: armW, lineCap: 'round' } ) );
    figure.addChild( new Line(  torsoW / 2,       shoulderY + 0.025 * h,
                                 torsoW / 2 + 0.08 * h, shoulderY + 0.2 * h,
      { stroke: OUTLINE, lineWidth: 1, lineCap: 'round' } ) );

    // ── Hair (dark blob behind the head) ─────────────────────────────────────
    // A larger dark circle, positioned slightly above and behind (z-order).
    figure.addChild( new Circle( headRadius * 0.97, {
      y:      headCenterY - headRadius * 0.12,
      fill:   HAIR_COLOR,
      stroke: OUTLINE,
      lineWidth: 1,
    } ) );

    // ── Head (skin, drawn over hair) ──────────────────────────────────────────
    const headGradient = new RadialGradient(
      -headRadius * 0.28, headCenterY - headRadius * 0.28, 0,   // inner centre (highlight offset)
       0,                  headCenterY,                    headRadius   // outer edge
    )
      .addColorStop( 0,   SKIN_BASE )
      .addColorStop( 1,   SKIN_DARK );

    figure.addChild( new Circle( headRadius, {
      y:         headCenterY,
      fill:      headGradient,
      stroke:    OUTLINE,
      lineWidth: 1.5,
    } ) );

    // Forehead shine
    figure.addChild( new Circle( headRadius * 0.25, {
      x: -headRadius * 0.32, y: headCenterY - headRadius * 0.42,
      fill: 'rgba(255,255,255,0.45)',
    } ) );

    // ── Eyes ──────────────────────────────────────────────────────────────────
    const eyeOffsetX = headRadius * 0.33;
    const eyeY       = headCenterY - headRadius * 0.06;
    const eyeR       = headRadius * 0.14;
    const pupilR     = headRadius * 0.085;
    const shineR     = headRadius * 0.045;

    for ( const side of [ -1, 1 ] ) {
      const ex = side * eyeOffsetX;
      // white sclera
      figure.addChild( new Circle( eyeR, { x: ex, y: eyeY, fill: WHITE, stroke: OUTLINE, lineWidth: 0.8 } ) );
      // dark pupil (offset toward nose side for "cute" gaze)
      figure.addChild( new Circle( pupilR, { x: ex - side * pupilR * 0.25, y: eyeY, fill: OUTLINE } ) );
      // catchlight
      figure.addChild( new Circle( shineR, { x: ex - side * pupilR * 0.6, y: eyeY - pupilR * 0.55, fill: WHITE } ) );
    }

    // ── Smile ─────────────────────────────────────────────────────────────────
    const smileShape = new Shape()
      .arc( 0, headCenterY + headRadius * 0.22, headRadius * 0.22, 0.18, Math.PI - 0.18, false );
    figure.addChild( new Path( smileShape, { stroke: OUTLINE, lineWidth: 1.4, fill: null } ) );

    // ── Rosy cheeks ───────────────────────────────────────────────────────────
    const cheekR = headRadius * 0.16;
    const cheekY = headCenterY + headRadius * 0.28;
    figure.addChild( new Circle( cheekR, { x: -headRadius * 0.6, y: cheekY, fill: 'rgba(255,130,100,0.30)' } ) );
    figure.addChild( new Circle( cheekR, { x:  headRadius * 0.6, y: cheekY, fill: 'rgba(255,130,100,0.30)' } ) );

    return figure;
  }
}
