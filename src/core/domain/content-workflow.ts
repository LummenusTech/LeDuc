import type { ContentStatus, Item } from "@/core/domain/types";

/**
 * Fluxo editorial: rascunho → revisão → publicado (RN-W1 a RN-W6).
 *
 * A validação de publicação existe porque o conteúdo é escrito por educadores,
 * não por engenheiros: um item sem explicação passa despercebido no editor e
 * vira, para o aluno, um "você errou" sem motivo. O erro precisa ser barrado
 * antes de chegar a ele.
 */

export type PublishIssue = {
  code:
    | "track_without_lessons"
    | "lesson_without_activities"
    | "activity_without_items"
    | "item_without_prompt"
    | "item_without_explanation"
    | "item_without_answer";
  /** Id do nó com o problema, para o editor navegar até ele. */
  nodeId: string;
  message: string;
};

export type ActivityDraft = {
  id: string;
  title: string;
  items: Item[];
};

export type LessonDraft = {
  id: string;
  title: string;
  activities: ActivityDraft[];
};

export type TrackDraft = {
  id: string;
  title: string;
  lessons: LessonDraft[];
};

function validateItem(item: Item): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (item.prompt.trim().length === 0) {
    issues.push({
      code: "item_without_prompt",
      nodeId: item.id,
      message: "A questão está sem enunciado.",
    });
  }

  // RN-A2: o feedback imediato precisa explicar o porquê. Sem explicação, o
  // item ensina apenas que o aluno errou.
  if (item.explanation.trim().length === 0) {
    issues.push({
      code: "item_without_explanation",
      nodeId: item.id,
      message: "A questão está sem a explicação do feedback.",
    });
  }

  if (!hasAnswerKey(item)) {
    issues.push({
      code: "item_without_answer",
      nodeId: item.id,
      message: "A questão está sem gabarito.",
    });
  }

  return issues;
}

function hasAnswerKey(item: Item): boolean {
  switch (item.type) {
    case "multiple_choice":
      return (
        item.content.options.length >= 2 &&
        item.content.options.some(
          (option) => option.id === item.content.correctOptionId,
        )
      );
    case "column_match":
      return item.content.correctPairs.length > 0;
    case "fill_blanks":
      return (
        item.content.acceptedAnswers.length > 0 &&
        item.content.acceptedAnswers.every((variants) => variants.length > 0)
      );
    case "short_answer":
      return item.content.referenceAnswers.length > 0;
  }
}

/**
 * Lista tudo que impede a publicação. Vazio significa "pode publicar".
 *
 * Devolve a lista inteira, e não o primeiro problema: quem está montando uma
 * trilha precisa ver de uma vez o que falta, não descobrir um erro por vez.
 */
export function validateForPublication(track: TrackDraft): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (track.lessons.length === 0) {
    issues.push({
      code: "track_without_lessons",
      nodeId: track.id,
      message: "A trilha não tem nenhuma lição.",
    });
  }

  for (const lesson of track.lessons) {
    if (lesson.activities.length === 0) {
      issues.push({
        code: "lesson_without_activities",
        nodeId: lesson.id,
        message: `A lição "${lesson.title}" não tem atividades.`,
      });
    }

    for (const activity of lesson.activities) {
      if (activity.items.length === 0) {
        issues.push({
          code: "activity_without_items",
          nodeId: activity.id,
          message: `A atividade "${activity.title}" não tem questões.`,
        });
      }

      for (const item of activity.items) {
        issues.push(...validateItem(item));
      }
    }
  }

  return issues;
}

export function canPublish(track: TrackDraft): boolean {
  return validateForPublication(track).length === 0;
}

/** Transições permitidas. Publicar sempre exige um humano (RN-W6). */
const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ["in_review"],
  in_review: ["draft", "published"],
  published: ["draft"],
};

export function canTransition(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Publicar cria uma versão nova; a anterior permanece (RN-W3, RN-W4).
 *
 * É o que permite a quem já começou uma lição terminar na versão em que
 * começou — trocar o conteúdo sob os pés do aluno invalidaria as tentativas
 * dele e, com elas, o domínio que o professor vê.
 */
export function nextVersion(currentVersion: number): number {
  return currentVersion + 1;
}
