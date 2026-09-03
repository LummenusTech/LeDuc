"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dataSource } from "@/core/data/provider";
import { queryKeys } from "@/core/data/query-keys";

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.metrics.stats,
    queryFn: () => dataSource.metrics.getUserStats(),
  });
}

export function useModulePerformance() {
  return useQuery({
    queryKey: queryKeys.metrics.modulePerformance,
    queryFn: () => dataSource.metrics.listModulePerformance(),
  });
}

export function useUnlockedAchievements() {
  return useQuery({
    queryKey: queryKeys.unlockedAchievements,
    queryFn: () => dataSource.gamification.listUnlockedAchievements(),
  });
}

export function useGamificationSummary() {
  return useQuery({
    queryKey: queryKeys.gamification,
    queryFn: () => dataSource.gamification.getSummary(),
  });
}

/**
 * Registra o acesso de hoje uma vez por sessão do app (RN-O1: entrar já
 * conta). Vive na casca do app, não numa tela específica — o aluno pode
 * abrir direto em qualquer rota.
 */
export function useRecordAccessOnMount() {
  const queryClient = useQueryClient();
  const recordAccess = useMutation({
    mutationFn: () => dataSource.gamification.recordAccess(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification });
    },
  });
  const { mutate } = recordAccess;

  useEffect(() => {
    mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
