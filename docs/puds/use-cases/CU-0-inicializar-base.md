# CU-0 — Inicializar la base ejecutable del proyecto

## Estado y trazabilidad

- **Estado del CU: En implementación.**
- CU-0.1 — Repositorio, configuración y documentación inicial: terminado y verificado el 2026-09-10.
- CU-0.2 — Aplicaciones y servicios conectados: terminado y validado el 2026-09-12.
- CU-0.3 — Calidad, reproducibilidad y cierre: no iniciado.
- Rama de trabajo: `feature/cu-0-inicializar-base`.
- Trazabilidad: CU anterior 0 → CU nuevo 0, ciclo 1. Consultar [plan maestro](README.md), [estado](../../STATUS.md) y [ADR-0001](../../decisions/ADR-0001-initial-technical-boundaries.md).

## Objetivo y resultado usable

CU-0 deja una base local con PostgreSQL, API NestJS y web Astro/Preact. La web consulta el health de la API y comunica los estados disponible o no disponible. CU-0.2 está terminado; CI, E2E, reproducción limpia y cierre completo pertenecen a CU-0.3.

## Decisiones aplicadas

| Tema | Decisión implementada |
|---|---|
| Topología | Monorepo npm privado con workspaces `apps/*` y `packages/*`, y un único `package-lock.json` raíz |
| Runtime | Node 24, npm 11.6.2 y `@nestjs/cli` exactamente `11.0.24` |
| Base local | PostgreSQL `18.6-alpine`, volumen nombrado, healthcheck y puerto solo en `127.0.0.1:5432` |
| API | NestJS 11 sobre Express, TypeORM para readiness, `@nestjs/swagger` para `/api/docs` y `/api/docs-json` |
| Health | `GET /api/health` responde un contrato cerrado: `200 {"status":"available"}` o `503 {"status":"unavailable"}` |
| Web | Astro con isla Preact `ApiStatus` que hace una sola consulta al montar, con timeout y limpieza de recursos |
| Orígenes | `WEB_ORIGIN` debe ser una URL concreta y CORS no acepta `*`; `PUBLIC_API_ORIGIN` configura la llamada web |
| Persistencia | El health crea un `DataSource` efímero y ejecuta `SELECT 1`; no hay entidades, migraciones, sincronización ni dominio persistido |
| Secretos | Los ejemplos contienen valores sintéticos; `.env` reales siguen ignorados |

Las fronteras aprobadas en ADR-0001 se preservan: esta base no implementa autenticación, UML, colaboración, XMI, generación ni IA.

## Incrementos

| Incremento | Alcance | Estado |
|---|---|---|
| CU-0.1 | Plan 12/3, ADR, contexto, configuración raíz, Compose y verificación estática | Terminado |
| CU-0.2 | Workspaces, lockfile, PostgreSQL, API, health/OpenAPI/CORS y comunicación real web→API | Terminado |
| CU-0.3 | CI, reproducción limpia, E2E/manuales, build y cierre de CU | Pendiente |

## Flujos y errores

1. La persona inicia PostgreSQL con Compose y exporta `WEB_ORIGIN` y `PUBLIC_API_ORIGIN` en PowerShell.
2. `npm run dev` levanta API y web en paralelo.
3. La isla `ApiStatus` consulta una vez `<PUBLIC_API_ORIGIN>/api/health` al montarse.
4. Si recibe `200` y el contrato esperado, muestra `API disponible`.
5. Si la base cae, la API sigue escuchando y responde `503`; la isla muestra `API no disponible`.
6. Una URL ausente, timeout, fallo de red, cuerpo inválido o respuesta distinta de 200 también muestran `API no disponible`.

La API rechaza durante el arranque un `WEB_ORIGIN` vacío, inválido o `*`. El health no revela host, usuario, contraseña ni detalle de TypeORM al fallar.

## Contratos, datos y migraciones

El paquete `@primer-parcial/contracts` define el contrato tipado de health usado por API y web. La API documenta el endpoint mediante Swagger/OpenAPI. No existen entidades TypeORM, tablas de negocio ni migraciones: el `DataSource` de readiness tiene `entities: []` y `synchronize: false`.

PostgreSQL inicializa `primer_parcial` con el usuario sintético `primer_parcial_local` en desarrollo local. Cambiar variables de inicialización no migra un volumen ya existente.

## Evidencia de verificaciones

### CU-0.1 — 2026-09-10

| Comprobación | Resultado real |
|---|---|
| `node docs/development/validate-cu-0.1.mjs` | 12 grupos estáticos correctos |
| `docker compose config` | Código 0; imagen, loopback, volumen y healthcheck configurados |
| `git diff --check` | Código 0 |

La evidencia completa de configuración histórica se conserva en el historial Git y en las fuentes enlazadas por este CU.

### CU-0.2 — 2026-09-12

