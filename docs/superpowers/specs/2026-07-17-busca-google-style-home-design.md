# Home tipo Google com busca semântica única

Data: 2026-07-17

## Contexto

Hoje a home (`src/app/page.tsx`) carrega tudo simultaneamente, mesmo antes de o
usuário interagir: a caixa de busca semântica (`SemanticSearch`), o formulário
de filtros exatos (`SearchForm`) e a tabela paginada completa
(`MedicineTable`, buscada via `searchMedicines(1, 10)` no server). Isso deixa a
home pesada e obriga o usuário a lidar com filtros e tabela antes mesmo de
saber o que quer.

## Objetivo

A home vira uma página de busca minimalista, no estilo Google: título +
uma única caixa de busca. A busca semântica (IA) é o único mecanismo de busca
na home. O usuário só vê resultados depois de buscar, e escolhe se quer
visualizá-los como cards ou como tabela. A filtragem manual exata (por
referência/princípio ativo/nome/categoria) e a navegação paginada por toda a
base continuam existindo, mas migram para uma página separada de busca
avançada.

## Arquitetura

```
/                    → Home: hero + caixa de busca única (client component)
/buscar-avancado     → Filtros exatos + tabela paginada completa (conteúdo atual da home, movido)
```

### 1. `src/app/page.tsx` (reescrito)

Deixa de ser `async` e de buscar dados no servidor. Vira uma seção estática:

- Badge + título (mantém o texto/estilo atual: "Medicamentos Intercambiáveis").
- Subtítulo curto explicando a busca (reaproveita o texto atual).
- Renderiza `<SemanticSearch />` centralizado, largura máxima menor que hoje
  (ex.: `max-w-3xl mx-auto`) para reforçar a metáfora "caixa de busca única".
- Abaixo da caixa, um link discreto: `Busca avançada e listagem completa →`
  apontando para `/buscar-avancado`.
- Sem `Suspense`, sem `getDistinctValues`, sem `searchMedicines` — nada é
  buscado até o usuário digitar.

### 2. `src/components/medicines/semantic-search.tsx` (estendido)

Mantém a lógica de busca atual (`semanticSearch(query, 20)`) e a listagem em
cards. Adiciona:

- Estado `view: 'cards' | 'table'`, default `'cards'`.
- Um toggle (dois botões pequenos, estilo `Button variant="ghost"`/`primary`
  ativo) visível somente quando `results.length > 0`, com os rótulos "CARDS" e
  "TABELA".
- Quando `view === 'table'`, renderiza os mesmos `results` (já em memória, sem
  nova query) no novo componente `SemanticResultsTable` (ver abaixo) em vez da
  lista de cards atual.
- Nenhuma mudança na chamada de busca, no debounce/skeleton de loading, nem no
  estado vazio ("Nenhum resultado encontrado...").
- Ajuste de layout: como a home não tem mais o card branco com borda-8 ao
  redor (`bg-white border-8 ...` que hoje envolve `SemanticSearch` +
  `SearchForm` + `MedicineTable` em `page.tsx`), o próprio
  `SemanticSearch` passa a levar essa moldura (`border-4/8 border-brutalist-black
  bg-white shadow-hard-lg`) para preservar a identidade visual brutalista.

### 3. Novo `src/components/medicines/semantic-results-table.tsx`

Componente novo, simples e só leitura:

- Props: `results: { score: number; medicine: MedicineResult }[]`.
- Renderiza uma tabela reaproveitando o mesmo conjunto de colunas visíveis do
  `MedicineTable` (reference, activeIngredient, tradeName, similarHolder,
  category, status, pharmaceuticalForm, concentration, inclusionDate) mais uma
  coluna de relevância (`score` em %).
  - Para evitar duplicar a lista `columns` mobile/desktop, exportar essa
    constante de `medicine-table.tsx` (ex.: `export const columns = [...]`) e
    importá-la aqui.
