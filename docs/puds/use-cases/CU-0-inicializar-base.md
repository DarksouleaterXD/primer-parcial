# CU-0 — Inicializar la base ejecutable del proyecto

## Estado y trazabilidad

- **Estado del CU: En implementación.**
- CU-0.1 — Repositorio, configuración y documentación inicial: terminado y verificado el 2026-09-10.
- CU-0.2 — Aplicaciones y servicios conectados: terminado y validado el 2026-09-12.
- CU-0.3 — Calidad, reproducibilidad y cierre: en implementación; Bloques 1 a 3 terminados, CI real y cierre pendientes.
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
| CU-0.3 | CI, reproducción limpia, E2E/manuales, build y cierre de CU | En implementación: Bloques 1 a 3 terminados; Bloque 4 pendiente |

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

### CU-0.3 — Bloque 2, reproducción limpia bloqueada — 2026-09-12

| Comprobación | Resultado real |
|---|---|
| Snapshot elegido | `50cd2e10bdf958160d04cff344c8e8a902af77ec` (`chore(cu-0.3): add CI and Playwright tooling`) |
| Origen del snapshot | `git archive` desde `D:\project-planning`; no se copiaron cambios no versionados del checkout |
| Temporal creado | `C:\Users\brand\AppData\Local\Temp\primer-parcial-clean-3bec42cfbc144e0ab695e7b05943d2e3`, fuera del checkout; la receta lo eliminó al abortar y su ausencia fue comprobada |
| Snapshot validado | Contenía el único `package-lock.json` raíz, `.env.example`, Compose, Playwright y CI; no presentó directorios excluidos ni archivos `.env` distintos del ejemplo |
| Runtime | Node 24 y npm 11 fueron aceptados por el preflight de la receta |
| Resultado | Bloqueado antes de `npm ci`, lint, typecheck, test, build, Compose temporal, `pg_isready` y health: `127.0.0.1:5432` estaba ocupado |
| Aislamiento PostgreSQL | El servicio original `primer-parcial-postgres-1` permaneció healthy y publicado en `127.0.0.1:5432`; la receta no inició, detuvo ni modificó ningún servicio Compose |
| Entorno sensible | La ejecución usó el snapshot archivado y no leyó ni copió archivos `.env` reales |

La receta `scripts/reproduce-clean.ps1` preserva el puerto `5432` establecido por el diseño y aborta si está ocupado, sin usar un puerto alternativo no aprobado. La tarea 2.2 sigue pendiente: hace falta repetir la ejecución cuando ese puerto esté libre, para observar PostgreSQL, `pg_isready` y el health disponible desde la copia aislada.

### CU-0.3 — Bloque 2, segundo intento fallido — 2026-09-12

| Comprobación | Resultado real |
|---|---|
| Snapshot elegido | `0932c6b79ab2d7d05a0523b8df886a50f32da74d` (`test(cu-0.3): add clean reproduction workflow`), que contiene `scripts/reproduce-clean.ps1` |
| Puertos y Compose original | `127.0.0.1:5432` y `3100` estaban libres; `docker compose -p primer-parcial ps` no informó servicios activos |
| Temporal y origen | `C:\Users\brand\AppData\Local\Temp\primer-parcial-clean-e11af103152c4aa7ae9e7691c94d1dc1`, creado desde `git archive` y eliminado tras el fallo; no quedaron contenedores `primer-parcial-clean*` |
| `npm ci` | Correcto: instaló 1214 paquetes desde el lockfile raíz. Informó 8 vulnerabilidades conocidas; no se ejecutó `npm audit fix` |
| Lint y tipos | Correctos; `astro check` informó 0 errores, 0 warnings y 0 hints |
| Tests | Falló `apps/api/test/health.e2e.spec.ts`: esperaba `200 OK` y recibió `503 Service Unavailable` en `returns available after a real PostgreSQL check` |
| Checks posteriores | No se ejecutaron build, Compose temporal, `pg_isready` ni health porque la receta abortó al fallar `npm run test` |
| Causa observable | El snapshot ejecuta `npm run test` antes de `docker compose ... up -d --wait postgres`; el test real de health depende de PostgreSQL |

No se corrigió ni reordenó la receta durante esta ejecución: cualquier corrección debe formar parte de un snapshot Git nuevo antes de poder demostrar otra reproducción basada exclusivamente en archivos versionados. La tarea 2.2 permanece pendiente y no existe evidencia de reproducción limpia satisfactoria.

### CU-0.3 — Bloque 2, reproducción limpia correcta — 2026-09-12

| Comprobación | Resultado real |
|---|---|
| Snapshot elegido | `6bfe68f8c81cf5af5402771875c07a26d1b87312` (`fix(cu-0.3): start clean postgres before verification`) |
| Origen y aislamiento | `git archive` creó la copia desde solo el commit versionado; no leyó cambios del checkout, archivos `.env` reales ni artefactos excluidos |
| Temporal | `C:\Users\brand\AppData\Local\Temp\primer-parcial-clean-4f42e36358884f66b68225053f3497fc`, fuera del checkout y eliminado al finalizar |
| `npm ci` | Correcto: instaló 1214 paquetes desde el único lockfile raíz. Informó 8 vulnerabilidades conocidas; no se ejecutó `npm audit fix` |
| PostgreSQL temporal | Compose aislado `primer-parcial-clean-e09b9d7eca37`; `postgres` healthy y `pg_isready` devolvió `accepting connections` |
| Calidad | Lint, typecheck y tests raíz correctos: API 5, web 6 con 1 integración omitida y contracts 1; `astro check` no informó errores, warnings ni hints |
| Build | Correcto: Nest, Astro estático y contracts TypeScript finalizaron sin errores dentro de la copia temporal |
| Health | La API temporal en `127.0.0.1:3100` devolvió el contrato disponible; la receta solo alcanza su objeto final con `Health = available` |
| Limpieza | La receta detuvo únicamente `primer-parcial-clean-e09b9d7eca37-postgres-1`, eliminó su directorio temporal y liberó el puerto API; no actuó sobre el Compose original ni borró volúmenes |

