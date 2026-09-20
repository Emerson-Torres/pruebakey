# Bot de atención por WhatsApp + Panel de casos

Prototipo de un sistema de atención para Key Institute: un bot que recibe consultas por WhatsApp (vía webhook de Twilio), detecta la intención del mensaje, responde desde una base de conocimiento y registra cada interacción como un "caso". Un panel web permite al equipo administrativo listar, filtrar y gestionar esos casos.

- **Backend:** NestJS + TypeScript + Prisma + SQLite
- **Frontend:** Next.js + TypeScript + Tailwind
- **Pruebas:** Jest (unitarias) + Playwright (E2E)

---

## Requisitos

- **Node.js 20 o superior** (probado en Node 22)
- **npm** (viene con Node)

No hace falta instalar ninguna base de datos: se usa SQLite, que es un archivo local que se crea solo.

---

## Estructura

    pruebakey/
      backend/     API NestJS: webhook, detección de intención, casos, robustez
      frontend/    Panel Next.js: lista de casos, detalle, cambio de estado
      DECISIONES.md
      README.md

El backend y el frontend son dos proyectos independientes. Hay que levantar los dos.

---

## Puesta en marcha

Se necesitan **dos terminales**: una para el backend, otra para el frontend.

### 1. Backend (terminal 1)

Desde la carpeta raíz:

    cd backend

Instalar dependencias:

    npm install

Crear el archivo de entorno a partir del ejemplo:

    copy .env.example .env

(En Mac/Linux sería `cp .env.example .env`.)

Crear la base de datos y aplicar el esquema:

    npx prisma migrate deploy

Generar el cliente de Prisma:

    npx prisma generate

Cargar datos de ejemplo (4 casos de muestra):

    npx prisma db seed

Levantar el servidor:

    npm run start

El backend queda escuchando en **http://localhost:3000**.

### 2. Frontend (terminal 2)

Desde la carpeta raíz, en otra terminal:

    cd frontend

Instalar dependencias:

    npm install

Crear el archivo de entorno a partir del ejemplo:

    copy .env.example .env.local

Levantar el panel:

    npm run dev

El panel queda disponible en **http://localhost:3001**. Abrilo en el navegador para ver los casos.

> **Importante:** el backend (paso 1) debe estar corriendo antes de abrir el panel, ya que el panel consume su API.

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `DATABASE_URL` | Ruta del archivo SQLite | `file:./dev.db` |
| `MESSAGING_PROVIDER` | Implementación del proveedor de mensajería | `log` |

### Frontend (`frontend/.env.local`)

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend | `http://localhost:3000` |

Cada proyecto incluye un `.env.example` con estas variables. Los archivos `.env` reales no se versionan.

---

## Probar el webhook manualmente

El webhook acepta el mismo formato que envía Twilio (form-encoded). Con el backend corriendo, se puede simular un mensaje entrante con curl:

    curl.exe -X POST http://localhost:3000/webhook/whatsapp -d "From=whatsapp:+50370001234" -d "Body=quiero poner un reclamo" -d "MessageSid=SM-PRUEBA-1"

El caso resultante aparecerá en el panel.

---

## Pruebas

### Unitarias (Jest) — backend

Desde `backend/`:

    npm test

Cubren la detección de intención, la lógica de casos (crear, reutilizar, regla de reclamo), la idempotencia (5.1) y la concurrencia (5.2).

### End-to-end (Playwright) — frontend

La prueba E2E recorre el flujo completo del panel. **Necesita el backend y el frontend levantados** (pasos 1 y 2 de arriba).

La primera vez, instalá los navegadores que usa Playwright (desde `frontend/`):

    npx playwright install

Después, con el backend y el frontend corriendo, en una tercera terminal desde `frontend/`:

    npx playwright test

Simula la llegada de un reclamo al webhook, verifica que aparece en el panel, filtra por estado y comprueba que se muestra el hilo de mensajes.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/webhook/whatsapp` | Recibe mensajes entrantes (form-encoded de Twilio) |
| `GET` | `/cases` | Lista casos (filtros opcionales: `?tipo=`, `?estado=`) |
| `GET` | `/cases/:id` | Detalle de un caso con su hilo de mensajes |
| `PATCH` | `/cases/:id/estado` | Cambia el estado de un caso |

---

## Decisiones de diseño

Las decisiones de alcance, robustez y los supuestos tomados están documentados en [DECISIONES.md](./DECISIONES.md).