"use client";

import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { HighlightHeading, Skeleton } from "@/components/ui/primitives";
import { useModules, useTracks } from "@/features/content/hooks";
import { TrackCard } from "@/features/content/components/track-card";
import { cn } from "@/lib/cn";

/** Biblioteca completa, filtrável por módulo. */
export function AllTracks() {
  const [moduleId, setModuleId] = useState<string | null>(null);
  const modules = useModules();
  const tracks = useTracks(moduleId ? { moduleId } : {});

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <HighlightHeading
        highlight="Todas as trilhas"
        description="A biblioteca completa de conteúdo publicado"
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por módulo">
        <FilterChip
          active={moduleId === null}
          onClick={() => setModuleId(null)}
        >
          Todos os módulos
        </FilterChip>
        {modules.data?.map((item) => (
          <FilterChip
            key={item.id}
            active={moduleId === item.id}
            onClick={() => setModuleId(item.id)}
          >
            {item.name}
          </FilterChip>
        ))}
      </div>

      {tracks.isPending && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-60 rounded-card" />
            </li>
          ))}
        </ul>
      )}

      {tracks.isError && <ErrorState onRetry={() => tracks.refetch()} />}

      {tracks.isSuccess &&
        (tracks.data.data.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.data.data.map((track) => (
              <li key={track.id}>
                <TrackCard track={track} variant="action" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhuma trilha neste módulo"
            description="Escolha outro módulo ou volte a ver todos."
          />
        ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-pill px-4 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-ink-inverse"
          : "bg-surface text-ink-muted hover:bg-surface-muted",
      )}
    >
      {children}
    </button>
  );
}
