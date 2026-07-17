# Histórias de Usuário

## US-01: Consultar Medicamento por Referência

**Como** usuário do sistema  
**Quero** pesquisar um medicamento pelo número de registro ANVISA  
**Para** verificar rapidamente se o medicamento está na lista de intercambiáveis

**Critérios de Aceitação:**
- Campo de busca por referência com auto-complete
- Resultados em tabela paginada (10/25/50 por página)
- Colunas: referência, princípio ativo, nome comercial, detentor, categoria, situação
- Ao clicar no nome, abre página de detalhes com breadcrumbs

## US-02: Busca por Princípio Ativo e Categoria

**Como** profissional de saúde  
**Quero** buscar medicamentos por princípio ativo e filtrar por categoria  
**Para** encontrar rapidamente opções disponíveis

**Critérios de Aceitação:**
- Campo de busca com auto-complete
- Dropdown de categoria (Similar, Genérico, Novo, etc.)
- Pills de situação (Todos, Ativo, Inativo) com highlight visual
- Resultados paginados

## US-03: Comparar Medicamentos

**Como** farmacêutico  
**Quero** selecionar 2 ou mais medicamentos e compará-los lado a lado  
**Para** identificar diferenças de concentração, forma farmacêutica, detentor, tarja, ATC e preço

**Critérios de Aceitação:**
- Seleção por checkbox na tabela
- Botão "Comparar" habilitado com 2+ selecionados
- Tabela comparativa com 14 campos lado a lado
- Destaque visual para campos diferentes (badge "DIFERENTE")

## US-04: Explorar Medicamentos de Referência

**Como** usuário  
**Quero** navegar pela lista de medicamentos de referência  
**Para** ver todos os similares intercambiáveis de cada referência

**Critérios de Aceitação:**
- Lista de referências ordenada por quantidade de similares
- Badge com contagem de similares
- Ao clicar, mostra grid com cards de similares
- Cada card mostra nome, princípio ativo, categoria, situação
- Links para página de detalhes

## US-05: Navegar por Classificação ATC

**Como** pesquisador  
**Quero** explorar medicamentos organizados por classificação ATC  
**Para** entender o panorama terapêutico disponível

**Critérios de Aceitação:**
- Visualização em árvore com 3 níveis (Anatômico → Terapêutico → Químico)
- Contagem de subcódigos por nível
- Drill-down por código
- Tabela de medicamentos com nome, princípio ativo, detentor, categoria, situação

## US-06: Ver Detalhes Completos do Medicamento

**Como** usuário  
**Quero** acessar uma página com todas as informações de um medicamento  
**Para** ter uma visão completa antes de tomar uma decisão

**Critérios de Aceitação:**
- Breadcrumbs de navegação
- 17 campos informativos (referência, princípio ativo, ATC, tarja, preços, etc.)
- Botão "Copiar" ao lado do número de registro
- Link para bula eletrônica ANVISA
- Card com medicamento de referência (se houver)
- Lista de similares (se for referência)
- Gráfico de barras com preços CMED
- JSON-LD (Schema.org) para SEO
- Meta tags dinâmicas (title, description, OG)

## US-07: Explorar Medicamentos por Detentor

**Como** profissional  
**Quero** ver todos os medicamentos de um determinado laboratório  
**Para** analisar o portfólio de uma empresa

**Critérios de Aceitação:**
- Link clicável no nome do detentor na página de detalhes
- Página com tabela de todos os medicamentos da empresa
- Contagem total, ativos e categorias
- Filtro por situação

## US-08: Dashboard com Estatísticas

**Como** administrador  
**Quero** ver estatísticas consolidadas  
**Para** monitorar a base de dados

**Critérios de Aceitação:**
- Total de medicamentos e distintos
- Contagem de ativos vs inativos
- Top 10 medicamentos mais frequentes
- Top 10 princípios ativos
- Distribuição por categoria
- Timeline de registros por ano (gráfico de barras)

## US-09: Sincronizar Base com ANVISA

**Como** administrador  
**Quero** sincronizar a base com os dados abertos mais recentes da ANVISA  
**Para** manter as informações atualizadas

**Critérios de Aceitação:**
- Botão "Sincronizar" na página admin
- Verificação de data via `Last-Modified` (só baixa se alterado)
- Indicador visual de carregamento
- Substituição completa dos dados
- Registro em SyncLog (type, count, status, timestamp)
- Seção separada para preços CMED
- Exibição de data do arquivo ANVISA e última sincronização

## US-10: Busca Semântica por IA

**Como** usuário  
**Quero** descrever o medicamento que preciso em linguagem natural  
**Para** encontrar resultados mesmo sem saber o nome exato

**Critérios de Aceitação:**
- Campo de texto livre na home
- IA 100% local (Xenova Transformers), sem custo de API
- Resultados ordenados por relevância semântica (score %)
- Contexto enriquecido: nome, princípio ativo, sinônimos, indicações
- Cards com link para detalhes, badge de categoria e situação

## US-11: Exportar Dados

**Como** usuário  
**Quero** exportar os resultados da busca  
**Para** analisar offline ou compartilhar

**Critérios de Aceitação:**
- Botão de exportar na página de resultados
- Formatos: CSV e XLSX
- Respeita os filtros aplicados na busca
- Colunas: todas as informações disponíveis
