"use client";

import { ArrowRight, BookOpen, Clock, Flame, Target } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/feedback/states";
import { Card, Skeleton } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import {
  useModulePerformance,
  useUserStats,
} from "@/features/analytics/hooks";
import {
  AreaPerformanceBar,
  DonutProgress,
  MetricRow,
} from "@/features/analytics/components/profile-parts";

/**
 * Aba Resumo do perfil.
 *
 * O card de desempenho por área aponta para `/progresso`, que é a única tela
 * de desempenho do produto — decisão de produto para não manter duas telas
 * mostrando o mesmo número por caminhos diferentes.
 */
export function ProfileSummary() {
  const stats = useUserStats();
  const performance = useModulePerformance();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink">Seu progresso geral</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Veja como você tem evoluído
        </p>

        {stats.isPending && <Skeleton className="mt-5 h-56" />}
        {stats.isError && (
          <ErrorState className="mt-5" onRetry={() => stats.refetch()} />
        )}

        {stats.data && (
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <DonutProgress
              value={stats.data.overallProgressPct}
              caption="de concluído"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <MetricRow
                icon={BookOpen}
                tint="violeta"
                label="Lições concluídas"
                value={`${stats.data.lessonsCompleted} de ${stats.data.lessonsTotal}`}
              />
              <MetricRow
                icon={Target}
                tint="verde"
                label="Taxa de retenção"
                value={`${stats.data.retentionRate}%`}
              />
              <MetricRow
                icon={Clock}
                tint="pessego"
                label="Tempo de estudo"
                value={formatStudyTime(stats.data.studyTimeMinutes)}
              />
              <MetricRow
                icon={Flame}
                tint="azul"
                label="Sequência de estudos"
                value={`${stats.data.streakDays} ${
                  stats.data.streakDays === 1 ? "dia" : "dias"
                }`}
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="flex flex-col p-5">
        <h2 className="text-lg font-bold text-ink">Desempenho por área</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Como você foi em cada módulo
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

        <Link
          href={ROUTES.student.progress}
          className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start pt-5 text-sm font-semibold text-primary hover:underline"
        >
          Ver desempenho completo
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Card>
    </div>
  );
}

function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}
