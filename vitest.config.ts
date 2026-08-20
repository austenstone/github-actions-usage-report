import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Date/time assertions are locale- and zone-sensitive; pin to UTC so results
// match CI regardless of the contributor's machine.
process.env.TZ = 'UTC';

export default defineConfig({
  plugins: [react()],
  test: {
    testTimeout: 30000,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      exclude: [
        'src/lib/sample-data.ts', // dynamic imports only, untestable
        'src/lib/local-storage.ts', // IndexedDB not available in jsdom
        // fflate's zipSync can't build an archive under jsdom (its Uint8Array
        // check fails across realms); the read path is covered via import.test.ts
        'src/lib/zip.ts',
      ],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 70,
        statements: 80,
        branches: 65,
      },
    },
  },
});
