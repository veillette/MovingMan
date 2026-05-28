/**
 * StringManager.ts
 *
 * Centralizes string management for Moving Man.
 * Provides access to localized strings for all components.
 */

import { LocalizedString, type ReadOnlyProperty } from "scenerystack";
import movingMan from "../MovingManNamespace.js";
import stringsEn from "./strings_en.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// satisfies errors immediately if either locale file is missing keys from the other.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);

export class StringManager {
  private static instance: StringManager;
  private readonly stringProperties;

  private constructor() {
    this.stringProperties = LocalizedString.getNestedStringProperties({
      en: stringsEn,
      fr: stringsFr,
    });
  }

  public static getInstance(): StringManager {
    if (!StringManager.instance) {
      StringManager.instance = new StringManager();
      movingMan.register("StringManager", StringManager.instance);
    }
    return StringManager.instance;
  }

  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return this.stringProperties.titleStringProperty;
  }

  public getScreenNames(): {
    introStringProperty: ReadOnlyProperty<string>;
    chartsStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      introStringProperty: this.stringProperties.screens.introStringProperty,
      chartsStringProperty: this.stringProperties.screens.chartsStringProperty,
    };
  }

  public getQuantityStrings() {
    return this.stringProperties.quantities;
  }

  public getUnitStrings() {
    return this.stringProperties.units;
  }

  public getVectorStrings() {
    return this.stringProperties.vectors;
  }

  public getControlStrings() {
    return this.stringProperties.controls;
  }

  public getPlaybackStrings() {
    return this.stringProperties.playback;
  }

  public getClockStrings() {
    return this.stringProperties.clock;
  }

  public getChartStrings() {
    return this.stringProperties.chart;
  }
}
