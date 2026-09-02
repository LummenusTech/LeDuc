"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Skeleton } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { CardCarousel } from "@/features/content/components/card-carousel";
import { TrackCard } from "@/features/content/components/track-card";
import { useTracks } from "@/features/content/hooks";
import { useRecentTracks } from "@/features/progress/hooks";

/**
 * Tela de trilhas: busca, acessadas recentemente e recomendadas.
 *
 * Ao digitar, as duas seções dão lugar a uma grade única de resultados —
 * manter carrosséis durante uma busca esconderia resultados fora da tela.
 */
export function TracksBrowser() {
  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;

  const recentTracks = useRecentTracks(6);
  const recommended = useTracks({ recommendedOnly: true });
  const searchResults = useTracks({ query: query.trim() });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-9">
      <label className="block">
        <span className="sr-only">Buscar trilhas, aulas ou conteúdos</span>
        <div className="flex min-h-touch items-center gap-3 rounded-control border-2 border-line bg-surface px-4 focus-within:border-primary">
          <Search className="size-5 shrink-0 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque trilhas, aulas ou conteúdos…"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="shrink-0 rounded-full p-1 text-ink-muted hover:text-primary"
            >
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
      </label>

      {isSearching ? (
        <section aria-live="polite">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Resultados para “{query.trim()}”
          </h2>

          {searchResults.isPending && <TrackGridSkeleton />}

          {searchResults.isError && (
            <ErrorState onRetry={() => searchResults.refetch()} />
          )}

          {searchResults.isSuccess &&
            (searchResults.data.data.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.data.data.map((track) => (
                  <li key={track.id}>
                    <TrackCard track={track} variant="action" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Search}
                title="Nenhuma trilha encontrada"
                description={`Não achamos nada para “${query.trim()}”. Tente outra palavra, como “leitura” ou “gramática”.`}
              />
            ))}
        </section>
      ) : (
        <>
          <CardCarousel
            title="Acessado recentemente"
            seeAllHref={ROUTES.student.allTracks}
          >
            {recentTracks.isPending && <CarouselSkeleton />}
            {recentTracks.data?.map((track) => (
              <li key={track.id}>
                <TrackCard track={track} variant="action" />
              </li>
            ))}
          </CardCarousel>

          <CardCarousel
            title="Trilhas recomendadas"
            seeAllHref={ROUTES.student.allTracks}
          >
            {recommended.isPending && <CarouselSkeleton />}
            {recommended.data?.data.map((track) => (
              <li key={track.id}>
                <TrackCard track={track} variant="action" />
              </li>
            ))}
          </CardCarousel>
        </>
      )}
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-60 rounded-card" />
        </li>
      ))}
    </>
  );
}

function TrackGridSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-60 rounded-card" />
        </li>
      ))}
    </ul>
  );
}
