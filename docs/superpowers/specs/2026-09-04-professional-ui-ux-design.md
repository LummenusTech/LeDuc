# LeDuc — Redesenho profissional de UI e UX

## Objetivo

Elevar a interface atual de protótipo para uma apresentação profissional, coesa e acessível, sem alterar a paleta de cores nem as regras de negócio. A experiência deve funcionar bem para estudantes jovens, adultos e idosos em processo de alfabetização, inclusive pessoas com pouca familiaridade com interfaces digitais.

## Princípios

1. Uma ação principal evidente por área da tela.
2. Ícones nunca substituem rótulos essenciais.
3. Textos curtos, concretos e em português simples.
4. Alvos de toque com no mínimo 48 px; ações principais mantêm 56 px.
5. Cor nunca é o único indicador de estado.
6. Campos sempre apresentam rótulo visível, instrução ou exemplo e mensagem de erro próxima.
7. Estados de carregamento, vazio, erro, sucesso e desabilitado seguem o mesmo padrão visual.
8. Preferências de tamanho de fonte, contraste e leitura em voz alta continuam disponíveis.
9. A paleta atual é preservada. O refinamento vem de proporção, contraste, tipografia, espaçamento, bordas e profundidade.

## Sistema visual

### Superfícies e profundidade

- O fundo geral continua claro e levemente violeta.
- Cartões usam borda sutil e sombra curta. Sombras fortes ficam reservadas a menus, diálogos e elementos elevados.
- Cartões interativos ganham mudança discreta de borda e elevação no hover/foco.
- Seções relacionadas usam agrupamento visual e espaçamento consistente, evitando grandes áreas vazias sem função.

### Tipografia

- Títulos de página: fortes, com largura controlada e subtítulo curto.
- Títulos de seção: contraste claro em relação ao conteúdo.
- Texto comum: tamanho confortável, linha mais aberta e largura limitada para facilitar leitura.
- Rótulos e dados importantes não usam caixa alta extensa.
- Números de progresso usam algarismos alinhados e vêm acompanhados de uma explicação textual.

### Espaçamento e formas

- Escala consistente de espaçamento entre página, seção, cartão e controles.
- Raios de borda permanecem acolhedores, mas deixam de variar sem motivo.
- Elementos densos são reorganizados para evitar que cartões e botões pareçam apertados no celular.

## Componentes

### Botões e links de ação

- Quatro níveis claros: principal, secundário, discreto e destrutivo.
- Botões mostram estados de hover, foco, pressionado, carregando e desabilitado.
- Ações críticas ou irreversíveis usam texto explícito; nunca somente um ícone.
- Links que parecem botões compartilham o mesmo componente visual para evitar divergências.
- Ícones decorativos usam `aria-hidden`; botões somente com ícone recebem nome acessível e dica visual quando necessário.

### Campos e formulários

- Criar um componente-base de campo com rótulo visível, descrição opcional, ícone opcional, erro e associação por `id`/`aria-describedby`.
- Inputs, textarea e select compartilham altura, borda, fundo, foco e tipografia.
- Erros usam ícone, texto simples e borda; sucesso usa confirmação textual.
- Campos desabilitados explicam por que não podem ser alterados.
- Formulários evitam placeholders como único rótulo.
- Login, recuperação de senha, edição de perfil, busca e respostas textuais migram para o padrão.

### Cartões

- Criar variantes para cartão informativo, interativo, destaque e métrica.
- Cartões clicáveis mostram affordance clara e foco completo.
- Conteúdo interno segue ordem previsível: contexto, título, descrição, progresso e ação.
- Capas coloridas ganham ilustração geométrica discreta construída com CSS, sem depender de imagens externas.

### Feedback e estados

- Loading usa skeleton com dimensões próximas do conteúdo final.
- Empty state oferece uma próxima ação quando existir.
- Erro explica o que aconteceu e como continuar sem perder progresso.
- Toasts são usados para confirmações transitórias; resultados pedagógicos importantes permanecem visíveis na página.

## Estrutura das telas

### Casca do aplicativo

