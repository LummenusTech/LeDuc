import { describe, expect, it } from "vitest";

import { computeStreak, toDayKey } from "@/core/domain/streak";

describe("computeStreak", () => {
  it("conta dias consecutivos até hoje", () => {
    const result = computeStreak(
      ["2026-03-01", "2026-03-02", "2026-03-03"],
      "2026-03-03",
    );

    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
    expect(result.lastAccessDay).toBe("2026-03-03");
  });

  it("mantém a ofensiva viva no dia seguinte, antes do acesso", () => {
    const result = computeStreak(["2026-03-01", "2026-03-02"], "2026-03-03");
    expect(result.current).toBe(2);
  });

  it("zera após um dia perdido", () => {
    const result = computeStreak(["2026-03-01", "2026-03-02"], "2026-03-04");

    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);
  });

  it("reinicia do zero depois da quebra, preservando o recorde", () => {
    const result = computeStreak(
      ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-06", "2026-03-07"],
      "2026-03-07",
    );

    expect(result.current).toBe(2);
    expect(result.longest).toBe(3);
  });

  it("ignora acessos repetidos no mesmo dia", () => {
    const result = computeStreak(
      ["2026-03-02", "2026-03-01", "2026-03-02", "2026-03-02"],
      "2026-03-02",
    );

    expect(result.current).toBe(2);
  });

  it("atravessa a virada de mês", () => {
    const result = computeStreak(
      ["2026-01-30", "2026-01-31", "2026-02-01"],
      "2026-02-01",
    );

    expect(result.current).toBe(3);
  });

  it("não conta sequência para quem nunca acessou", () => {
    expect(computeStreak([], "2026-03-01")).toEqual({
      current: 0,
      longest: 0,
      lastAccessDay: null,
    });
  });
});

describe("toDayKey", () => {
  it("formata no fuso local com zeros à esquerda", () => {
    expect(toDayKey(new Date(2026, 2, 7))).toBe("2026-03-07");
  });
});
