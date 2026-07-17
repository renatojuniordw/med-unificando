# Histórias de Usuário

## US-01: Consultar Medicamento por Referência

**Como** usuário do sistema  
**Quero** pesquisar um medicamento pelo número de registro ANVISA  
**Para** verificar rapidamente se o medicamento está na lista de intercambiáveis

**Critérios de Aceitação:**
- Campo de busca por referência (número de registro)
- Auto-complete com sugestões
- Resultados em tabela paginada com nome, princípio ativo, detentor
- Ao clicar no medicamento, abre página de detalhes

## US-02: Busca por Princípio Ativo

**Como** profissional de saúde  
**Quero** buscar todos os medicamentos que contenham um determinado princípio ativo  
**Para** comparar opções disponíveis no mercado

**Critérios de Aceitação:**
- Filtro por princípio ativo
- Auto-complete
- Resultados agrupados ou listados com suas respectivas apresentações

## US-03: Comparar Medicamentos

**Como** farmacêutico  
**Quero** selecionar 2 ou mais medicamentos e compará-los lado a lado  
**Para** identificar diferenças de concentração, forma farmacêutica, detentor e preço

**Critérios de Aceitação:**
- Seleção por checkbox na tabela
- Botão "Comparar" habilitado com 2+ selecionados
- Tabela comparativa com campos lado a lado
- Destaque visual para campos diferentes
- Links para página de detalhes

## US-04: Explorar Medicamentos de Referência

**Como** usuário  
**Quero** navegar pela lista de medicamentos de referência  
**Para** ver todos os similares intercambiáveis de cada referência

**Critérios de Aceitação:**
- Lista de medicamentos de referência ordenada por quantidade de similares
- Ao clicar, mostra todos os similares com situação (ativo/inativo)
- Links para detalhes de cada similar

## US-05: Navegar por Classificação ATC

**Como** pesquisador  
**Quero** explorar medicamentos organizados por classificação ATC  
**Para** entender o panorama terapêutico disponível

**Critérios de Aceitação:**
- Visualização em árvore (níveis 1 a 3)
- Drill-down por nível
- Lista de medicamentos ao selecionar um código ATC

## US-06: Dashboard Estatístico

**Como** administrador  
**Quero** ver estatísticas consolidadas da base de dados  
**Para** monitorar a quantidade e distribuição dos medicamentos

**Critérios de Aceitação:**
- Total de medicamentos
- Total de medicamentos distintos
- Contagem de ativos vs inativos
- Top 10 medicamentos mais frequentes
- Top 10 princípios ativos
- Distribuição por categoria

## US-07: Sincronizar Base com ANVISA

**Como** administrador  
**Quero** sincronizar a base de dados com os dados abertos mais recentes da ANVISA  
**Para** manter as informações atualizadas

**Critérios de Aceitação:**
- Botão "Sincronizar" na página admin
- Verificação de data do arquivo (só baixa se alterado)
- Indicador visual de progresso
- Substituição completa dos dados
- Log de resultados
- Seção separada para sincronização de preços CMED

## US-08: Busca Semântica por IA

**Como** usuário  
**Quero** descrever o medicamento que preciso em linguagem natural  
**Para** encontrar resultados mesmo sem saber o nome exato ou princípio ativo

**Critérios de Aceitação:**
- Campo de texto livre
- Processamento local (sem envio para API externa)
- Resultados ordenados por relevância semântica
- Score de similaridade visível
- Funciona sem conexão com internet (após primeiro carregamento)
