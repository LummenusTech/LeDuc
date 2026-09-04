import type {
  Activity,
  Lesson,
  LessonProgress,
  LessonStatus,
} from "@/core/domain/types";

/**
 * Navegação linear: a lição N só abre quando a N-1 é concluída.
 *
 * Esta é a única fonte dos estados exibidos no mapa da trilha. Nenhum componente
 * decide sozinho se uma lição está bloqueada.
 */

/**
 * Resolve o estado de cada lição de uma trilha, na ordem.
 *
 * @param lessons  lições da trilha, em qualquer ordem — são ordenadas aqui
 * @param progress progresso do aluno, indexado por id de lição
 */
export function resolveLessonStatuses(
  lessons: readonly Lesson[],
  progress: Readonly<Record<string, LessonProgress>>,
): Map<string, LessonStatus> {
  const ordered = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  const statuses = new Map<string, LessonStatus>();

  let previousCompleted = true; // a primeira lição está sempre disponível

  for (const lesson of ordered) {
    const lessonProgress = progress[lesson.id];

    if (lessonProgress?.status === "completed") {
      statuses.set(lesson.id, "completed");
      previousCompleted = true;
      continue;
    }

    if (!previousCompleted) {
      statuses.set(lesson.id, "locked");
      continue;
    }

    statuses.set(
      lesson.id,
      lessonProgress?.status === "in_progress" ? "in_progress" : "available",
    );
    previousCompleted = false;
  }

  return statuses;
}

export function isLessonUnlocked(status: LessonStatus): boolean {
  return status !== "locked";
}

/** Lição que o botão "Continuar trilha" deve abrir. */
export function findResumeLesson(
  lessons: readonly Lesson[],
  progress: Readonly<Record<string, LessonProgress>>,
): Lesson | null {
  const ordered = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  const statuses = resolveLessonStatuses(ordered, progress);

  return (
    ordered.find((lesson) => {
      const status = statuses.get(lesson.id);
      return status === "in_progress" || status === "available";
    }) ?? null
  );
}

/** Progresso da trilha em %, por lições concluídas. */
export function computeTrackProgress(
  lessons: readonly Lesson[],
  progress: Readonly<Record<string, LessonProgress>>,
): number {
  if (lessons.length === 0) return 0;

  const completed = lessons.filter(
    (lesson) => progress[lesson.id]?.status === "completed",
  ).length;

  return Math.round((completed / lessons.length) * 100);
}

/**
 * Lição concluída quando toda atividade dela está concluída (RN-P5).
 *
 * Uma lição sem atividades nunca está concluída — não existe "concluir por
 * omissão"; é sinal de conteúdo incompleto, não de aluno em dia.
 */
export function isLessonComplete(
  activities: readonly Activity[],
  completedActivityIds: ReadonlySet<string>,
): boolean {
  if (activities.length === 0) return false;
  return activities.every((activity) => completedActivityIds.has(activity.id));
}

/**
 * Trilha concluída quando toda lição dela está concluída (RN-P6).
 *
 * Reusa o mesmo critério de `computeTrackProgress` (status `"completed"` em
 * `LessonProgress`), só que como booleano — é o que a tela de trilha e o
 * evento de XP de conclusão de trilha (RN-X5) precisam para decidir "cheguei
 * ao fim", em vez de reler um percentual.
 */
export function isTrackComplete(
  lessons: readonly Lesson[],
  progress: Readonly<Record<string, LessonProgress>>,
): boolean {
  if (lessons.length === 0) return false;
  return lessons.every((lesson) => progress[lesson.id]?.status === "completed");
}
