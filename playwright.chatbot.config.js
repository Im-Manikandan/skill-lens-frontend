import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['chatbot-scope.spec.js', 'usage-live-root.spec.js'],
  outputDir: './artifacts/chatbot-playwright',
  workers: 1,
  use: {baseURL: 'http://127.0.0.1:3005', channel: 'chrome', headless: true},
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3005 --strictPort --configLoader runner',
    url: 'http://127.0.0.1:3005/tests/fixtures/chatbot-scope.html',
    reuseExistingServer: !process.env.CI,
  },
});
