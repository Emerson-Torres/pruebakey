import { test, expect, request } from '@playwright/test';

// URL del backend (donde vive la API y el webhook).
const BACKEND_URL = 'http://localhost:3000';

// Telefono unico por corrida, con formato real de El Salvador:
// +503 seguido de 8 digitos, el primero un 7 (movil).
// Los otros 7 digitos salen del timestamp, asi cada corrida crea un
// caso nuevo y limpio sin acumular mensajes de corridas anteriores.
const TELEFONO_E2E = `+5037${Date.now().toString().slice(-7)}`;
const SID_E2E = `E2E-${Date.now()}`; // unico en cada corrida
const TEXTO_RECLAMO = 'quiero poner un reclamo urgente';

test('flujo del panel: un reclamo aparece, se filtra y se ve su hilo', async ({
  page,
}) => {
  // --- Paso 1: Simular la llegada de un reclamo llamando al webhook ---
  // Usamos un contexto de request aparte para pegarle directo al backend,
  // igual que haria Twilio (form-encoded).
  const api = await request.newContext();
  const respWebhook = await api.post(`${BACKEND_URL}/webhook/whatsapp`, {
    form: {
      From: `whatsapp:${TELEFONO_E2E}`,
      Body: TEXTO_RECLAMO,
      MessageSid: SID_E2E,
    },
  });
  // El webhook debe responder OK (200).
  expect(respWebhook.ok()).toBeTruthy();
  await api.dispose();

  // --- Paso 2: Abrir el panel y verificar que el caso RECLAMO aparece ---
  await page.goto('/');
  // El telefono del caso debe estar visible en la lista.
  await expect(page.getByText(TELEFONO_E2E)).toBeVisible();

  // --- Paso 3: Filtrar por estado ABIERTO y comprobar que sigue visible ---
  // El caso nace ABIERTO, asi que al filtrar por "Abierto" debe seguir.
  await page.getByRole('button', { name: 'Abierto' }).click();
  await expect(page.getByText(TELEFONO_E2E)).toBeVisible();

  // --- Paso 4: Abrir el detalle y verificar que se muestra el hilo ---
  // Clic en el telefono (es un enlace al detalle del caso).
  await page.getByText(TELEFONO_E2E).click();
  // En el detalle, debe aparecer el texto del mensaje entrante...
  await expect(page.getByText(TEXTO_RECLAMO)).toBeVisible();
  // ...y el titulo del hilo de mensajes.
  await expect(page.getByText('Hilo de mensajes')).toBeVisible();
});