- Cada linha do `tradeName`/`reference` linka para `/medicamento/[id]`, igual
  à tabela atual.
- Sem checkboxes de seleção, sem `ExportButton`, sem paginação (a lista já é
  o `topK` fixo de 20 itens vindo da busca semântica).
- Sem chamada de rede própria — é puramente uma re-renderização dos dados que
  o `SemanticSearch` já tem em estado.

### 4. Nova rota `src/app/buscar-avancado/page.tsx`

Cópia do conteúdo atual de `src/app/page.tsx` (versão pré-mudança), sem
alterações funcionais:

- `async function`, busca `searchMedicines(1, 10)` e `getDistinctValues` para
  os 4 campos, como hoje.
- Renderiza `SearchForm` + `MedicineTable` dentro do mesmo card branco com
  borda grossa (`border-8 shadow-hard-lg`).
- Título da seção ajustado para refletir o contexto (ex.: badge "BUSCA
  AVANÇADA" em vez de "LISTA ANVISA"), mantendo o restante do estilo.
- `SemanticSearch` **não** aparece nesta página — ela é exclusiva da home.

### 5. `src/components/layout/header.tsx`

Adiciona um item de navegação `{ href: "/buscar-avancado", label: "BUSCA
AVANÇADA" }` na lista `navLinks`, entre "MEDICAMENTOS" e "REFERÊNCIAS", para
que a página não fique órfã de navegação (além do link discreto na home).

## Fluxo de dados

1. Usuário abre `/` → nenhum fetch acontece.
2. Usuário digita e busca → `semanticSearch(query, 20)` (já existente) roda
   via server action, popula `results` no estado do `SemanticSearch`.
3. Usuário alterna "CARDS"/"TABELA" → troca puramente client-side, sem nova
   busca.
4. Usuário clica em "Busca avançada" → navega para `/buscar-avancado`, que
   carrega filtros + tabela completa como a home fazia antes.
5. Dentro de `/buscar-avancado`, comparar/exportar/paginar continuam
   funcionando exatamente como hoje (nenhuma mudança nesses arquivos).

## Tratamento de erros e estados vazios

- Mantém o comportamento atual do `SemanticSearch`: erro na busca ⇒
  `results = []` silenciosamente (já é assim hoje, sem mudança de escopo).
- Estado "nenhum resultado" já existente continua igual, independente da view
  ativa (cards/tabela) — se `results.length === 0`, o toggle nem aparece.
- `/buscar-avancado` mantém o estado vazio já existente do `MedicineTable`
  ("NENHUM MEDICAMENTO ENCONTRADO").

## Testes / verificação

Não há suíte de testes automatizados no projeto para esses componentes
(`medicamentos` não tem testes de UI configurados). Verificação será manual,
via `/verify` ou execução do dev server:

- Home carrega vazia, sem tabela/filtros, com a caixa de busca centralizada.
- Buscar um termo (ex.: "anti-inflamatório para articulação") retorna cards
  como hoje.
- Toggle "TABELA" mostra os mesmos resultados em formato tabular, com link
  funcional para `/medicamento/[id]`.
- Link "Busca avançada" leva a `/buscar-avancado`, que reproduz a experiência
  atual de filtros + tabela paginada + comparar + exportar sem regressões.
- Item "BUSCA AVANÇADA" aparece no header em desktop e no menu mobile.

## Fora de escopo

- Nenhuma mudança no motor de busca semântica (`semanticSearch`,
  embeddings, modelo).
- Nenhuma mudança em `/dashboard`, `/referencias`, `/atc`, `/compare`,
  `/admin`.
- `MedicineTable`, `SearchForm`, `ExportButton` não são alterados — apenas
  movidos de contexto (renderizados em `/buscar-avancado` em vez de `/`).
- Sem comparar/exportar na tabela de resultados semânticos (decisão
  confirmada com o usuário).
