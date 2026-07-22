# Regras de Negócio

## 1. Intercambialidade de Medicamentos

### Definição
Um medicamento **similar** é intercambiável com seu **medicamento de referência** quando atende aos requisitos da RDC 58/2014 da ANVISA.

### Regras
- Todo medicamento Similar possui um medicamento de Referência correspondente
- O farmacêutico pode substituir o medicamento de referência pelo similar (e vice-versa)
- Medicamentos Genéricos também são intercambiáveis com seus referências
- A intercambialidade não se aplica entre diferentes medicamentos de referência

## 2. Categorias ANVISA

| Categoria | Descrição | Origem |
|-----------|-----------|--------|
| Similar | Medicamento similar ao de referência | Registro ANVISA |
| Genérico | Medicamento genérico | Registro ANVISA |
| Novo | Medicamento inovador | Registro ANVISA |
| Específico | Indicação terapêutica específica | Registro ANVISA |
| Fitoterápico | Medicamento à base de plantas | Registro ANVISA |
| Biológico | Medicamento biológico | Registro ANVISA |
| Dinamizado | Medicamento homeopático | Registro ANVISA |
| Radiofármaco | Medicamento radioativo | Registro ANVISA |

Total: ~32.585 registros de medicamentos (07/2026).
+ ~53.422 preços CMED vinculados por número de registro.

## 3. Situação do Registro

- **Ativo**: registro válido e vigente → ~4.701
- **Inativo**: registro vencido, cancelado ou não renovado → ~16.003
- Medicamentos inativos não devem ser considerados para prescrição ou dispensação

## 4. Classificação ATC (Anatomical Therapeutic Chemical)

Sistema da OMS com 5 níveis hierárquicos para classificar medicamentos:

1. **Nível 1** (1 letra) — grupo anatômico: `N` = Sistema Nervoso
2. **Nível 2** (3 chars) — grupo terapêutico: `N06` = Psicoanalépticos
3. **Nível 3** (4 chars) — subgrupo farmacológico
4. **Nível 4** (5 chars) — subgrupo químico
5. **Nível 5** (7 chars) — princípio ativo específico

A aplicação navega pelos níveis 1-3 com drill-down até a lista de medicamentos.

## 5. Preços CMED

A CMED define preços máximos por apresentação:

- **PF0**: Preço Fábrica sem ICMS
- **PF18**: Preço Fábrica com ICMS 18%
- Os preços são por apresentação (dosagem + embalagem)
- Exibidos em gráfico de barras na página de detalhes e em PDF exportável

## 6. Busca por Descrição

### Arquitetura Híbrida com RRF Fusion

A busca combina **tsvector** (keyword com stemming e sinônimos) e **pgvector** (busca semântica vetorial) usando **Reciprocal Rank Fusion (RRF)** para combinar os rankings.

#### Busca Semântica (pgvector)

- Modelo: `multilingual-e5-small` — 384 dimensões, ~118MB (processamento 100% local, zero custo de API)
- Texto indexado: nome + princípio ativo + categoria + detentor + forma farmacêutica + concentração + sinônimos + indicações + situação + registro
- Índice: IVFFlat para busca O(log n)
- **Semantic Gate**: apenas resultados com cosine similarity ≥ **0.80** são considerados
- **Standalone threshold**: quando a busca semântica roda sozinha (sem keyword complementar), o threshold é **0.855**

#### Busca Textual (tsvector)

- Índice GIN com stemming português via configuração de texto da base
- Mapa de sinônimos médicos com **35+ entradas** (ex: "coração" ↔ "cardíaco", "pressão" ↔ "hipertensão")
- **Synonym expansion**: termos médicos são expandidos automaticamente antes da consulta
- **Compound subject parsing**: expressões compostas (ex: "ácido acetilsalicílico") são analisadas como unidades

#### RRF Fusion

```
score = 1/(60 + rank_keyword) + 1/(60 + rank_semantic)
```

#### Score Adjustments

- Feedback dos usuários (útil/não útil) gera **boost** ou **penalty** no score final
- Boosts/penalties são aplicados por medicineId e tipo de query
- Ajustes são normalizados para evitar distorção dos resultados

#### Fallback: Keyword Gate

Se a busca semântica não retornar resultados relevantes (score < 0.80), o sistema tenta **keyword search** pura como fallback, usando o tsvector com expansão de sinônimos.

## 7. Farmácia Popular

