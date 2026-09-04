# LeDuc Professional UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar todas as telas existentes do protótipo LeDuc em uma experiência visual profissional, consistente e acessível, preservando a paleta e a lógica de negócio atuais.

**Architecture:** A reforma começa no sistema visual compartilhado e nos componentes-base, para que as páginas recebam o novo padrão sem duplicação. Em seguida, os grupos de telas são migrados por jornada, mantendo dados, hooks e regras de domínio intactos. A validação combina gates automatizados, auditoria estática de acessibilidade e percurso visual responsivo.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, class-variance-authority, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-professional-ui-ux-design.md`

## Global Constraints

- Preservar a paleta atual; novos valores hexadecimais só podem existir em `src/app/globals.css`.
- Não alterar regras de domínio, contratos de dados ou comportamento pedagógico.
- Manter alvo de toque mínimo de 48 px e 56 px nas ações principais.
- Todo campo deve ter rótulo visível e associação acessível.
- Cor não pode ser o único indicador de estado.
- Validar em 375 × 812, 768 × 1024, 1280 × 800 e 1440 × 900.
- Manter tamanho de fonte, alto contraste, leitura em voz alta e movimento reduzido funcionais.

---

### Task 1: Sistema visual e primitives compartilhadas

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/primitives.tsx`
- Create: `src/components/ui/form-field.tsx`
- Create: `src/components/ui/page-header.tsx`
- Modify: `src/components/feedback/states.tsx`

**Interfaces:**
- Consumes: `cn(...inputs)` e tokens Tailwind existentes.
- Produces: `FormField`, `TextInput`, `TextArea`, `SelectField`, `PageHeader`, variantes `Card` e variantes completas de `Button`.

- [ ] **Step 1: Registrar o contrato visual verificável**

Adicionar tipos explícitos para estados e variantes: `Button` com `primary | secondary | soft | ghost | quiet | danger`; `Card` com `default | interactive | featured | metric`; campos com `label`, `hint`, `error`, `leadingIcon` e `id` obrigatório.

- [ ] **Step 2: Executar a checagem antes da implementação**

Run: `npm run typecheck`
Expected: PASS na base atual; os novos contratos ainda não existem.

- [ ] **Step 3: Refinar tokens e estilos globais**

Adicionar tokens de largura de conteúdo, sombras curta/elevada, bordas, estados pressionados, seleção, transições e utilitários de texto legível. Manter todas as cores literais exclusivamente em `globals.css` e garantir `prefers-reduced-motion`.

- [ ] **Step 4: Implementar os componentes-base**

Criar campos com `aria-invalid`, `aria-describedby`, mensagem próxima e rótulo sempre visível. Evoluir botões, cartões, progresso, skeletons e estados para compartilhar altura, foco, profundidade e responsividade.

- [ ] **Step 5: Verificar o sistema-base**

Run: `npm run typecheck && npm run lint`
Expected: PASS sem erros ou avisos novos.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/ui src/components/feedback/states.tsx
git commit -m "feat: refine accessible visual system"
```

### Task 2: Casca, navegação e contexto de página

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/nav-items.tsx`
- Modify: `src/components/layout/brand-mark.tsx`
- Modify: `src/components/a11y/accessibility-panel.tsx`

**Interfaces:**
- Consumes: `Button`, `Card`, `BrandLockup`, `PRIMARY_NAV`, `SECONDARY_NAV`.
- Produces: shell responsivo com cabeçalho coeso, menu desktop refinado, navegação mobile segura e gaveta acessível.

- [ ] **Step 1: Refinar hierarquia e dimensões da casca**

Limitar largura útil, alinhar cabeçalho ao conteúdo, ajustar marca, estados ativos e densidade da barra lateral. Manter rótulos textuais junto aos ícones.

- [ ] **Step 2: Melhorar navegação mobile**

Aplicar área segura, estado ativo com ícone e texto, backdrop refinado, fechamento por Escape e retorno de foco ao botão que abriu a gaveta.

- [ ] **Step 3: Verificar teclado e compilação**

