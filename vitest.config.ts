import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local for contract tests
dotenv.config({ path: '.env.local' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
