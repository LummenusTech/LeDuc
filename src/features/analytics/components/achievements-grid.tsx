"use client";

import { Lock } from "lucide-react";

import { ErrorState } from "@/components/feedback/states";
import { Card, HighlightHeading, Skeleton } from "@/components/ui/primitives";
import { ACHIEVEMENTS } from "@/config/achievements";
import { useUnlockedAchievements } from "@/features/analytics/hooks";
import { AchievementIcon } from "@/features/analytics/components/achievement-icon";
import { cn } from "@/lib/cn";

/** Grade de conquistas — desbloqueada nunca é retirada (RN-X9). */
export function AchievementsGrid() {
  const unlocked = useUnlockedAchievements();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <HighlightHeading
        highlight="Conquistas"
        description={
          unlocked.data
            ? `${unlocked.data.length} de ${ACHIEVEMENTS.length} desbloqueadas`
            : undefined
        }
      />

      {unlocked.isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-card" />
          ))}
        </div>
      )}

      {unlocked.isError && (
        <ErrorState onRetry={() => unlocked.refetch()} />
      )}

      {unlocked.data && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlocked.data.includes(achievement.code);

            return (
              <li key={achievement.code}>
                <Card
                  className={cn(
                    "flex h-full flex-col items-center gap-2 p-4 text-center",
                    !isUnlocked && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-12 place-items-center rounded-full",
                      isUnlocked
                        ? "bg-tint-pessego-solid text-ink-inverse"
                        : "bg-surface-muted text-ink-muted",
                    )}
                  >
                    {isUnlocked ? (
                      <AchievementIcon icon={achievement.icon} className="size-6" />
                    ) : (
                      <Lock className="size-5" aria-hidden />
                    )}
                  </span>
                  <p className="text-sm font-semibold text-ink">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {achievement.description}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