La reproducción completa satisface la tarea 2.2. El contenedor Compose aislado queda detenido para conservar el volumen temporal sin ejecutar operaciones de borrado; no pertenece al checkout original y no está publicado en ningún puerto.

### CU-0.3 — Bloque 3, E2E Chromium automatizada — 2026-09-12

| Comprobación | Resultado real |
|---|---|
| Navegador | Playwright `1.61.0` con Chromium instalado localmente; no se instalaron Firefox ni WebKit |
| Comando | `npm run test:e2e` ejecutó 2 escenarios con 1 worker y finalizó `2 passed` en 59.7 s |
| Disponible | Con `postgres` healthy, Chromium abrió `http://127.0.0.1:4321` y `ApiStatus` mostró `API disponible` |
| No disponible | La suite registró que el servicio `postgres` del Compose del proyecto estaba iniciado, ejecutó solo `docker compose stop postgres`, abrió una página nueva y comprobó `API no disponible` |
| Recuperación | La suite ejecutó `docker compose up -d --wait postgres`, comprobó `pg_isready`, abrió una página nueva y comprobó `API disponible` |
| Restauración | El `finally` restauró el estado inicial iniciado; `docker compose ps` y `pg_isready` posteriores confirmaron `primer-parcial-postgres-1` healthy en `127.0.0.1:5432` |
| Límites | Sin mocks, polling, reintentos, Page Objects, fixtures genéricos, screenshots, vídeos, traces, contenedores/volúmenes borrados ni PostgreSQL externo afectado |

### CU-0.3 — Bloque 3, revisión manual de navegador — 2026-09-12

| Comprobación | Resultado real |
|---|---|
| URL y orígenes | `http://localhost:4321`, con `WEB_ORIGIN=http://localhost:4321` y `PUBLIC_API_ORIGIN=http://localhost:3000` |
| Disponible | Con PostgreSQL healthy, la aplicación cargó y `ApiStatus` mostró `API disponible` |
| No disponible | Tras `docker compose stop postgres` y una recarga manual, `ApiStatus` mostró `API no disponible` |
| Recuperación | Tras `docker compose up -d --wait postgres`, `pg_isready` correcto y una recarga manual, `ApiStatus` volvió a mostrar `API disponible` |
| Resultado | Revisión manual correcta; PostgreSQL quedó restaurado y healthy |
| Incidencia inicial | La API no inició porque `WEB_ORIGIN` no estaba exportado en esa terminal; se configuraron únicamente las variables documentadas y se repitió la revisión sin modificar código |

La evidencia manual es independiente de los dos escenarios E2E Chromium y satisface la tarea 3.3.

## Pruebas manuales y recuperación

La prueba runtime inició API con `WEB_ORIGIN=http://localhost:4321` y web con `PUBLIC_API_ORIGIN=http://localhost:3000`. Se observó que la página web contenía la isla `ApiStatus`; las pruebas condicionales confirmaron las dos salidas contra la API real.

La caída E2E y manual controlada usó exclusivamente `docker compose stop postgres`; no se eliminó contenedor ni volumen. La restauración usó `docker compose up -d --wait` y `pg_isready`. La revisión manual del 2026-09-12 confirmó ambos estados y recuperación con los orígenes documentados.

## Archivos relevantes

- `package.json`, `package-lock.json` — workspaces, scripts raíz y dependencias reproducibles.
- `compose.yaml`, `.env.example` — PostgreSQL local y valores sintéticos.
- `apps/api/` — NestJS, configuración, health, OpenAPI y tests de API.
- `apps/web/` — Astro, isla Preact, configuración pública y tests de estado.
- `packages/contracts/` — contrato compartido de health.
- `docs/development/README.md`, `README.md`, `docs/architecture/README.md`, `docs/STATUS.md` — ejecución, arquitectura y estado actualizados.

## Riesgos, deuda y fuera de alcance

- CU-0.3 debe añadir evidencia CI real y cierre documental del CU.
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
| 2026-09-12 | CU-0.3 Bloques 1 y 2 parcial | Tooling CI/Playwright versionado. Receta limpia creada y snapshot `50cd2e1` validado; ejecución bloqueada de forma segura porque el PostgreSQL original ocupaba `127.0.0.1:5432`. |
| 2026-09-12 | CU-0.3 Bloque 2, segundo intento | Snapshot `0932c6b` instaló, pasó lint/tipos y falló los tests porque la receta inicia PostgreSQL después de la suite; temporal y recursos aislados fueron limpiados. |
| 2026-09-12 | CU-0.3 Bloque 2, tercer intento | Snapshot `6bfe68f` inició el PostgreSQL aislado antes de los checks y completó instalación, calidad, build, `pg_isready` y health disponible; temporal eliminado y servicio aislado detenido. |
| 2026-09-12 | CU-0.3 Bloque 3, E2E | Dos escenarios Chromium contra la web/API/PostgreSQL reales pasaron: disponible, no disponible y recuperación; PostgreSQL original restaurado healthy. |
| 2026-09-12 | CU-0.3 Bloque 3, manual | Una persona verificó disponible, no disponible y recuperación en `http://localhost:4321`; el primer arranque sin `WEB_ORIGIN` se corrigió con las variables documentadas, sin cambios de código. |

## Comandos finales de commit y push

**Pendiente para el cierre de CU-0 tras CU-0.3.** No se ejecutaron `git add`, `git commit`, `git push` ni acciones GitHub en esta entrega.
