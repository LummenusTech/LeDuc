import type { Metadata } from "next";

import { A11yControls } from "@/components/a11y/a11y-controls";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Preferências · LeDuc" };

export default function PreferencesPage() {
  return (
    <Card className="max-w-xl p-6">
      <h2 className="text-lg font-bold text-ink">Como o LeDuc aparece</h2>
      <p className="mt-0.5 text-sm text-ink-muted">
        São os mesmos ajustes do botão “Acessibilidade” no topo da tela — mudar
        aqui muda lá.
      </p>

      <div className="mt-6">
        <A11yControls />
      </div>
    </Card>
  );
}
