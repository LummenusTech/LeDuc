import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

import {
  A11Y_BOOTSTRAP_SCRIPT,
  A11yProvider,
} from "@/components/a11y/a11y-provider";
import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeDuc",
  description:
    "Plataforma de alfabetização de jovens e adultos para comunidades ribeirinhas.",
};

export const viewport: Viewport = {
  themeColor: "#6127c9",
  // Nunca impedir o zoom: ampliar a tela é a primeira ferramenta de quem tem
  // baixa visão, e travá-la quebraria o requisito de acessibilidade do produto.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `suppressHydrationWarning`: o script abaixo grava `data-font-scale` e
    // `data-contrast` no <html> antes da hidratação, de propósito — é o que
    // evita a tela piscar no tamanho padrão para quem escolheu fonte maior.
    // O servidor não tem como saber essas preferências, então a diferença é
    // esperada e não indica bug.
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/* Script cru, e não `next/script`: precisa rodar antes da primeira
            pintura, e `beforeInteractive` não é confiável aqui. */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <A11yProvider>{children}</A11yProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
