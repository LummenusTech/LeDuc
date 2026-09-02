import type { TrackTint } from "@/config/palette";
import type { User } from "@/core/domain/types";

/**
 * Modelos de leitura — o formato em que a interface consome os dados.
 *
 * São deliberadamente "achatados": um `TrackSummary` traz o que um card precisa
 * mostrar, já resolvido. É assim que uma API deveria responder a uma listagem,
 * e é por isso que trocar o mock por HTTP não muda nada nos componentes.
 */

export type Session = {
  user: User;
};

/** Alimenta `TrackCard` e `ContinueTrackBanner`. */
export type TrackSummary = {
  id: string;
  title: string;
  moduleName: string;
  tint: TrackTint;
  /** Posição atual: "Lição 4 de 12". */
  currentLesson: number;
  totalLessons: number;
  progressPct: number;
  isRecommended: boolean;
  /** ISO. Ordena o "Acessado recentemente". */
  lastAccessedAt: string | null;
};

export type GamificationSummary = {
  xpTotal: number;
  level: number;
  /** XP acumulado dentro do nível atual e o quanto falta para o próximo. */
  xpIntoLevel: number;
  xpForNextLevel: number;
  streakDays: number;
  longestStreakDays: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
};

/**
 * Números do perfil e da tela de progresso.
 *
 * `retentionRate` reproduz a "Taxa de retenção" que aparece nas telas. A
 * definição exata da métrica ainda não foi fechada com o time pedagógico — ela
 * vive atrás do `MetricsRepository` justamente para que, quando fechar, mude
 * num lugar só, sem tocar na interface.
 */
export type UserStats = {
  lessonsCompleted: number;
  lessonsTotal: number;
  overallProgressPct: number;
  retentionRate: number;
  studyTimeMinutes: number;
  streakDays: number;
  achievementsCount: number;
};

export type ModulePerformance = {
  moduleId: string;
  moduleName: string;
  tint: TrackTint;
  /** 0–100. */
  score: number;
};

/** Envelope de listagem, no formato que a API devolverá. */
export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
  };
};
