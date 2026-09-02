"use client";

import { useQuery } from "@tanstack/react-query";

import { dataSource } from "@/core/data/provider";
import { queryKeys } from "@/core/data/query-keys";

export function useRecentTracks(limit = 4) {
  return useQuery({
    queryKey: queryKeys.tracks.recent(limit),
    queryFn: () => dataSource.progress.listRecentTracks(limit),
  });
}

export function useContinueTrack() {
  return useQuery({
    queryKey: queryKeys.tracks.continue,
    queryFn: () => dataSource.progress.getContinueTrack(),
  });
}

export function useTrackProgress(trackId: string) {
  return useQuery({
    queryKey: queryKeys.tracks.progress(trackId),
    queryFn: () => dataSource.progress.getTrackProgress(trackId),
    enabled: Boolean(trackId),
  });
}
