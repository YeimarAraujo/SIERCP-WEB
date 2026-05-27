import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/app/api/enrollment/**',
        'src/app/api/wompi/**',
        'src/app/api/wompi-webhook/**',
        'src/app/api/debug/**',
        'src/lib/withAuth.ts',
        'src/lib/audit-logger.ts',
        'src/middleware.ts',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
      },
    },
  },
});
