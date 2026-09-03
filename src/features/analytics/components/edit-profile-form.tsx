"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, HighlightHeading, Skeleton } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { toUserMessage } from "@/core/domain/errors";
import type { User } from "@/core/domain/types";
import { useSession, useUpdateProfile } from "@/features/auth/hooks";

export function EditProfileForm() {
  const session = useSession();

  if (session.isPending || !session.data) {
    return (
      <div className="mx-auto max-w-xl">
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  // Só monta depois que `user` chega — o estado inicial do campo nasce certo
  // sem precisar de um efeito para sincronizar com a query.
  return <EditProfileFormLoaded user={session.data.user} />;
}

function EditProfileFormLoaded({ user }: { user: User }) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user.name);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      router.push(ROUTES.student.profile.root);
    } catch {
      // Erro exibido abaixo, a partir de `updateProfile.error`.
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <HighlightHeading highlight="Editar perfil" />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              Nome
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={1}
              className="min-h-touch w-full rounded-control border-2 border-line bg-surface px-4 text-base text-ink focus-visible:border-primary focus-visible:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              E-mail
            </span>
            <input
              type="email"
              value={user.email}
              disabled
              className="min-h-touch w-full rounded-control border-2 border-line bg-surface-muted px-4 text-base text-ink-muted"
            />
            <span className="mt-1 block text-xs text-ink-muted">
              O e-mail não pode ser alterado neste protótipo.
            </span>
          </label>

          {updateProfile.isError && (
            <p role="alert" className="text-sm font-medium text-danger">
              {toUserMessage(updateProfile.error)}
            </p>
          )}

          {updateProfile.isSuccess && (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <Check className="size-4" aria-hidden />
              Perfil atualizado.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              isLoading={updateProfile.isPending}
              disabled={name.trim().length === 0}
            >
              Salvar alterações
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(ROUTES.student.profile.root)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
