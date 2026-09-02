import {
  Bell,
  CircleHelp,
  House,
  Layers,
  Settings,
  SlidersHorizontal,
  User,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/config/routes";

/**
 * A navegação do aluno, descrita uma única vez.
 *
 * `SideNav` (desktop), `BottomNav` (mobile) e `NavDrawer` são três apresentações
 * desta mesma lista. Duas listas mantidas em paralelo divergem — esta não pode.
 */

export type NavItem = {
  /** Rótulo exibido. Também é o rótulo acessível: ícone nunca vai sozinho. */
  label: string;
  href: string;
  icon: LucideIcon;
  /** Casa a rota atual quando ela começa com `href`, para seções com subrotas. */
  matchPrefix?: boolean;
};

/** Itens principais. Viram a barra inferior no mobile. */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Início", href: ROUTES.student.home, icon: House },
  { label: "Trilhas", href: ROUTES.student.tracks, icon: Layers, matchPrefix: true },
  { label: "Progresso", href: ROUTES.student.progress, icon: SlidersHorizontal },
  {
    label: "Perfil",
    href: ROUTES.student.profile.root,
    icon: User,
    matchPrefix: true,
  },
];

/** Itens secundários. Rodapé da barra lateral no desktop, gaveta no mobile. */
export const SECONDARY_NAV: NavItem[] = [
  { label: "Notificações", href: ROUTES.student.notifications, icon: Bell },
  { label: "Configurações", href: ROUTES.student.settings, icon: Settings },
];

export const HELP_NAV: NavItem = {
  label: "Precisa de ajuda?",
  href: ROUTES.student.help,
  icon: CircleHelp,
};

/** Decide se um item está ativo para o caminho atual. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}
