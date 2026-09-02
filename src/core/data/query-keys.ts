import type { ListTracksParams } from "@/core/data/contracts";

/**
 * Chaves de cache do TanStack Query, centralizadas.
 *
 * Espalhadas pelos hooks, elas divergem e invalidações silenciosamente param de
 * funcionar. Aqui, invalidar "tudo de trilhas" é `queryKeys.tracks.all`.
 */
export const queryKeys = {
  session: ["session"] as const,

  modules: ["modules"] as const,

  tracks: {
    all: ["tracks"] as const,
    list: (params: ListTracksParams = {}) => ["tracks", "list", params] as const,
    detail: (trackId: string) => ["tracks", "detail", trackId] as const,
    recent: (limit: number) => ["tracks", "recent", limit] as const,
    continue: ["tracks", "continue"] as const,
    progress: (trackId: string) => ["tracks", "progress", trackId] as const,
  },

  lessons: {
    byTrack: (trackId: string) => ["lessons", trackId] as const,
  },

  gamification: ["gamification"] as const,

  metrics: {
    stats: ["metrics", "stats"] as const,
    modulePerformance: ["metrics", "module-performance"] as const,
  },
} as const;
