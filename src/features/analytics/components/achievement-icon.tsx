import {
  BookOpen,
  Flame,
  Medal,
  Repeat,
  Sparkles,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { AchievementIcon as AchievementIconKey } from "@/config/achievements";

/**
 * Traduz a chave de ícone (string, sem React) do catálogo em componente.
 *
 * `config/achievements.ts` guarda só a chave de propósito — nem `config/` nem
 * `core/domain/` importam lucide. É esta camada de UI que faz a ponte.
 */
export const ACHIEVEMENT_ICONS: Record<AchievementIconKey, LucideIcon> = {
  "first-step": Sparkles,
  flame: Flame,
  star: Star,
  trophy: Trophy,
  book: BookOpen,
  target: Target,
  repeat: Repeat,
  medal: Medal,
};

export function AchievementIcon({
  icon,
  className,
}: {
  icon: AchievementIconKey;
  className?: string;
}) {
  const Icon = ACHIEVEMENT_ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
