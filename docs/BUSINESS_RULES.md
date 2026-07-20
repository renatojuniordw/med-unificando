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

## 6. Busca Semântica

A busca semântica utiliza IA local (Xenova Transformers) para encontrar medicamentos pela **intenção** da busca, não por correspondência textual exata.

**Modelo**: `all-MiniLM-L6-v2` — 384 dimensões, ~23MB
**Texto usado para embedding**: nome + princípio ativo + categoria + detentor + forma farmacêutica + concentração + sinônimos + indicações + situação + registro

**Exemplos:**
- "anti-inflamatório para articulação" → ibuprofeno, naproxeno, diclofenaco
- "remédio para dormir" → benzodiazepínicos, zolpidem
- "antibiótico para infecção urinária" → nitrofurantoína, norfloxacino

Processamento 100% server-side (modelo cacheado em memória). Zero custo de API.

## 7. Sincronização com ANVISA

- Base atualizada via CSV dos Dados Abertos ANVISA
- Verificação do header `Last-Modified` antes de baixar (evita downloads desnecessários)
- Importação substitui **todos** os registros existentes
- Preços CMED importados separadamente
- Cada sincronização é registrada em `SyncLog` (type, count, status, timestamp)

## 8. Dashboard Interativo

O dashboard permite filtrar os dados por:
- **Ano**: filtra registros por ano de publicação
- **Categoria**: filtra por Similar, Genérico, Novo, etc.
- **Situação**: filtra por Ativo ou Inativo

Os filtros recalculam totais, top 10 medicamentos e top 10 princípios ativos em tempo real.

## 9. Relatório PDF

Cada medicamento possui um botão "Baixar PDF" que gera um relatório server-side com:
- Cabeçalho com a marca (Med Unificando)
- Informações completas do medicamento em grid 2 colunas
- Medicamento de referência (se houver)
- Tabela de preços CMED
- Rodapé com data de geração e fonte dos dados

Tecnologia: pdfmake (PdfPrinter API).

## 10. SEO

- Cada página de medicamento possui meta tags dinâmicas (title, description, OG)
- JSON-LD estruturado (Schema.org/MedicalDrug) para buscadores
- Sitemap com 32.585+ URLs para indexação completa
- Robots.txt bloqueia áreas administrativas

## 9. PWA

Aplicativo instalável via navegador com `manifest.json`. Ideal para acesso mobile.

## 10. Segurança

- Rate limit de 60 requisições/minuto nas rotas `/api/*`
- Security headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- Docker: read-only filesystem, non-root user, sem privilégios
- Body size limit de 10MB para uploads
