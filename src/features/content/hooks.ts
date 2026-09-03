"use client";

import { useQuery } from "@tanstack/react-query";

import type { ListTracksParams } from "@/core/data/contracts";
import { dataSource } from "@/core/data/provider";
import { queryKeys } from "@/core/data/query-keys";

export function useModules() {
  return useQuery({
    queryKey: queryKeys.modules,
    queryFn: () => dataSource.content.listModules(),
  });
}

export function useTracks(params: ListTracksParams = {}) {
  return useQuery({
    queryKey: queryKeys.tracks.list(params),
    queryFn: () => dataSource.content.listTracks(params),
  });
}

export function useTrack(trackId: string) {
  return useQuery({
    queryKey: queryKeys.tracks.detail(trackId),
    queryFn: () => dataSource.content.getTrack(trackId),
    enabled: Boolean(trackId),
  });
}

export function useLessons(trackId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.byTrack(trackId),
    queryFn: () => dataSource.content.listLessons(trackId),
    enabled: Boolean(trackId),
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.detail(lessonId),
    queryFn: () => dataSource.content.getLesson(lessonId),
    enabled: Boolean(lessonId),
  });
}

export function useActivities(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.activities.byLesson(lessonId),
    queryFn: () => dataSource.content.listActivities(lessonId),
    enabled: Boolean(lessonId),
  });
}

export function useItems(activityId: string) {
  return useQuery({
    queryKey: queryKeys.items.byActivity(activityId),
    queryFn: () => dataSource.content.listItems(activityId),
    enabled: Boolean(activityId),
  });
}
