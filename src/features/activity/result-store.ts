import type { ActivitySummary } from "@/core/domain/activity-session";
import type { CompletionEffects } from "@/core/data/contracts";

/**
 * Ponte entre o player e a tela de resultado.
 *
 * O resultado é calculado uma única vez, no fim do player — reconstruí-lo na
 * tela de resultado exigiria chamar `applyCompletionEffects` de novo, e a
 * segunda chamada já veria a lição como "já concluída", perdendo o sinalizador
 * "concluída agora" que decide qual das três telas de resultado aparece.
 *
 * `sessionStorage`, não `localStorage`: é dado transitório de navegação, não
 * progresso — não faz sentido sobreviver a uma aba fechada.
 */

export type ActivityResultPayload = {
  summary: ActivitySummary;
  effects: CompletionEffects;
  lessonId: string;
  trackId: string;
};

function key(activityId: string): string {
  return `leduc.result:${activityId}`;
}

export function writeActivityResult(
  activityId: string,
  payload: ActivityResultPayload,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key(activityId), JSON.stringify(payload));
  } catch {
    // Sem o resultado guardado, a tela de resultado cai no estado "não encontrado".
  }
}

export function readActivityResult(
  activityId: string,
): ActivityResultPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key(activityId));
    return raw ? (JSON.parse(raw) as ActivityResultPayload) : null;
  } catch {
    return null;
  }
}

export function clearActivityResult(activityId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key(activityId));
  } catch {
    // Nada a fazer — a entrada expira sozinha quando a aba fecha.
  }
}
