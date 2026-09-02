import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A regra de ouro, como teste.
 *
 * `core/domain` precisa ser TypeScript puro: sem React, sem Next, sem rede, sem
 * armazenamento e sem relógio. É o que garante que estas mesmas funções rodem
 * no servidor quando o backend existir, em vez de precisarem ser reescritas.
 *
 * Uma regra de arquitetura que só existe num documento é uma regra que vai ser
 * quebrada sem ninguém notar. Esta falha o build.
 */

const DOMAIN_DIR = join(process.cwd(), "src", "core", "domain");

function domainSourceFiles(): string[] {
  return readdirSync(DOMAIN_DIR).filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
  );
}

/**
 * Remove comentários antes de verificar.
 *
 * Sem isso, um comentário explicando a própria regra — "nada de Date.now()" —
 * seria acusado de violá-la.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function readSource(file: string): string {
  return stripComments(readFileSync(join(DOMAIN_DIR, file), "utf8"));
}

const FORBIDDEN_IMPORTS = [
  { pattern: /from\s+["']react["']/, label: "react" },
  { pattern: /from\s+["']next\//, label: "next/*" },
  { pattern: /from\s+["']@\/components\//, label: "componentes" },
  { pattern: /from\s+["']@\/features\//, label: "features" },
  { pattern: /from\s+["']@\/core\/data\//, label: "camada de dados" },
];

const FORBIDDEN_GLOBALS = [
  { pattern: /\bfetch\s*\(/, label: "fetch()" },
  { pattern: /\blocalStorage\b/, label: "localStorage" },
  { pattern: /\bwindow\b/, label: "window" },
  { pattern: /\bdocument\b/, label: "document" },
  { pattern: /\bDate\.now\s*\(/, label: "Date.now()" },
  { pattern: /new\s+Date\s*\(\s*\)/, label: "new Date() sem argumento" },
  { pattern: /\bMath\.random\s*\(/, label: "Math.random()" },
];

describe("core/domain é puro", () => {
  const files = domainSourceFiles();

  it("tem arquivos para verificar", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)("%s não importa React, Next nem camadas acima", (file) => {
    const source = readSource(file);

    for (const { pattern, label } of FORBIDDEN_IMPORTS) {
      expect(
        pattern.test(source),
        `${file} importa ${label}, o que quebra a regra de ouro do domínio.`,
      ).toBe(false);
    }
  });

  it.each(files)("%s não usa rede, armazenamento nem relógio", (file) => {
    const source = readSource(file);

    for (const { pattern, label } of FORBIDDEN_GLOBALS) {
      expect(
        pattern.test(source),
        `${file} usa ${label}. O tempo e o I/O entram por parâmetro — senão as ` +
          `funções não são reprodutíveis nem testáveis.`,
      ).toBe(false);
    }
  });
});
