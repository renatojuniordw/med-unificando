import { defineConfig } from '@playwright/test'
import { config as loadEnv } from 'dotenv'

// Carrega o .env (ADMIN_EMAIL/ADMIN_PASSWORD etc.) para a sessão do Playwright e
// para o processo do webServer — assim `npm run test:e2e` é autossuficiente.
loadEnv()

// Porta dedicada ao dev server dos testes E2E. Evita conflito com:
//  - o container de produção (medicamentos-app) que ocupa :11006 com build antigo
//    (SEM data-testid — foi a causa dos seletores não encontrados ao rodar contra ele);
//  - eventuais dev servers manuais do usuário.
const E2E_PORT = Number(process.env.E2E_PORT || 11009)
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${E2E_PORT}`

export default defineConfig({
  testDir: './e2e',
  // Não há dev server externo: o Playwright sobe um servidor do código ATUAL
  // (com os data-testid) via webServer, roda os testes e derruba ao final.
  retries: 0,
  reporter: 'html',
  // REQUISITO DE INFRA: os testes de jornada acessam o banco (Postgres). O `next dev`
// carrega o `.env` automaticamente (DATABASE_URL etc.), mas o Postgres precisa estar
// no ar — localmente via docker compose (medicamentos-db). Sem o banco, as rotas que
// consultam o DB renderizam o error boundary e os testes falham com ECONNREFUSED.
webServer: {
    command: `E2E_PORT=${E2E_PORT} bash scripts/e2e-server.sh`,
    url: baseURL,
    reuseExistingServer: false, // força subir um servidor do código atual; nunca usa :11006
    // webServer.env SUBSTITUI o ambiente, então NÃO espalhamos process.env (evita
    // vazar variáveis do shell). O loadEnv() no topo alimenta os specs (login admin);
    // o `next dev` faz o próprio autoload do .env para o DATABASE_URL.
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      // MCP: nos testes E2E usamos respostas JSON puras (sem SSE) para validar
      // o handshake via APIRequestContext sem parsing de stream.
      MCP_ENABLE_JSON_RESPONSE: 'true',
    },
    timeout: 180_000,
  },
  use: {
    baseURL,
  },
})