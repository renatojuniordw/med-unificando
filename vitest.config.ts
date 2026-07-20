import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/components/ui/**/*.tsx',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        'src/types/**',
        'src/generated/**',
        'src/middleware.ts',
        'src/auth.ts',
        'src/lib/embeddings-generator.ts',
        'src/lib/pdf-parser.ts',
        'src/lib/prisma.ts',
        'src/lib/auth.config.ts',
        'src/lib/hooks/**',
        'src/lib/actions/semantic-search.ts',
        'src/app/api/\[...nextauth\]/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