- Barra lateral desktop com marca melhor dimensionada, agrupamento de navegação e estado ativo mais refinado.
- Cabeçalho superior com título contextual opcional, acessibilidade e notificações.
- Navegação inferior mobile com área segura, rótulos legíveis e estado ativo forte.
- Gaveta mobile recebe foco inicial, fechamento por Escape e bloqueio de foco.

### Início

- Saudação e sequência formam um cabeçalho compacto.
- A trilha em andamento vira o principal destaque, com hierarquia mais clara e única ação dominante.
- Carrosséis recebem alinhamento, snap de rolagem e indicação visual de continuidade.
- Recomendações e revisões aparecem em blocos separados apenas quando houver conteúdo.

### Trilhas e mapa

- Busca e filtros usam o novo padrão de campo.
- Cards apresentam módulo, título, progresso e ação sem duplicidade.
- O mapa reforça a sequência com conexão visual entre lições e estados com ícone + rótulo.
- Lição bloqueada explica de forma simples o que precisa ser concluído.

### Lição, atividade e resultado

- Visão da lição evidencia objetivo, duração e próxima atividade.
- Player reduz distrações e mantém progresso, botão de ouvir, tentativas e instrução sempre próximos da questão.
- Alternativas e pares têm estados selecionado, correto e incorreto claramente distinguíveis sem depender só de cor.
- Resultado prioriza mensagem de avanço, XP e próximo passo; detalhes ficam abaixo.

### Progresso e perfil

- Métricas usam cards consistentes e explicações simples.
- Gráficos têm alternativa textual e não dependem de cor.
- Abas do perfil têm melhor indicação de seleção e rolagem mobile.
- Conquistas bloqueadas e desbloqueadas ficam visualmente distintas, com texto explicativo.

### Configurações, ajuda e notificações

- Configurações usam grupos com títulos e descrições; switches têm estado textual.
- Ajuda ganha busca ou navegação por temas somente se houver volume suficiente; para o protótipo, mantém FAQ enxuto.
- Notificações mostram tipo, data relativa, estado de leitura e ação relacionada quando aplicável.

## Responsividade

- Validar em 375 × 812, 768 × 1024, 1280 × 800 e 1440 × 900.
- Nenhuma rolagem horizontal na página; carrosséis são a única exceção intencional.
- Botões empilham no celular quando não houver largura segura.
- Tabelas ou comparações se transformam em cartões no mobile.

## Acessibilidade

- Contraste mínimo WCAG AA em texto e controles.
- Ordem de foco acompanha a ordem visual.
- Foco visível em todos os elementos interativos.
- Navegação completa por teclado.
- Leitura em voz alta continua funcional no player.
- Respeito a `prefers-reduced-motion`.
- Mensagens dinâmicas importantes usam regiões `aria-live` apropriadas.
- Nenhum texto essencial é truncado sem alternativa.

## Arquitetura de implementação

- Refinar tokens em `src/app/globals.css` sem introduzir cores hexadecimais fora desse arquivo.
- Evoluir os componentes compartilhados em `src/components/ui/` antes das páginas.
- Criar primitives de formulário e feedback reutilizáveis.
- Migrar telas por grupos: autenticação, casca/navegação, início/trilhas, aprendizagem, progresso/perfil e utilitárias.
- Manter lógica de negócio fora dos componentes; esta etapa altera apresentação e interação, não regras do domínio.
- Preservar contratos e dados existentes, exceto ajustes estritamente necessários para estados visuais.

## Verificação

- `npm run typecheck`, `npm run lint`, `npm run test` e `npm run build` devem permanecer limpos.
- Verificação visual das rotas principais em desktop e mobile.
- Auditoria de todos os elementos `button`, `a`, `input`, `textarea`, `select` e controles customizados.
- Teste manual do fluxo: login → início → trilha → lição → atividade → resultado → progresso.
- Teste de teclado, foco visível, fonte maior, alto contraste e movimento reduzido.
- Nenhum botão sem efeito e nenhum campo sem rótulo acessível.

## Fora de escopo

- Trocar a paleta da marca.
- Criar backend, integrações reais ou novas regras pedagógicas.
- Construir os painéis de professor, gestor ou CMS.
- Produzir novas ilustrações rasterizadas.
- Alterar a estrutura de progressão, XP, domínio ou desbloqueio.
