import https from 'https'

// Agente HTTPS dedicado exclusivamente aos downloads dos dados abertos da ANVISA.
// Os servidores da ANVISA (dados.anvisa.gov.br) usam certificados ICP-Brasil que não
// constam nas CAs padrão do Node.js, resultando em UNABLE_TO_VERIFY_LEAF_SIGNATURE.
//
// O bypass de verificação é ESTRITAMENTE escopado a este agente, usado apenas em
// requisições para as URLs fixas da ANVISA (src/lib/config.ts). Ele NÃO deve ser
// promovido a variável global (ex.: NODE_TLS_REJECT_UNAUTHORIZED=0), pois isso
// desabilitaria a verificação TLS de todas as conexões de saída do processo —
// expondo qualquer chamada futura a outras APIs a MITM. Manter o bypass por host.
export const anvisaAgent = new https.Agent({ rejectUnauthorized: false })