import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      include: ['src/**/__tests__/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/__tests__/**',
          'src/vite-env.d.ts',
          'src/main.ts'
        ],
        reporter: ['text', 'html']
      }
    }
  })
)
