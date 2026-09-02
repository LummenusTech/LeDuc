"use client";

import { useQuery } from "@tanstack/react-query";

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

export function useGamificationSummary() {
  return useQuery({
    queryKey: queryKeys.gamification,
    queryFn: () => dataSource.gamification.getSummary(),
  });
}
