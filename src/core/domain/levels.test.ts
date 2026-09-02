import { describe, expect, it } from "vitest";

import { XP_LEVEL_THRESHOLDS } from "@/config/levels";
import {
  levelForXp,
  levelProgress,
  thresholdForLevel,
} from "@/core/domain/levels";

describe("levelForXp", () => {
  it("começa todo mundo no nível 1", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
  });

  it("sobe ao atingir exatamente o limiar", () => {
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(150)).toBe(3);
  });

  it("trata XP negativo como zero em vez de quebrar", () => {
    expect(levelForXp(-100)).toBe(1);
  });

  it("continua progredindo além da tabela", () => {
    const last = XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1];
    expect(levelForXp(last)).toBe(XP_LEVEL_THRESHOLDS.length);
    expect(levelForXp(last + 600)).toBe(XP_LEVEL_THRESHOLDS.length + 1);
  });

  it("é monótono: mais XP nunca resulta em nível menor", () => {
    let previous = 0;
    for (let xp = 0; xp <= 5_000; xp += 37) {
      const level = levelForXp(xp);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });
});

describe("thresholdForLevel", () => {
  it("é crescente", () => {
    for (let level = 1; level < 20; level += 1) {
      expect(thresholdForLevel(level + 1)).toBeGreaterThan(
        thresholdForLevel(level),
      );
    }
  });
});

describe("levelProgress", () => {
  it("mede o avanço dentro do nível", () => {
    const progress = levelProgress(100);

    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(50);
    expect(progress.xpForNextLevel).toBe(100);
    expect(progress.percentToNextLevel).toBe(50);
  });

  it("zera o avanço ao recém-atingir um nível", () => {
    expect(levelProgress(150).xpIntoLevel).toBe(0);
    expect(levelProgress(150).percentToNextLevel).toBe(0);
  });
});