| Comprobación | Resultado real |
|---|---|
| Entorno | Node `v24.11.1`, npm `11.6.2`, Docker Engine `29.7.2`, Compose `v5.5.1` |
| Lockfile y CLI | Un solo `package-lock.json`; `npm ls @nestjs/cli --depth=0` devolvió `@nestjs/cli@11.0.24` |
| PostgreSQL | `docker compose up -d --wait` dejó el contenedor healthy; `pg_isready -U primer_parcial_local -d primer_parcial` correcto |
| API disponible | `GET /api/health` devolvió `200 {"status":"available"}` |
| OpenAPI | `GET /api/docs` y `GET /api/docs-json` devolvieron `200` |
| Web disponible | Prueba condicional `ApiStatus` contra API real: 7 de 7 tests correctos con `API_INTEGRATION_MODE=available` |
| API no disponible | Tras `docker compose stop postgres`, la API siguió escuchando en `3000` y devolvió `503 {"status":"unavailable"}` |
| Web no disponible | Prueba condicional `ApiStatus` contra API real: 7 de 7 tests correctos con `API_INTEGRATION_MODE=unavailable` |
| Recuperación | `docker compose up -d --wait`, `pg_isready` y health disponible volvieron a responder correctamente |
| Calidad raíz | `npm run lint`, `npm run typecheck` y `npm run test` correctos; tests raíz: API 5, web 6 con 1 integración condicionada omitida, contracts 1 |
| Build | `npm run build` ejecutado manualmente con éxito: `nest build`, Astro generó la salida estática y `tsc -p tsconfig.build.json` de contracts finalizaron sin errores |
| Scope control | Sin CORS wildcard, sin secretos detectados en búsqueda de patrones conocidos, sin dependencias de auth/realtime/XMI/IA y sin lockfiles adicionales |

`astro check` informó 0 errores, 0 warnings y 0 hints. Vitest muestra una advertencia no bloqueante de Vite por `astro:dev-toolbar` y `optimizeDeps.esbuildOptions` deprecado. El verificador histórico `node docs/development/validate-cu-0.1.mjs` falla ahora con `Prematuro: apps`, porque valida exclusivamente que CU-0.1 no haya creado aplicaciones y no es aplicable después de CU-0.2. La evidencia manual de `npm run build` completó el incremento, sin cerrar CU-0.3 ni CU-0.

## Pruebas manuales y recuperación

La prueba runtime inició API con `WEB_ORIGIN=http://localhost:4321` y web con `PUBLIC_API_ORIGIN=http://localhost:3000`. Se observó que la página web contenía la isla `ApiStatus`; las pruebas condicionales confirmaron las dos salidas contra la API real.

La caída controlada usó exclusivamente `docker compose stop postgres`; no se eliminó contenedor ni volumen. La restauración usó `docker compose up -d --wait`. Una comprobación manual pendiente de CU-0.3 debe abrir la web en navegador, registrar URL/resultado y repetir el arranque desde entorno limpio.

## Archivos relevantes

- `package.json`, `package-lock.json` — workspaces, scripts raíz y dependencias reproducibles.
- `compose.yaml`, `.env.example` — PostgreSQL local y valores sintéticos.
- `apps/api/` — NestJS, configuración, health, OpenAPI y tests de API.
- `apps/web/` — Astro, isla Preact, configuración pública y tests de estado.
- `packages/contracts/` — contrato compartido de health.
- `docs/development/README.md`, `README.md`, `docs/architecture/README.md`, `docs/STATUS.md` — ejecución, arquitectura y estado actualizados.

## Riesgos, deuda y fuera de alcance

- CU-0.3 debe añadir CI, E2E, reproducción limpia, revisión manual de navegador y cierre documental del CU.
- No hay autenticación, UML, persistencia de proyectos, colaboración, XMI, generación, voz, visión ni IA.
- La prueba de integración web se activa solo con sus variables de entorno; el test raíz la omite deliberadamente para no depender de servicios locales.
- Los valores de ejemplos no son aptos para despliegue ni sustituyen secretos reales.

## Cómo ejecutar y verificar

Seguir [la guía de desarrollo](../../development/README.md) desde `D:\project-planning`. Como mínimo: iniciar Compose, exportar ambos orígenes, ejecutar `npm run dev`, visitar `http://localhost:4321`, y correr `npm run lint`, `npm run typecheck` y `npm run test`.

## Historial de iteraciones

| Fecha | Iteración | Cambio y verificación |
|---|---|---|
| 2026-09-10 | CU-0.1 | Configuración/documentación, 12 grupos estáticos correctos y Compose validado sin motor. |
| 2026-09-12 | CU-0.2 | Base NestJS/Astro/TypeORM/PostgreSQL, health/OpenAPI/CORS y web→API. Checks raíz, integración disponible/no disponible y build manual correctos. |

## Comandos finales de commit y push

**Pendiente para el cierre de CU-0 tras CU-0.3.** No se ejecutaron `git add`, `git commit`, `git push` ni acciones GitHub en esta entrega.
