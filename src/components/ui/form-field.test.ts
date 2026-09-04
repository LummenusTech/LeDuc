import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormField, TextInput } from "@/components/ui/form-field";

describe("FormField", () => {
  it("associa rótulo e ajuda ao campo de forma acessível", () => {
    const markup = renderToStaticMarkup(
      FormField({
        id: "nome",
        label: "Nome",
        hint: "Como você prefere ser chamado",
        children: createElement(TextInput, { id: "nome", name: "nome" }),
      }),
    );

    expect(markup).toContain('for="nome"');
    expect(markup).toContain('id="nome-ajuda"');
    expect(markup).toContain('aria-describedby="nome-ajuda"');
  });

  it("anuncia erro e marca o campo como inválido", () => {
    const markup = renderToStaticMarkup(
      FormField({
        id: "email",
        label: "E-mail",
        error: "Digite um e-mail válido",
        children: createElement(TextInput, { id: "email", name: "email" }),
      }),
    );

    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-describedby="email-erro"');
  });
});
