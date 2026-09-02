"use client";

import { Flame } from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Card, HighlightHeading, Skeleton } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { DAILY_QUOTE } from "@/core/data/mock/fixtures";
import { useGamificationSummary } from "@/features/analytics/hooks";
import { useSession } from "@/features/auth/hooks";
import { CardCarousel } from "@/features/content/components/card-carousel";
import { TrackCard } from "@/features/content/components/track-card";
import { ContinueTrackBanner } from "@/features/progress/components/continue-track-banner";
import { useContinueTrack, useRecentTracks } from "@/features/progress/hooks";

export function StudentHome() {
  const session = useSession();
  const continueTrack = useContinueTrack();
  const recentTracks = useRecentTracks(4);
  const gamification = useGamificationSummary();

  const firstName = session.data?.user.name ?? "estudante";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <HighlightHeading
          before="Tudo bem, "
          highlight={firstName}
          after="?"
          description={`"${DAILY_QUOTE}"`}
        />

        {gamification.data && (
          <Card className="flex items-center gap-3 px-4 py-3">
            <Flame className="size-6 text-tint-pessego-solid" aria-hidden />
            <div>
              <p className="text-lg font-bold leading-none text-ink tabular-nums">
                {gamification.data.streakDays}
              </p>
              <p className="text-xs text-ink-muted">
                {gamification.data.streakDays === 1
                  ? "dia seguido"
                  : "dias seguidos"}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Trilha em andamento */}
      {continueTrack.isPending && <Skeleton className="h-64 rounded-card" />}

      {continueTrack.isError && (
        <ErrorState onRetry={() => continueTrack.refetch()} />
      )}

      {continueTrack.isSuccess &&
        (continueTrack.data ? (
          <ContinueTrackBanner track={continueTrack.data} />
        ) : (
          <EmptyState
            title="Você ainda não começou uma trilha"
            description="Escolha uma trilha para dar o primeiro passo. Dá para trocar depois."
            action={
              <Link
                href={ROUTES.student.tracks}
                className="inline-flex min-h-touch items-center rounded-control bg-primary px-6 font-semibold text-ink-inverse hover:bg-primary-hover"
              >
                Ver trilhas
              </Link>
            }
          />
        ))}

      {/* Acessado recentemente */}
      <CardCarousel
        title="Acessado recentemente"
        seeAllHref={ROUTES.student.allTracks}
      >
        {recentTracks.isPending &&
          Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-56 rounded-card" />
            </li>
          ))}

        {recentTracks.data?.map((track) => (
          <li key={track.id}>
            <TrackCard track={track} variant="compact" />
          </li>
        ))}
      </CardCarousel>

      {recentTracks.isError && (
        <ErrorState onRetry={() => recentTracks.refetch()} />
      )}

      {recentTracks.isSuccess && recentTracks.data.length === 0 && (
        <EmptyState
          title="Nada por aqui ainda"
          description="As trilhas que você abrir vão aparecer nesta lista."
        />
      )}
    </div>
  );
}
