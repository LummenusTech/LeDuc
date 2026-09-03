"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Award, Clock, Sparkles, Trophy, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, Chip } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { queryKeys } from "@/core/data/query-keys";
import { ACHIEVEMENTS } from "@/config/achievements";
import { AchievementIcon } from "@/features/analytics/components/achievement-icon";
import {
  clearActivityResult,
  readActivityResult,
} from "@/features/activity/result-store";
import { cn } from "@/lib/cn";

/**
 * Tela de resultado — na verdade três, escolhidas pelo que
 * `applyCompletionEffects` devolveu: trilha concluída (RN-P6/RN-X5) supera
 * lição concluída (RN-P5), que supera "só terminou a atividade". A conquista
 * nova aparece sempre, em cima de qualquer uma das três.
 */
export function ActivityResult({
  lessonId,
  activityId,
}: {
  lessonId: string;
  activityId: string;
}) {
  const { data: payload, isPending } = useQuery({
    queryKey: queryKeys.activityResult(activityId),
    queryFn: () => readActivityResult(activityId),
  });

  // O resultado é transitório (RN: só serve pra ponte até esta tela renderizar
  // uma vez) — some da `sessionStorage` assim que a tela é desmontada, para
  // não sobreviver a uma navegação de volta e reaparecer errado depois.
  useEffect(() => () => clearActivityResult(activityId), [activityId]);

  if (isPending) return null;

  if (!payload) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-lg font-semibold text-ink">
          Não encontramos este resultado
        </p>
        <p className="text-sm text-ink-muted">
          Isso acontece quando a página é recarregada. Seu progresso já foi
          salvo — volte para a lição para continuar.
        </p>
        <Link
          href={ROUTES.student.lesson(lessonId)}
          className="inline-flex min-h-touch items-center rounded-control bg-primary px-6 font-semibold text-ink-inverse hover:bg-primary-hover"
        >
          Voltar para a lição
        </Link>
      </div>
    );
  }

  const { summary, effects } = payload;
  const newAchievement = effects.newAchievements[0];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {effects.trackCompletedNow ? (
        <HeroCard
          icon={Trophy}
          title="Trilha concluída!"
          description="Você terminou todas as lições desta trilha."
          tone="celebrate"
        />
      ) : effects.lessonCompletedNow ? (
        <HeroCard
          icon={Award}
          title="Lição concluída!"
          description={`Domínio de ${effects.lessonProgress.masteryScore}% nesta lição.`}
          tone="celebrate"
        />
      ) : (
        <HeroCard
          icon={Sparkles}
          title="Atividade concluída"
          description="Continue para a próxima atividade da lição."
          tone="neutral"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="XP ganho" value={`+${summary.xpEarned}`} />
        <Stat
          label="Desempenho"
          value={`${summary.performancePercent}%`}
        />
        <Stat
          label="Acertos de primeira"
          value={`${summary.correctOnFirstTry} de ${summary.totalItems}`}
        />
        <Stat
          label="Duração"
          value={formatDuration(summary.durationSeconds)}
          icon={Clock}
        />
      </div>

      {summary.pendingReview > 0 && (
        <Card className="px-4 py-3 text-sm text-ink-muted">
          {summary.pendingReview === 1
            ? "1 resposta ficou pendente de correção — o XP dela é somado assim que confirmarmos."
            : `${summary.pendingReview} respostas ficaram pendentes de correção — o XP delas é somado assim que confirmarmos.`}
        </Card>
      )}

      {newAchievement && (
        <AchievementCard code={newAchievement.code} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={ROUTES.student.lesson(lessonId)}
          className="flex-1"
        >
          <Button variant="ghost" className="w-full">
            Ver a lição
          </Button>
        </Link>
        <Link href={ROUTES.student.track(payload.trackId)} className="flex-1">
          <Button className="w-full">Continuar</Button>
        </Link>
      </div>
    </div>
  );
}

function HeroCard({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "celebrate" | "neutral";
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center px-6 py-10 text-center",
        tone === "celebrate" && "bg-primary-soft",
      )}
    >
      <span
        className={cn(
          "mb-4 grid size-16 place-items-center rounded-full",
          tone === "celebrate"
            ? "bg-primary text-ink-inverse"
            : "bg-surface-muted text-ink-muted",
        )}
        aria-hidden
      >
        <Icon className="size-8" />
      </span>
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-ink-muted">{description}</p>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
    </Card>
  );
}

function AchievementCard({ code }: { code: string }) {
  const definition = ACHIEVEMENTS.find((item) => item.code === code);
  if (!definition) return null;

  return (
    <Card className="flex items-center gap-3 border-2 border-tint-pessego-cover bg-tint-pessego-soft px-4 py-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tint-pessego-solid text-ink-inverse">
        <AchievementIcon icon={definition.icon} className="size-5" />
      </span>
      <div>
        <Chip>Nova conquista</Chip>
        <p className="mt-1 font-semibold text-ink">{definition.title}</p>
        <p className="text-sm text-ink-muted">{definition.description}</p>
      </div>
    </Card>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${seconds}s`;
}
