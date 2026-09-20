import { defineConfig, devices } from '@playwright/test';

// Configuracion de Playwright para las pruebas E2E del panel.
// Los servidores (backend :3000 y frontend :3001) se levantan a mano
// antes de correr las pruebas; ver el README.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // URL base del panel: page.goto('/') abre el frontend directamente.
    baseURL: 'http://localhost:3001',
    // Captura una traza si un test falla al reintentar (util para depurar).
    trace: 'on-first-retry',
  },

  // Solo Chromium: suficiente para el prototipo, mas rapido y estable
  // que correr en tres navegadores.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});