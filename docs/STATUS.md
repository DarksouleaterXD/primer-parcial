# Estado real del proyecto

Última actualización: 2026-09-13

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), con 12 CUs en 3 ciclos y mapa histórico 30→12 preservado.
- CU-0 — Inicializar la base ejecutable: **terminado**.
- CU-0.1 está terminado: configuración y documentación estáticas verificadas.
- CU-0.2 está terminado y validado: workspaces, PostgreSQL, API NestJS, web Astro/Preact, contrato health, CORS, OpenAPI y build raíz.
- CU-0.3 está terminado: reproducción limpia, checks locales finales, E2E Chromium, revisión manual y CI real correctos.
- Benchmarks no ejecutados: B-TXT-UML/B-TXT-APP→CU-8, B-STT→CU-9, B-VLM→CU-10, B-OFFLINE→CU-11.
- CU-1 — Cuenta y sesión: **en validación**. Bloques 1 y 2 completos; E2E Chromium real de Bloque 3.1 correcto. Revisión manual, reproducción limpia, build, CI real y cierre de alcance pendientes.
- Próximo caso de uso: **CU-2 — Modelar diagramas UML manualmente**, no iniciado. La evidencia CI de CU-0 se obtuvo en `feature/cu-0-inicializar-base` del repositorio `DarksouleaterXD/primer-parcial`.

## Evidencia CU-0.2

| Comprobación | Resultado real |
|---|---|
| Entorno | Node `v24.11.1`, npm `11.6.2`, Docker Engine `29.7.2`, Compose `v5.5.1` |
| Dependencias | Un único `package-lock.json`; `@nestjs/cli@11.0.24` exacto |
| PostgreSQL | `postgres:18.6-alpine` healthy; `pg_isready -U primer_parcial_local -d primer_parcial` correcto |
| Health disponible | `GET /api/health` devolvió `200 {"status":"available"}` |
| Health no disponible | Tras `docker compose stop postgres`, la API siguió en `3000` y devolvió `503 {"status":"unavailable"}`; PostgreSQL se restauró con `docker compose up -d --wait` |
| API publicada | `/api/docs` y `/api/docs-json` devolvieron `200` |
| Web integrada | La prueba condicional de `ApiStatus` pasó contra la API real tanto disponible como no disponible |
| Calidad | `npm run lint`, `npm run typecheck` y `npm run test` correctos; el test raíz omitió la integración condicionada, que se ejecutó aparte con ambos estados |
| Build | `npm run build` ejecutado manualmente con éxito: `nest build`, Astro generó la salida estática y `tsc -p tsconfig.build.json` de contracts finalizaron sin errores |

La verificación de tipos de Astro no informó errores, warnings ni hints. Vitest muestra una advertencia no bloqueante deprecada de Vite proveniente de `astro:dev-toolbar` sobre `optimizeDeps.esbuildOptions`.

## Evidencia CU-0.3

| Comprobación | Resultado real |
|---|---|
| Snapshot de reproducción | `50cd2e10bdf958160d04cff344c8e8a902af77ec`, archivado con `git archive` sin archivos no versionados |
| Directorio temporal | `C:\Users\brand\AppData\Local\Temp\primer-parcial-clean-3bec42cfbc144e0ab695e7b05943d2e3`, creado fuera del checkout y eliminado por la receta tras el bloqueo |
| Snapshot | Un único lockfile raíz, sin `.env` reales ni directorios excluidos detectados por la receta |
| Bloqueo real | El puerto contractual `127.0.0.1:5432` estaba ocupado por `primer-parcial-postgres-1` healthy; no se ejecutaron `npm ci`, checks, build, Compose temporal, `pg_isready` ni health |
| Aislamiento | El checkout original no fue limpiado ni alterado; no se usó `git clean`, stash, `.env` real, puerto alternativo ni operaciones sobre el Compose original |
| Segundo snapshot | `0932c6b79ab2d7d05a0523b8df886a50f32da74d`, que contiene la receta versionada; `git archive` creó un temporal aislado y no usó cambios del checkout |
| Segundo intento | `npm ci`, lint y typecheck correctos; `npm run test` falló en `health.e2e.spec.ts` con `503` donde esperaba `200` porque la receta inicia Compose después de tests |
| Recuperación segundo intento | Temporal eliminado; no quedaron contenedores Compose aislados ni servicios en el checkout original |
| Snapshot correcto | `6bfe68f8c81cf5af5402771875c07a26d1b87312`, con la receta que inicia PostgreSQL antes de checks |
| Tercer intento | `npm ci`, PostgreSQL/`pg_isready`, lint, typecheck, tests, build y health disponible correctos desde `git archive` en un temporal aislado |
| Limpieza correcta | Temporal eliminado y API temporal detenida; el contenedor Compose aislado quedó detenido sin borrar su volumen y el checkout original permaneció intacto |
| E2E Chromium final | `npm run test:e2e` pasó 2 escenarios en 15.5 s contra Astro/Preact, NestJS y PostgreSQL reales, con `http://localhost:4321` como origen coherente con CORS local |
| Estados observados | Chromium mostró `API disponible`, luego `API no disponible` tras detener solo `postgres`, y `API disponible` en una nueva página tras `up -d --wait` y `pg_isready` |
| Restauración E2E | El `finally` dejó `primer-parcial-postgres-1` healthy en el estado inicial iniciado; no se borraron contenedores, volúmenes ni datos |
| Revisión manual | El 2026-09-12, una persona comprobó en `http://localhost:4321` los estados disponible, no disponible y recuperación con los orígenes documentados; PostgreSQL quedó healthy |
| Incidencia manual | El primer inicio sin `WEB_ORIGIN` exportado no inició la API; se repitió correctamente tras definir solo `WEB_ORIGIN=http://localhost:4321` y `PUBLIC_API_ORIGIN=http://localhost:3000` |
| Checks locales finales | PostgreSQL healthy y `pg_isready` correcto; `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run build`, `openspec validate cu-0-3-calidad-reproducibilidad-cierre --strict` y `git diff --check` correctos |
| Control de alcance | Un único `package-lock.json`, `@nestjs/cli@11.0.24`, Chromium único; sin secretos detectados por patrones de control, sin cambios al validador histórico CU-0.1 ni capacidades fuera de CU-0.3 |
| CI real | Repositorio `DarksouleaterXD/primer-parcial`, rama `feature/cu-0-inicializar-base`, commit `0a0337b2a283098f53e3392ec062d0644c1ac386` (`fix(cu-0.3): pin CI Node and npm versions`), workflow `Verify base executable`, ejecución `#3` por `push`, resultado `Success` en 2m 1s |
| Toolchain CI | El workflow exigió Node `v24.11.1` y npm `11.6.2` antes de `npm ci`; la ejecución real finalizó correctamente |

