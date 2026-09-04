"use client";

import { ChevronRight, LogOut, ShieldCheck, User, Wifi } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, HighlightHeading } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { useSignOut } from "@/features/auth/hooks";

export function SettingsPage() {
  const router = useRouter();
  const signOut = useSignOut();

  async function handleSignOut() {
    await signOut.mutateAsync();
    router.push(ROUTES.auth.signIn);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <HighlightHeading highlight="Configurações" />

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Conta
        </h2>
        <Card className="divide-y divide-line overflow-hidden p-0">
          <SettingsRow
            icon={User}
            label="Editar perfil"
            href={ROUTES.student.profile.edit}
          />
          <SettingsRow
            icon={ShieldCheck}
            label="Preferências de acessibilidade"
            href={ROUTES.student.profile.preferences}
          />
        </Card>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Conectividade
        </h2>
        <Card className="flex items-center gap-3 p-4">
          <Wifi className="size-5 shrink-0 text-ink-muted" aria-hidden />
          <p className="text-sm text-ink-muted">
            Download de conteúdo para uso offline chega numa próxima versão.
            Por enquanto, suas respostas já ficam salvas no aparelho e
            sincronizam sozinhas quando a conexão voltar.
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Sessão
        </h2>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-danger"
          isLoading={signOut.isPending}
          onClick={handleSignOut}
        >
          <LogOut className="size-5" aria-hidden />
          Sair da conta
        </Button>
      </section>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof User;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-touch items-center gap-3 px-4 hover:bg-surface-muted"
    >
      <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex-1 font-medium text-ink">{label}</span>
      <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
    </Link>
  );
}
