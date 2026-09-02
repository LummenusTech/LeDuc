import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Editar perfil · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Editar perfil"
      description="Nome, foto e dados de contato."
      phase="Fase 9 do plano"
    />
  );
}