## Pendientes y riesgos

- CU-1 implementa autenticación y sesión; UML, proyectos, colaboración, XMI, generación e IA siguen sin implementar.
- `.env` y variantes reales siguen ignorados. Los valores de `.env.example` son sintéticos y no deben usarse fuera de desarrollo local.

## Estado por ciclo

| Ciclo | Estado | Entrega usable esperada |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 terminado; CU-1 en validación; CU-2 y CU-3 no iniciados | Cuenta, editor validado con Undo/Redo y proyectos privados persistentes |
| 2. Colaboración, interoperabilidad y generación | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicación Spring/web/PWA/Android generada |
| 3. Inteligencia, visión y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imágenes y demostración integral offline |

## Historial

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-01 | Se creó la planificación PUDS, reglas generales y estrategia de benchmarks. | Documentación inicial |
| 2026-09-10 | Se verificó CU-0.1: mapa 12/3, ADR, configuración y documentación. | ADR-0001, verificador estático y Compose config |
| 2026-09-12 | Se implementó y verificó CU-0.2: workspaces, PostgreSQL, health/OpenAPI/CORS, web→API y build. | Checks raíz, pruebas API/web, pruebas integradas disponible/no disponible y build manual correcto |
| 2026-09-12 | Se implementó la receta aislada de reproducción CU-0.3 y se ejecutó su preflight. | Snapshot `50cd2e1` con `git archive`; bloqueo registrado por puerto 5432 ocupado, sin alterar el checkout ni PostgreSQL original. |
| 2026-09-12 | Se repitió la receta limpia con snapshot versionado actual. | Snapshot `0932c6b` pasó `npm ci`, lint y typecheck; `npm run test` falló antes de Compose por falta de PostgreSQL, con limpieza aislada correcta. |
| 2026-09-12 | Se completó la reproducción limpia con la receta corregida. | Snapshot `6bfe68f` pasó instalación, PostgreSQL, checks, build y health desde `git archive`; temporal eliminado y sin alterar el checkout original. |
| 2026-09-12 | Se ejecutó E2E Chromium contra el flujo real. | Dos escenarios verificaron disponible, no disponible y recuperación; PostgreSQL del proyecto quedó healthy al finalizar. |
| 2026-09-12 | Se completó la revisión manual de navegador. | Disponible, no disponible y recuperación fueron observados en la URL local; PostgreSQL quedó healthy y no se modificó código. |
| 2026-09-12 | Se repitieron los checks locales y se revisó el alcance final. | Lint, tipos, tests, E2E, build, OpenSpec y whitespace correctos; se alineó el origen E2E con `localhost` para evitar el rechazo CORS de servidores locales reutilizados. Sin remoto ni runner CI autorizado, CU-0 sigue abierto. |
| 2026-09-13 | Se validó CI real y se cerró CU-0.3/CU-0. | `Verify base executable` #3 pasó por `push` en `DarksouleaterXD/primer-parcial`, rama `feature/cu-0-inicializar-base`, commit `0a0337b2a283098f53e3392ec062d0644c1ac386`; Node `v24.11.1`, npm `11.6.2`, 2m 1s. |
| 2026-09-13 | Se implementaron CU-1 Bloques 1 y 2, y E2E real de Bloque 3.1. | API/auth, landing, registro/login, JWT en `sessionStorage`, logout local y `npm run test:e2e`: 5 escenarios Chromium correctos en 1.0 minuto. Cierre de CU-1 pendiente de manual, reproducción, build, CI y revisión final. |
