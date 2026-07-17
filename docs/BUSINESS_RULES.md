# Regras de Negócio

## 1. Intercambialidade de Medicamentos

### Definição
Um medicamento **similar** é intercambiável com seu **medicamento de referência** quando atende aos requisitos da RDC 58/2014 da ANVISA. A lista de medicamentos intercambiáveis é publicada periodicamente pela ANVISA.

### Regras
- Todo medicamento Similar possui um medicamento de Referência correspondente
- O farmacêutico pode substituir o medicamento de referência pelo similar (e vice-versa)
- Medicamentos Genéricos também são intercambiáveis com seus referências
- A intercambialidade não se aplica entre diferentes medicamentos de referência

## 2. Categorias ANVISA

| Categoria | Descrição | Registro |
|-----------|-----------|----------|
| Similar | Medicamento similar ao de referência | Registro ANVISA |
| Genérico | Medicamento genérico | Registro ANVISA |
| Novo | Medicamento inovador | Registro ANVISA |
| Específico | Indicação terapêutica específica | Registro ANVISA |
| Fitoterápico | Medicamento à base de plantas | Registro ANVISA |
| Biológico | Medicamento biológico | Registro ANVISA |
| Dinamizado | Medicamento homeopático | Registro ANVISA |
| Radiofármaco | Medicamento radioativo | Registro ANVISA |

## 3. Situação do Registro

- **Ativo**: registro válido e vigente
- **Inativo**: registro vencido, cancelado ou não renovado

Medicamentos inativos não devem ser considerados para prescrição ou dispensação.

## 4. Classificação ATC (Anatomical Therapeutic Chemical)

Sistema de classificação da OMS que organiza medicamentos em 5 níveis:

1. **Nível 1 (Anatômico)**: 1 letra — grupo anatômico (ex: `N` = Sistema Nervoso)
2. **Nível 2 (Terapêutico)**: 2 dígitos — grupo terapêutico (ex: `N06` = Psicoanalépticos)
3. **Nível 3 (Farmacológico)**: 1 letra — subgrupo farmacológico
4. **Nível 4 (Químico)**: 1 letra — subgrupo químico
5. **Nível 5 (Substância)**: 2 dígitos — princípio ativo

## 5. Preços CMED

A Câmara de Regulação do Mercado de Medicamentos (CMED) define preços máximos:

- **PF0**: Preço Fábrica sem ICMS (alíquota 0%)
- **PF18**: Preço Fábrica com ICMS (alíquota 18%)

Os preços são por apresentação do produto (dosagem + embalagem).

## 6. Busca Semântica

A busca semântica utiliza embeddings de texto para encontrar medicamentos
pela **intenção** da busca, não por correspondência textual exata.

**Exemplos:**
- "anti-inflamatório para articulação" → encontra anti-inflamatórios como ibuprofeno, naproxeno, diclofenaco
- "remédio para dormir" → encontra benzodiazepínicos, zolpidem, etc.
- "antibiótico para infecção urinária" → encontra nitrofurantoína, norfloxacino, etc.

O modelo usado é `all-MiniLM-L6-v2` (384 dimensões), rodando 100% local via ONNX Runtime.

## 7. Sincronização

- A base é atualizada via CSV dos Dados Abertos ANVISA
- O sistema verifica o header `Last-Modified` do CSV antes de baixar
- Só baixa e processa se o arquivo remoto foi alterado
- A importação substitui **todos** os registros existentes
- Preços CMED são importados separadamente
