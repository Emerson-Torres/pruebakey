# DECISIONES

Prueba técnica Full Stack — Bot de atención por WhatsApp + Panel de casos.
Backend NestJS · Frontend Next.js · SQLite + Prisma.

---

## 1 · Qué construí y qué dejé fuera

Un bot de WhatsApp en NestJS que recibe los mensajes por webhook, les detecta la intención por reglas (sin LLM), responde con data de Key Institute cargada por seed y va guardando los casos con su hilo. El panel en Next.js lista, filtra, muestra el detalle y deja cambiar el estado del caso. Todo sobre SQLite con Prisma. Las tres de robustez las cubrí: idempotencia por messageSid único, concurrencia con un lock por teléfono, y el proveedor de mensajería detrás de una interfaz por si un día falla o se cambia. Dejé fuera Twilio real (queda como otra implementación de esa misma interfaz), el outbox con reintentos en background (lo resolví en simple: guardo el saliente y marco SENT/FAILED) y el login del panel, porque para el alcance no aportaba.

---

## 2 · Decisiones de la sección 6

**6.1 — "Quiero poner un reclamo porque llevo tres días esperando respuesta sobre mi inscripción."**
Lo tomo como RECLAMO. Cuando alguien dice explícito que quiere reclamar, esa intención pesa más que el tema del que habla (la inscripción). El bot le confirma que abrió el caso y de paso le suma la info de inscripción como contexto.

**6.2 — Un usuario con un caso CERRADO vuelve a escribir.**
Creo un caso nuevo. Un caso cerrado ya es una conversación terminada; el historial igual queda ligado por el número. No metí lógica de reapertura para no cargar el sistema con un caso especial que después cuesta sostener.

**6.3 — "¿Cuándo pago?" (no aclara si es matrícula o cuota).**
Le respondo los dos calendarios juntos (matrícula y cuota) en un mensaje corto. No repregunto, porque eso agrega fricción y me obligaría a manejar estado de la conversación entre varios turnos, que no vale la pena acá.

**6.4 — Un mismo número consulta fechas hoy y pone un reclamo mañana.**
Dos casos conviviendo, uno por tipo. Una consulta y un reclamo tienen ciclos de vida distintos; si los mezclo en un solo caso, el panel se ensucia. El equipo ve los dos casos bajo el mismo teléfono.

**Regla que sostiene 6.1, 6.2 y 6.4:** un caso activo por (teléfono, tipo). Cuando llega un mensaje detecto la intención, saco el tipo, y busco un caso de ese teléfono y ese tipo que no esté CERRADO: si existe le agrego el mensaje, si no creo uno nuevo. Con esa sola regla salen las tres decisiones de arriba.

**Diseño del panel (sale de las decisiones anteriores).**
Por defecto el panel muestra solo ABIERTO y EN_PROCESO; los CERRADO son historial y se ven con filtro. El operador ve solo lo que tiene pendiente. El cambio de estado es explícito, con un botón según dónde esté el caso (ABIERTO → "Tomar caso" → EN_PROCESO → "Cerrar caso" → CERRADO). No lo hago automático al abrir el detalle, porque si no termino marcando "en proceso" casos que nadie está atendiendo de verdad. La API expone un PATCH genérico; la regla del flujo vive en el frontend.

---

## 3 · Robustez (sección 5)

**5.1 — El mismo mensaje llega dos veces (idempotencia).** Resuelto.
Lo agarro en dos capas. Primero, antes de procesar nada, busco el `messageSid` con `findUnique`; si ya existe, ignoro el mensaje: no creo caso, no guardo nada, no respondo de nuevo. Segundo, el `messageSid` es `@unique` en la base, así que aunque dos reintentos entren casi juntos, la base no deja meter el duplicado. Tengo test unitario y lo verifiqué con curl mandando el mismo SID dos veces: el sistema queda igual que con uno.

