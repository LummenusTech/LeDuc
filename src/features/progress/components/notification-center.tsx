"use client";

import {
  Bell,
  Calendar,
  Flame,
  Megaphone,
  Repeat,
  type LucideIcon,
} from "lucide-react";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Card, HighlightHeading, Skeleton } from "@/components/ui/primitives";
import type { NotificationKind } from "@/core/domain/scheduling";
import { useNotifications } from "@/features/progress/hooks";
import { cn } from "@/lib/cn";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  announcement: Megaphone,
  upcoming_event: Calendar,
  streak_at_risk: Flame,
  review_available: Repeat,
};

const KIND_TINT: Record<NotificationKind, string> = {
  announcement: "bg-tint-azul-soft text-tint-azul-ink",
  upcoming_event: "bg-tint-violeta-soft text-tint-violeta-ink",
  streak_at_risk: "bg-tint-pessego-soft text-tint-pessego-ink",
  review_available: "bg-tint-verde-soft text-tint-verde-ink",
};

/**
 * Central de notificações — nada digitado à mão (RN-C2): tudo aqui é
 * derivado do estado atual por `deriveNotifications`.
 */
export function NotificationCenter() {
  const notifications = useNotifications();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <HighlightHeading highlight="Notificações" />

      {notifications.isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-card" />
          ))}
        </div>
      )}

      {notifications.isError && (
        <ErrorState onRetry={() => notifications.refetch()} />
      )}

      {notifications.data && notifications.data.length === 0 && (
        <EmptyState
          icon={Bell}
          title="Tudo em dia"
          description="Nenhum aviso novo por aqui agora."
        />
      )}

      {notifications.data && notifications.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {notifications.data.map((notification, index) => {
            const Icon = KIND_ICON[notification.kind];
            return (
              <li key={`${notification.kind}-${notification.sourceId ?? index}`}>
                <Card className="flex items-start gap-3 px-4 py-3.5">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      KIND_TINT[notification.kind],
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">
                      {notification.title}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {notification.description}
                    </p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