### Definição
O programa Farmácia Popular do Ministério da Saúde disponibiliza medicamentos gratuitos para 12 indicações (hipertensão, diabetes, asma, osteoporose, dislipidemia, rinite, Parkinson, glaucoma, anticoncepção, diabetes mellitus + doença cardiovascular, incontinência urinária e dignidade menstrual).

### Regras
- Cada medicamento no banco pode ter a flag `farmaciaPopular = true` se seu princípio ativo estiver na lista oficial
- A lista é obtida do PDF oficial "Elenco de Medicamentos e Insumos PFPB" do Ministério da Saúde
- O matching é feito por **princípio ativo** (campo `activeIngredient`)
- A sincronização é manual via painel admin (`/admin/import`, card "5. Farmácia Popular")
- A lista contempla ~40 princípios ativos, cobrindo ~2.400 medicamentos da base ANVISA
- Cada sincronização é registrada em `SyncLog` (type: `farmacia-popular`)
- O campo é exibido como badge verde "Farmácia Popular" na página de detalhe e "FP" nos resultados

## 8. Sincronização com ANVISA

- Base atualizada via CSV dos Dados Abertos ANVISA
- Verificação do header `Last-Modified` antes de baixar (evita downloads desnecessários)
- Importação substitui **todos** os registros existentes
- Preços CMED importados separadamente
- Farmácia Popular sincronizado separadamente (lista do Ministério da Saúde)
- **therapeuticClass**: sincronizado do CSV DADOS_ABERTOS_MEDICAMENTOS (campo `SUBSTANCIA` mapeado para classe terapêutica)
- **Embeddings**: sincronizados apenas para novos medicamentos (sem embedding existente), em batches de 50
- Cada sincronização é registrada em `SyncLog` (type, count, status, timestamp)

### Backfill Scripts

Scripts disponíveis para operações únicas de atualização em massa:

- `backfill-indications`: preencher indicações terapêuticas ausentes
- `backfill-therapeutic-class`: preencher classe terapêutica de registros existentes
- `add-active-ingredients`: popula princípios ativos de medicamentos que estão sem

## 9. Estatísticas (Dashboard)

O dashboard permite filtrar os dados por:
- **Ano**: filtra registros por ano de publicação
- **Categoria**: filtra por Similar, Genérico, Novo, etc.
- **Situação**: filtra por Ativo ou Inativo

Os filtros recalculam totais, top 10 medicamentos e top 10 princípios ativos em tempo real.

Uma **timeline interativa** exibe a evolução temporal dos registros ao longo dos anos, permitindo visualizar tendências de aprovação de medicamentos por categoria.

## 10. Relatório PDF

Cada medicamento possui um botão "Baixar PDF" que gera um relatório server-side com:
- Cabeçalho com a marca (Med Unificando)
- Informações completas do medicamento em grid 2 colunas
- Medicamento de referência (se houver)
- Tabela de preços CMED
- Rodapé com data de geração e fonte dos dados

Tecnologia: pdfmake (PdfPrinter API).

## 11. SEO

- Cada página de medicamento possui meta tags dinâmicas (title, description, OG)
- JSON-LD estruturado (Schema.org/MedicalDrug) para buscadores
- Sitemap com 32.585+ URLs para indexação completa
- Robots.txt bloqueia áreas administrativas

## 12. PWA

Aplicativo instalável via navegador com `manifest.json`. Ideal para acesso mobile.

## 13. Segurança

- Rate limit de 60 requisições/minuto nas rotas `/api/*`
- **proxy.ts middleware**: rate limiter adicional no middleware de API para proteção distribuída
- **CSP headers**: Content-Security-Policy configurado para evitar XSS e ataques de injeção
- Security headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- Docker: read-only filesystem, non-root user, sem privilégios
- Body size limit de 10MB para uploads

## 14. Feedback de Busca

Usuários podem avaliar resultados como "útil" ou "não útil".

### Regras
- Feedback é armazenado em SearchFeedback (query, medicineId, medicineName, feedback)
- Score adjustments usam feedback para boost/penalty em buscas futuras
- Admin pode visualizar estatísticas e queries de baixa qualidade em /admin/search-feedback
- Dados ajudam a melhorar a relevância da busca continuamente

## 15. Classes Terapêuticas

### Definição
Campo therapeuticClass no modelo Medicine, importado do CSV DADOS_ABERTOS_MEDICAMENTOS da ANVISA.

### Regras
- Cada medicamento pode ter uma classe terapêutica associada
- Usado para filtro e agrupamento na busca avançada
- Indicações terapêuticas mapeadas por classe (therapeutic-class-indications.ts)
