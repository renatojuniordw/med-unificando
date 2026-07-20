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
        'src/lib/actions/**/*.ts',
        'src/lib/hooks/**/*.ts',
        'src/components/ui/**/*.tsx',
        'src/components/medicines/**/*.tsx',
        'src/components/dashboard/**/*.tsx',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        'src/types/**',
        'src/generated/**',
        'src/middleware.ts',
        'src/auth.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
