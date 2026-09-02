"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Única porta de acesso a dados da interface.
 *
 * Os componentes chamam hooks de feature, que chamam repositórios. Trocar os
 * mocks por API não toca em componente algum — e este mesmo cache é o que
 * sustentará o funcionamento offline.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Conexão instável é premissa do público: não refazer requisição a
            // cada foco de janela, e manter o dado em cache por bastante tempo.
            staleTime: 60_000,
            gcTime: 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
