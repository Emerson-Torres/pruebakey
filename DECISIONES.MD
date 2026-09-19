# DECISIONES

Prueba técnica Full Stack — Bot de atención por WhatsApp + Panel de casos.
Backend NestJS · Frontend Next.js · SQLite + Prisma.

---

## 1 · Qué construí y qué dejé fuera

_(Pendiente: se completa al final, en cinco líneas.)_

---

## 2 · Decisiones de la sección 6

**6.1 — "Quiero poner un reclamo porque llevo tres días esperando respuesta sobre mi inscripción."**
Se clasifica como RECLAMO. La intención explícita de reclamar tiene prioridad sobre el tema (inscripción). El bot confirma la apertura del caso y suma la info de inscripción como contexto.

**6.2 — Un usuario con un caso CERRADO vuelve a escribir.**
Se crea un caso nuevo. Un caso cerrado es una conversación cerrada; el historial queda ligado por el número de teléfono. Se evita la lógica de reapertura para no agregar un caso especial difícil de sostener.

**6.3 — "¿Cuándo pago?" (no aclara si es matrícula o cuota).**
El bot responde ambos calendarios (matrícula y cuota) en un mensaje corto. No repregunta, para no agregar fricción ni manejar estado conversacional de varios turnos.

**6.4 — Un mismo número consulta fechas hoy y pone un reclamo mañana.**
Dos casos conviviendo, uno por tipo. La consulta y el reclamo tienen ciclos de vida distintos; mezclarlos en un solo caso ensuciaría el panel. El equipo ve ambos casos bajo el mismo teléfono.

**Regla que sostiene 6.1, 6.2 y 6.4:** un caso activo por (teléfono, tipo). Al llegar un mensaje se detecta la intención, se deriva el tipo, y se busca un caso de ese teléfono y ese tipo que no esté CERRADO: si existe se le agrega el mensaje, si no se crea uno nuevo.

---

## 3 · Robustez (sección 5)


**5.1 — El mismo mensaje llega dos veces (idempotencia).** Resuelto.
Dos capas: (1) antes de procesar, se busca el `messageSid` con `findUnique`; si ya existe, se ignora el mensaje sin crear caso, ni guardar mensajes, ni responder. (2) El campo `messageSid` es `@unique` en la base, como red de seguridad ante reintentos concurrentes. Cubierto por test unitario y verificado con curl (mismo SID dos veces deja el sistema igual).

**5.2 — Dos mensajes