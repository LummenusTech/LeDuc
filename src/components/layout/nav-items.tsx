"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/layout/brand-mark";
import {
  HELP_NAV,
  PRIMARY_NAV,
  SECONDARY_NAV,
  isNavItemActive,
  type NavItem,
} from "@/config/navigation";
import { cn } from "@/lib/cn";

/**
 * As três apresentações da navegação — barra lateral, barra inferior e gaveta.
 *
 * Todas leem a MESMA lista de `config/navigation.ts`. Nenhuma mantém a sua
 * própria cópia dos itens: duas listas em paralelo divergem em pouco tempo.
 */

function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-surface font-semibold text-primary"
          : "text-ink-inverse/85 hover:bg-sidebar-hover hover:text-ink-inverse",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-60 shrink-0 flex-col gap-1 bg-sidebar p-4 lg:flex"
    >
      <BrandLockup className="mb-6 px-2 pt-2" />

      {PRIMARY_NAV.map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          isActive={isNavItemActive(item, pathname)}
        />
      ))}

      <div className="mt-auto flex flex-col gap-1 pt-6">
        {SECONDARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={isNavItemActive(item, pathname)}
          />
        ))}

        <Link
          href={HELP_NAV.href}
          className="mt-3 flex items-center gap-3 rounded-card bg-sidebar-hover p-3 transition-colors hover:bg-primary"
        >
          <HELP_NAV.icon
            className="size-8 shrink-0 text-ink-inverse"
            aria-hidden
          />
          <span className="text-xs leading-tight text-ink-inverse">
            <span className="block font-semibold">{HELP_NAV.label}</span>
            Fale com nosso time
          </span>
        </Link>
      </div>
    </nav>
  );
}

/**
 * Barra inferior — os quatro itens principais em telas estreitas.
 * Cada alvo tem 56px de altura, o mínimo definido no sistema de design.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {PRIMARY_NAV.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-touch flex-col items-center justify-center gap-1 rounded-control text-xs transition-colors",
              isActive
                ? "bg-primary-soft font-semibold text-primary"
                : "text-ink-muted",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Itens secundários no mobile: rodapé da gaveta. */
export function DrawerNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const items = [...SECONDARY_NAV, HELP_NAV];

  return (
    <nav aria-label="Mais opções" className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = isNavItemActive(item, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-touch items-center gap-3 rounded-control px-4 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-soft font-semibold text-primary"
                : "text-ink hover:bg-surface-muted",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
