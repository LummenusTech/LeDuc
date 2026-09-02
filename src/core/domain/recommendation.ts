import type { Track } from "@/core/domain/types";

/**
 * Recomendação de trilhas (RN-D1 a RN-D4 do plano).
 *
 * Determinística no protótipo, atrás do repositório — quando virar IA, a
 * interface não muda.
 *
 * A regra de negócio que mais importa aqui não é técnica: **no máximo uma
 * trilha de reforço**. Encher a lista com os módulos em que o aluno vai pior
 * transformaria a recomendação num boletim, e o público é justamente o que já
 * carrega uma história de fracasso escolar.
 */

export type RecommendationContext = {
  /** Trilhas publicadas disponíveis. */
  tracks: readonly Track[];
  completedTrackIds: readonly string[];
  inProgressTrackIds: readonly string[];
  /** Desempenho por módulo, 0–100. */
  scoreByModuleId: Readonly<Record<string, number>>;
};

const MAX_REINFORCEMENT_TRACKS = 1;
const REINFORCEMENT_SCORE_THRESHOLD = 60;

function levelRank(level: string): number {
  const romans: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10,
  };
  return romans[level.toUpperCase()] ?? Number.MAX_SAFE_INTEGER;
}

export function recommendTracks(
  context: RecommendationContext,
  limit = 4,
): Track[] {
  const { tracks, completedTrackIds, inProgressTrackIds, scoreByModuleId } =
    context;

  const taken = new Set([...completedTrackIds, ...inProgressTrackIds]);

  const available = tracks
    .filter((track) => track.status === "published" && !taken.has(track.id))
    .sort((a, b) => levelRank(a.level) - levelRank(b.level));

  const weakModules = new Set(
    Object.entries(scoreByModuleId)
      .filter(([, score]) => score < REINFORCEMENT_SCORE_THRESHOLD)
      .map(([moduleId]) => moduleId),
  );

  const advancement = available.filter(
    (track) => !weakModules.has(track.moduleId),
  );
  const reinforcement = available
    .filter((track) => weakModules.has(track.moduleId))
    .slice(0, MAX_REINFORCEMENT_TRACKS);

  // O reforço é escolhido primeiro e o avanço preenche o resto. A vaga do
  // reforço não pode encolher a lista quando não há reforço a incluir — quem
  // vai bem em tudo receberia uma recomendação a menos.
  return [
    ...advancement.slice(0, limit - reinforcement.length),
    ...reinforcement,
  ].slice(0, limit);
}
