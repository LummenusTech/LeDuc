import { describe, expect, it } from "vitest";

import {
  gradeItemLocally,
  normalizeText,
  type ItemAnswer,
} from "@/core/domain/grading";
import type { Item } from "@/core/domain/types";

const base = {
  activityId: "a1",
  difficulty: "easy" as const,
  explanation: "Explicação do item.",
  ignoreAccents: true,
};

const online = { isOnline: true };
const offline = { isOnline: false };

const multipleChoice: Item = {
  ...base,
  id: "i1",
  type: "multiple_choice",
  prompt: "Qual destas letras é uma vogal?",
  content: {
    options: [
      { id: "o1", label: "A" },
      { id: "o2", label: "B" },
    ],
    correctOptionId: "o1",
  },
};

const columnMatch: Item = {
  ...base,
  id: "i2",
  type: "column_match",
  prompt: "Ligue a vogal ao desenho.",
  content: {
    left: [
      { id: "l1", label: "A" },
      { id: "l2", label: "E" },
    ],
    right: [
      { id: "r1", label: "Abelha" },
      { id: "r2", label: "Escada" },
    ],
    correctPairs: [
      { leftId: "l1", rightId: "r1" },
      { leftId: "l2", rightId: "r2" },
    ],
  },
};

const fillBlanks: Item = {
  ...base,
  id: "i3",
  type: "fill_blanks",
  prompt: "Complete a palavra.",
  content: {
    segments: ["c", null, "sa"],
    acceptedAnswers: [["a"]],
  },
};

const shortAnswer: Item = {
  ...base,
  id: "i4",
  type: "short_answer",
  difficulty: "hard",
  prompt: "Escreva uma palavra que comece com A.",
  content: { referenceAnswers: ["água", "arroz"] },
};

describe("normalizeText", () => {
  it("normaliza caixa e espaços", () => {
    expect(normalizeText("  Casa   Nova ", { ignoreAccents: false })).toBe(
      "casa nova",
    );
  });

  it("remove acentos quando o item permite", () => {
    expect(normalizeText("Água", { ignoreAccents: true })).toBe("agua");
  });

  it("mantém acentos quando o item os exige", () => {
    expect(normalizeText("Água", { ignoreAccents: false })).toBe("água");
  });

  it("NÃO corrige ortografia — 'kasa' continua diferente de 'casa'", () => {
    const options = { ignoreAccents: true };
    expect(normalizeText("kasa", options)).not.toBe(
      normalizeText("casa", options),
    );
  });
});

describe("múltipla escolha", () => {
  it("aceita a alternativa correta", () => {
    const answer: ItemAnswer = { type: "multiple_choice", optionId: "o1" };
    expect(gradeItemLocally(multipleChoice, answer, online)).toEqual({
      status: "correct",
      explanation: "Explicação do item.",
    });
  });

  it("recusa a alternativa errada, mas explica o porquê", () => {
    const answer: ItemAnswer = { type: "multiple_choice", optionId: "o2" };
    const result = gradeItemLocally(multipleChoice, answer, online);

    expect(result?.status).toBe("incorrect");
    // RN-A2: errar sem explicação não ensina nada.
    expect(result).toHaveProperty("explanation", "Explicação do item.");
  });
});

describe("associação de colunas", () => {
  it("aceita quando todos os pares batem", () => {
    const answer: ItemAnswer = {
      type: "column_match",
      pairs: [
        { leftId: "l1", rightId: "r1" },
        { leftId: "l2", rightId: "r2" },
      ],
    };
    expect(gradeItemLocally(columnMatch, answer, online)?.status).toBe(
      "correct",
    );
  });

  it("é tudo ou nada: acertar metade não conta", () => {
    const answer: ItemAnswer = {
      type: "column_match",
      pairs: [
        { leftId: "l1", rightId: "r1" },
        { leftId: "l2", rightId: "r1" },
      ],
    };
    expect(gradeItemLocally(columnMatch, answer, online)?.status).toBe(
      "incorrect",
    );
  });

  it("recusa resposta incompleta", () => {
    const answer: ItemAnswer = {
      type: "column_match",
      pairs: [{ leftId: "l1", rightId: "r1" }],
    };
    expect(gradeItemLocally(columnMatch, answer, online)?.status).toBe(
      "incorrect",
    );
  });

  it("aceita os pares fora de ordem", () => {
    const answer: ItemAnswer = {
      type: "column_match",
      pairs: [
        { leftId: "l2", rightId: "r2" },
        { leftId: "l1", rightId: "r1" },
      ],
    };
    expect(gradeItemLocally(columnMatch, answer, online)?.status).toBe(
      "correct",
    );
  });
});

describe("completar lacunas", () => {
  it("aceita a variante correta", () => {
    const answer: ItemAnswer = { type: "fill_blanks", values: ["A"] };
    expect(gradeItemLocally(fillBlanks, answer, online)?.status).toBe("correct");
  });

  it("recusa lacuna vazia", () => {
    const answer: ItemAnswer = { type: "fill_blanks", values: [""] };
    expect(gradeItemLocally(fillBlanks, answer, online)?.status).toBe(
      "incorrect",
    );
  });

  it("exige uma resposta por lacuna", () => {
    const twoBlanks: Item = {
      ...fillBlanks,
      content: { segments: [null, "-", null], acceptedAnswers: [["a"], ["e"]] },
    };
    const answer: ItemAnswer = { type: "fill_blanks", values: ["a"] };
    expect(gradeItemLocally(twoBlanks, answer, online)?.status).toBe(
      "incorrect",
    );
  });
});

describe("resposta curta", () => {
  it("delega para a IA quando há rede", () => {
    const answer: ItemAnswer = { type: "short_answer", text: "arroz" };
    expect(gradeItemLocally(shortAnswer, answer, online)).toBeNull();
  });

  it("aceita e adia a correção quando não há rede", () => {
    const answer: ItemAnswer = { type: "short_answer", text: "arroz" };
    expect(gradeItemLocally(shortAnswer, answer, offline)?.status).toBe(
      "pending_review",
    );
  });
});

describe("resposta incompatível com o item", () => {
  it("falha alto — é bug de programação, não erro do aluno", () => {
    const answer: ItemAnswer = { type: "short_answer", text: "x" };
    expect(() => gradeItemLocally(multipleChoice, answer, online)).toThrow();
  });
});
