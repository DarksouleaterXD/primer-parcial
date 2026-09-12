# Estado real del proyecto

Última actualización: 2026-09-12

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), con 12 CUs en 3 ciclos y mapa histórico 30→12 preservado.
- Caso de uso activo: **CU-0 — Inicializar la base ejecutable**, en implementación.
- CU-0.1 está terminado: configuración y documentación estáticas verificadas.
- CU-0.2 está terminado y validado: workspaces, PostgreSQL, API NestJS, web Astro/Preact, contrato health, CORS, OpenAPI y build raíz.
- CU-0.3 no está iniciado. CI, reproducción limpia, E2E y cierre del CU continúan pendientes.
- Benchmarks no ejecutados: B-TXT-UML/B-TXT-APP→CU-8, B-STT→CU-9, B-VLM→CU-10, B-OFFLINE→CU-11.
- Rama de trabajo: `feature/cu-0-inicializar-base`. No hay acciones de publicación ni remoto creado por esta entrega.

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

## Pendientes y riesgos

- CU-0.3 debe incorporar CI, reproducción desde entorno limpio, E2E/manuales completos y cierre documental del CU-0.
- No se implementaron autenticación, UML, entidades de dominio, persistencia de proyectos, colaboración, XMI, generación ni IA.
- `.env` y variantes reales siguen ignorados. Los valores de `.env.example` son sintéticos y no deben usarse fuera de desarrollo local.

## Estado por ciclo

| Ciclo | Estado | Entrega usable esperada |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 en implementación: CU-0.1 y CU-0.2 terminados; CU-0.3 y CU-1 a CU-3 pendientes | Cuenta, editor validado con Undo/Redo y proyectos privados persistentes |
| 2. Colaboración, interoperabilidad y generación | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicación Spring/web/PWA/Android generada |
| 3. Inteligencia, visión y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imágenes y demostración integral offline |

## Historial

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-01 | Se creó la planificación PUDS, reglas generales y estrategia de benchmarks. | Documentación inicial |
| 2026-09-10 | Se verificó CU-0.1: mapa 12/3, ADR, configuración y documentación. | ADR-0001, verificador estático y Compose config |
| 2026-09-12 | Se implementó y verificó CU-0.2: workspaces, PostgreSQL, health/OpenAPI/CORS, web→API y build. | Checks raíz, pruebas API/web, pruebas integradas disponible/no disponible y build manual correcto |
