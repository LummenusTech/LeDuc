"use client";

import { Award, BookOpen, Clock, Flame, Star, Target } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/feedback/states";
import {
  Card,
  ProgressBar,
  Skeleton,
} from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/config/routes";
import {
  useGamificationSummary,
  useModulePerformance,
  useUserStats,
} from "@/features/analytics/hooks";
import {
  AreaPerformanceBar,
  StatTile,
} from "@/features/analytics/components/profile-parts";

/**
 * A única tela de desempenho do produto — XP e nível vêm do ledger real
 * (`GamificationRepository`); lições/retenção/tempo de estudo ainda vêm do
 * agregado estático (`MetricsRepository`), que modela mais currículo do que
 * o protótipo tem lições de verdade.
 */
export function ProgressOverview() {
  const gamification = useGamificationSummary();
  const stats = useUserStats();
  const performance = useModulePerformance();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7">
      <PageHeader eyebrow="Minha aprendizagem" title="Seu progresso" description="Veja o que você já conquistou e qual é o próximo passo." />

      <Card variant="featured" className="p-5 sm:p-6">
        {gamification.isPending && <Skeleton className="h-24" />}
        {gamification.isError && (
          <ErrorState onRetry={() => gamification.refetch()} />
        )}

        {gamification.data && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-ink-inverse">
                  {gamification.data.level}
                </span>
                <div>
                  <p className="font-semibold text-ink">
                    Nível {gamification.data.level}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {gamification.data.xpTotal} XP acumulado
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-ink-muted">
                {gamification.data.xpIntoLevel} / {gamification.data.xpForNextLevel}{" "}
                XP
              </p>
            </div>
            <ProgressBar
              value={
                (gamification.data.xpIntoLevel /
                  gamification.data.xpForNextLevel) *
                100
              }
              label="Progresso para o próximo nível"
            />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {gamification.data && (
          <>
            <StatTile
              icon={Flame}
              tint="pessego"
              value={`${gamification.data.streakDays}`}
              label="dias seguidos"
            />
            <StatTile
              icon={Award}
              tint="violeta"
              value={`${gamification.data.achievementsUnlocked} de ${gamification.data.achievementsTotal}`}
              label="conquistas"
            />
          </>
        )}
        {stats.data && (
          <>
            <StatTile
              icon={BookOpen}
              tint="verde"
              value={`${stats.data.lessonsCompleted}`}
              label="lições concluídas"
            />
            <StatTile
              icon={Target}
              tint="azul"
              value={`${stats.data.retentionRate}%`}
              label="taxa de retenção"
            />
          </>
        )}
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-ink">Desempenho por área</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Domínio médio das lições concluídas em cada módulo
        </p>

        {performance.isPending && <Skeleton className="mt-5 h-40" />}
        {performance.isError && (
          <ErrorState className="mt-5" onRetry={() => performance.refetch()} />
        )}

        {performance.data && (
          <ul className="mt-5 flex flex-col gap-4">
            {performance.data.map((item) => (
              <AreaPerformanceBar key={item.moduleId} item={item} />
            ))}
          </ul>
        )}
      </Card>

      {stats.data && (
        <Card className="flex items-center gap-3 p-5">
          <Clock className="size-6 shrink-0 text-ink-muted" aria-hidden />
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">
              {formatStudyTime(stats.data.studyTimeMinutes)}
            </span>{" "}
            de tempo de estudo acumulado.
          </p>
        </Card>
      )}

      <Link
        href={ROUTES.student.profile.achievements}
        className="inline-flex min-h-touch items-center justify-center gap-2 self-start rounded-control border-2 border-line bg-surface px-6 font-semibold text-primary hover:border-primary"
      >
        <Star className="size-4" aria-hidden />
        Ver todas as conquistas
      </Link>
    </div>
  );
}

function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}
