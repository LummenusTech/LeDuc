"use client";

import { Award, BookOpen, Pencil, Target, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Card, HighlightHeading, Skeleton } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { USER_ROLE_LABELS } from "@/core/domain/types";
import { useUserStats } from "@/features/analytics/hooks";
import { StatTile } from "@/features/analytics/components/profile-parts";
import { useSession } from "@/features/auth/hooks";
import { cn } from "@/lib/cn";

const PROFILE_TABS = [
  { label: "Resumo", href: ROUTES.student.profile.root },
  { label: "Conquistas", href: ROUTES.student.profile.achievements },
  { label: "Atividades", href: ROUTES.student.profile.activity },
  { label: "Preferências", href: ROUTES.student.profile.preferences },
];

/**
 * Cabeçalho do perfil, compartilhado por todas as abas.
 *
 * As abas são rotas aninhadas, não estado local: permitem link direto,
 * preservam o botão voltar e dividem o código por aba.
 */
export function ProfileHeader() {
  const pathname = usePathname();
  const session = useSession();
  const stats = useUserStats();

  const user = session.data?.user;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <HighlightHeading
          before="Olá, "
          highlight={user?.name ?? "estudante"}
          after="!"
          description="Gerencie seu perfil e acompanhe sua jornada de aprendizado"
        />

        <Link
          href={ROUTES.student.profile.edit}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border-2 border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
        >
          <Pencil className="size-4" aria-hidden />
          Editar perfil
        </Link>
      </div>

      <Card className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            className="grid size-20 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"
            aria-hidden
          >
            <UserIcon className="size-10" />
          </span>

          <div className="min-w-0">
            {user ? (
              <p className="truncate text-lg font-bold text-ink">{user.name}</p>
            ) : (
              <Skeleton className="h-6 w-28" />
            )}
            <p className="text-sm text-ink-muted">
              {user ? USER_ROLE_LABELS[user.role] : ""}
            </p>
            <p className="mt-1 truncate text-xs text-ink-muted">{user?.email}</p>
            {user && (
              <p className="text-xs text-ink-muted">
                Membro desde {formatMonthYear(user.memberSince)}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[28rem]">
          {stats.isPending ? (
            Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-card" />
            ))
          ) : stats.data ? (
            <>
              <StatTile
                icon={BookOpen}
                tint="violeta"
                value={`${stats.data.lessonsCompleted}`}
                label="lições concluídas"
              />
              <StatTile
                icon={Target}
                tint="verde"
                value={`${stats.data.retentionRate}%`}
                label="taxa de retenção"
              />
              <StatTile
                icon={Award}
                tint="pessego"
                value={`${stats.data.achievementsCount}`}
                label="conquistas"
              />
            </>
          ) : null}
        </div>
      </Card>

      <nav aria-label="Seções do perfil" className="border-b border-line">
        <ul className="scrollbar-hidden -mb-px flex gap-1 overflow-x-auto">
          {PROFILE_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-12 items-center whitespace-nowrap border-b-2 px-4 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function formatMonthYear(iso: string): string {
  // `timeZone: "UTC"`: sem isso, uma data gravada à meia-noite UTC recua um dia
  // no fuso do Brasil e "abr/2025" vira "mar/2025".
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
