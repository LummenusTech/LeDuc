import { describe, expect, it } from "vitest";

import {
  canPublish,
  canTransition,
  nextVersion,
  validateForPublication,
  type TrackDraft,
} from "@/core/domain/content-workflow";
import type { Item } from "@/core/domain/types";

function validItem(id = "i1"): Extract<Item, { type: "multiple_choice" }> {
  return {
    id,
    activityId: "a1",
    type: "multiple_choice",
    difficulty: "easy",
    prompt: "Qual é a vogal?",
    explanation: "A, E, I, O, U são vogais.",
    ignoreAccents: true,
    content: {
      options: [
        { id: "o1", label: "A" },
        { id: "o2", label: "B" },
      ],
      correctOptionId: "o1",
    },
  };
}

function trackWith(items: Item[]): TrackDraft {
  return {
    id: "t1",
    title: "Alfabetização I",
    lessons: [
      {
        id: "l1",
        title: "As vogais",
        activities: [{ id: "a1", title: "Reconhecer", items }],
      },
    ],
  };
}

describe("validateForPublication", () => {
  it("aprova uma trilha completa", () => {
    expect(validateForPublication(trackWith([validItem()]))).toEqual([]);
    expect(canPublish(trackWith([validItem()]))).toBe(true);
  });

  it("recusa trilha sem lição", () => {
    const empty: TrackDraft = { id: "t1", title: "Vazia", lessons: [] };
    expect(validateForPublication(empty)[0].code).toBe("track_without_lessons");
  });

  it("recusa atividade sem questão", () => {
    const issues = validateForPublication(trackWith([]));
    expect(issues.map((i) => i.code)).toContain("activity_without_items");
  });

  it("recusa questão sem explicação — feedback sem porquê não ensina", () => {
    const item = { ...validItem(), explanation: "  " };
    const issues = validateForPublication(trackWith([item]));

    expect(issues.map((i) => i.code)).toContain("item_without_explanation");
  });

  it("recusa questão sem enunciado", () => {
    const item = { ...validItem(), prompt: "" };
    const issues = validateForPublication(trackWith([item]));

    expect(issues.map((i) => i.code)).toContain("item_without_prompt");
  });

  it("recusa múltipla escolha cujo gabarito não existe entre as opções", () => {
    const item: Item = {
      ...validItem(),
      content: {
        options: [
          { id: "o1", label: "A" },
          { id: "o2", label: "B" },
        ],
        correctOptionId: "o9",
      },
    };
    const issues = validateForPublication(trackWith([item]));

    expect(issues.map((i) => i.code)).toContain("item_without_answer");
  });

  it("recusa lacuna sem nenhuma resposta aceita", () => {
    const { id, activityId, difficulty, prompt, explanation, ignoreAccents } =
      validItem();
    const item: Item = {
      id,
      activityId,
      difficulty,
      prompt,
      explanation,
      ignoreAccents,
      type: "fill_blanks",
      content: { segments: ["c", null], acceptedAnswers: [[]] },
    };
    const issues = validateForPublication(trackWith([item]));

    expect(issues.map((i) => i.code)).toContain("item_without_answer");
  });

  it("lista TODOS os problemas de uma vez, não só o primeiro", () => {
    const broken = { ...validItem(), prompt: "", explanation: "" };
    const issues = validateForPublication(trackWith([broken]));

    expect(issues).toHaveLength(2);
  });

  it("aponta o nó com o problema, para o editor navegar até ele", () => {
    const broken = { ...validItem("questao-7"), explanation: "" };
    const issues = validateForPublication(trackWith([broken]));

    expect(issues[0].nodeId).toBe("questao-7");
  });
});

describe("canTransition", () => {
  it("segue o fluxo rascunho → revisão → publicado", () => {
    expect(canTransition("draft", "in_review")).toBe(true);
    expect(canTransition("in_review", "published")).toBe(true);
  });

  it("não publica direto do rascunho — revisão é obrigatória", () => {
    expect(canTransition("draft", "published")).toBe(false);
  });

  it("permite voltar para rascunho", () => {
    expect(canTransition("in_review", "draft")).toBe(true);
    expect(canTransition("published", "draft")).toBe(true);
  });
});

describe("nextVersion", () => {
  it("avança preservando a anterior", () => {
    expect(nextVersion(3)).toBe(4);
  });
});