**5.2 — Dos mensajes del mismo número casi al mismo tiempo (concurrencia).** Resuelto.
Uso un lock en memoria por teléfono: el buscar-o-crear caso se encola por número (promesas encadenadas en un Map), así dos mensajes del mismo teléfono que llegan juntos se procesan en fila y no terminan abriendo dos casos. El lock envuelve solo la parte crítica; teléfonos distintos no se bloquean entre sí. La limitación la tengo clara: vive en la memoria de una instancia, así que con varias instancias haría falta un lock distribuido o una restricción única en base. El `@unique` del messageSid me sirve además de red de seguridad. Tiene su test de concurrencia (que probé que falla sin el lock, para asegurarme de que prueba lo que dice).

**5.3 — El proveedor de mensajería se cae.** Resuelto (versión simple).
El envío va detrás de una interfaz propia (`MessagingProvider`); la implementación por defecto (`LogMessagingProvider`) no necesita credenciales y se elige por `MESSAGING_PROVIDER` en el `.env`. El saliente lo guardo como PENDING antes de intentar mandarlo; si sale bien pasa a SENT, si falla pasa a FAILED. Así el entrante nunca se pierde y el saliente queda registrado aunque el proveedor esté caído. No metí el worker/outbox con reintentos en background: para el prototipo alcanza con registrar el estado del envío; en producción le pondría una cola con reintentos.

---

## 4 · Algo que descarté

El scaffold arrancó con NestJS 12, que viene ESM-only y necesita Node 24.9+ para poder correr los tests con Jest. Bajé los paquetes de Nest a la versión 11 (que trae build CommonJS) por compatibilidad con Jest en la versión de Node que tengo, y porque es la versión más estable y documentada para un ejercicio con plazo corto. Preferí terreno firme antes que la última versión.

También descarté Twilio real por ahora: es plus opcional y no compensa faltantes de

## 5 · Lo que menos entiendo de mi propia entrega

La parte más delicada es el lock en memoria de la concurrencia (5.2). Para una sola instancia lo tengo claro y funciona: todas las peticiones pasan por el mismo proceso, comparten el mismo Map y hacen fila bien. Donde me cuesta más es dimensionar qué pasa con varias instancias: ahí cada proceso tiene su propio Map en su propia memoria, no lo comparten, y dos mensajes del mismo teléfono que caigan en instancias distintas podrían abrir dos casos igual. Tomé la decisión sabiendo que hoy, con una instancia, no rompo nada, pero soy consciente de que es la zona que más cuidado necesitaría si esto escala. Si se rompe por ahí, además, el síntoma es silencioso (casos duplicados que aparecen bajo carga, sin error visible), así que sería lo que más me costaría detectar y arreglar. La salida sería mover la garantía a algo que las instancias compartan: una restricción única en la base o un lock distribuido.

## 6 · Con una semana más

Primero atacaría la concurrencia para varias instancias: cambiaría el lock en memoria por una garantía a nivel de base (una restricción única sobre el caso activo por teléfono y tipo) o un lock distribuido, así deja de depender de que todo pase por un solo proceso. Es lo que hoy tiene el techo más bajo. Después le metería el outbox de verdad: una cola con reintentos en background para los mensajes salientes, en vez de marcar SENT/FAILED en el momento. Con eso, un proveedor caído se recupera solo cuando vuelve. Tercero, la integración real con Twilio como segunda implementación de la interfaz de mensajería (ya está el punto de enganche, es una clase nueva más el ngrok para exponer el webhook). Y si sobra, autenticación en el panel, que hoy está abierto.

## 7 · Plus de la prueba

También trabajé la integración real con Twilio como plus (sección 10): implementé el `TwilioMessagingProvider` como segunda implementación de la interfaz `MessagingProvider`, que envía por la API real de WhatsApp. Agregarlo fue una clase nueva más un `case` en el módulo, sin tocar nada del resto del sistema — que es justo el punto de la sección 3.2, aislar el proveedor externo. La configuración por `.env` deja elegir `log` (por defecto, sin credenciales) o `twilio`. No completé la demo en vivo con el sandbox porque la cuenta trial de Twilio pone la configuración del webhook detrás de un upgrade de pago; el código queda listo para conectar (webhook + ngrok) en una cuenta con acceso.