Run: `npm run typecheck && npm run lint`
Expected: PASS; todos os controles somente com ícone têm nome acessível.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout src/components/a11y/accessibility-panel.tsx
git commit -m "feat: polish responsive application shell"
```

### Task 3: Autenticação, onboarding e formulários

**Files:**
- Modify: `src/features/auth/components/sign-in-form.tsx`
- Modify: `src/features/auth/components/recover-password-form.tsx`
- Modify: `src/features/onboarding/components/onboarding-flow.tsx`
- Modify: `src/features/analytics/components/edit-profile-form.tsx`
- Modify: `src/features/analytics/components/settings-page.tsx`
- Modify: `src/features/activity/components/items/fill-blanks-item.tsx`
- Modify: `src/features/activity/components/items/short-answer-item.tsx`

**Interfaces:**
- Consumes: `FormField`, `TextInput`, `TextArea`, `Button`, hooks existentes.
- Produces: formulários consistentes com rótulos visíveis, instruções simples, erro contextual e ações responsivas.

- [ ] **Step 1: Migrar autenticação e perfil**

Substituir campos manuais pelos primitives compartilhados; preservar revelar senha, lembrar acesso, validação, dados de demonstração e redirecionamentos.

- [ ] **Step 2: Migrar preferências e respostas textuais**

Aplicar o mesmo padrão a configurações, lacunas e resposta curta. Estados selecionado, inválido, desabilitado e sucesso devem incluir texto ou ícone além de cor.

- [ ] **Step 3: Verificar formulários**

Run: `npm run typecheck && npm run lint`
Expected: PASS; busca estática não encontra `placeholder` usado como único rótulo.

- [ ] **Step 4: Commit**

```bash
git add src/features/auth src/features/onboarding src/features/analytics/components/edit-profile-form.tsx src/features/analytics/components/settings-page.tsx src/features/activity/components/items
git commit -m "feat: standardize accessible forms"
```

### Task 4: Jornada principal do aluno

**Files:**
- Modify: `src/features/progress/components/student-home.tsx`
- Modify: `src/features/progress/components/continue-track-banner.tsx`
- Modify: `src/features/progress/components/notification-center.tsx`
- Modify: `src/features/content/components/card-carousel.tsx`
- Modify: `src/features/content/components/track-card.tsx`
- Modify: `src/features/content/components/tracks-browser.tsx`
- Modify: `src/features/content/components/all-tracks.tsx`
- Modify: `src/features/content/components/track-detail.tsx`

**Interfaces:**
- Consumes: sistema visual das Tasks 1–2 e hooks existentes.
- Produces: início, trilhas, busca, cards, mapa e notificações com hierarquia profissional e responsividade.

- [ ] **Step 1: Reformar início e destaque de continuidade**

Compactar saudação e sequência, tornar a trilha em andamento a única ação dominante e alinhar skeletons ao conteúdo final.

- [ ] **Step 2: Reformar cards, carrosséis e listagens**

Adicionar capas geométricas em CSS, borda/elevação de interação, snap de rolagem, metadados claros e ações sem duplicidade.

- [ ] **Step 3: Reformar trilha e notificações**

Evidenciar sequência das lições com ícone + rótulo, explicar bloqueios em linguagem simples e organizar notificações por tipo, leitura e ação.

- [ ] **Step 4: Verificar jornada**

Run: `npm run typecheck && npm run lint`
Expected: PASS e nenhuma rolagem horizontal fora dos carrosséis.

- [ ] **Step 5: Commit**

```bash
git add src/features/progress/components src/features/content/components
git commit -m "feat: redesign student learning journey"
```

### Task 5: Lição, atividade, resultado, progresso e perfil

**Files:**
- Modify: `src/features/activity/components/lesson-overview.tsx`
- Modify: `src/features/activity/components/activity-player-screen.tsx`
- Modify: `src/features/activity/components/activity-player.tsx`
- Modify: `src/features/activity/components/activity-result.tsx`
- Modify: `src/features/activity/components/items/multiple-choice-item.tsx`
- Modify: `src/features/activity/components/items/column-match-item.tsx`
- Modify: `src/features/analytics/components/progress-overview.tsx`
- Modify: `src/features/analytics/components/profile-header.tsx`
- Modify: `src/features/analytics/components/profile-parts.tsx`
- Modify: `src/features/analytics/components/profile-summary.tsx`
- Modify: `src/features/analytics/components/achievements-grid.tsx`
- Modify: `src/features/analytics/components/activity-history.tsx`

**Interfaces:**
- Consumes: componentes-base e toda lógica existente de sessão, XP, domínio e progresso.
- Produces: fluxo pedagógico focado, feedback não dependente de cor e painéis de progresso legíveis.

- [ ] **Step 1: Refinar lição e player**

Manter objetivo, duração, progresso, ouvir e tentativas próximos da questão; reduzir distrações; tornar seleção, acerto, erro e revelação inequívocos por ícone e texto.

- [ ] **Step 2: Refinar resultado e próximo passo**

Priorizar mensagem de avanço, XP e ação seguinte; mover desempenho e duração para detalhes secundários sem esconder informação.

- [ ] **Step 3: Refinar progresso, perfil e conquistas**

Padronizar métricas, explicações, navegação entre áreas do perfil, estados bloqueados e histórico responsivo.

- [ ] **Step 4: Verificar regressões de domínio**

Run: `npm run test`
Expected: todos os testes de domínio passam sem alteração de snapshots ou regras.

- [ ] **Step 5: Commit**

```bash
git add src/features/activity/components src/features/analytics/components
git commit -m "feat: polish learning and progress screens"
```

### Task 6: Auditoria final e validação visual

**Files:**
- Modify: somente arquivos com defeitos encontrados na auditoria.

**Interfaces:**
- Consumes: aplicação completa das Tasks 1–5.
- Produces: protótipo verificável, responsivo e sem controles inoperantes.

- [ ] **Step 1: Executar todos os gates**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: quatro comandos passam.

- [ ] **Step 2: Auditar padrões proibidos**

Run: `rg -n "#[0-9a-fA-F]{3,8}" src --glob "!app/globals.css"`
Expected: nenhuma ocorrência.

Run: `rg -n "<(button|a|input|textarea|select)" src`
Expected: cada resultado tem efeito real, rótulo ou nome acessível e estado de foco.

- [ ] **Step 3: Validar rotas principais no navegador**

Percorrer login → início → trilhas → trilha → lição → atividade → resultado → progresso em 375 × 812 e 1440 × 900. Confirmar ausência de corte, sobreposição, rolagem horizontal acidental e botão sem ação.

- [ ] **Step 4: Validar acessibilidade manual**

Percorrer por teclado; ativar fonte maior, alto contraste e movimento reduzido; confirmar foco visível, ordem lógica e conteúdo essencial completo.

- [ ] **Step 5: Commit final**

```bash
git add src
git commit -m "fix: finish responsive ui accessibility audit"
```

