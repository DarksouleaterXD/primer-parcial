# Estado real del proyecto

Ãšltima actualizaciÃ³n: 2026-09-14

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), con 12 CUs en 3 ciclos y mapa histÃ³rico 30â†’12 preservado.
- CU-0 â€” Inicializar la base ejecutable: **terminado y archivado**.
- CU-1 â€” Gestionar cuenta y sesiÃ³n: **terminado y archivado** el 2026-09-14; 9/9 tareas, validaciÃ³n local completa y CI remoto `Verify base executable` #6 correcto.
- CU-2 â€” Modelar diagramas UML manualmente: **planificado; implementaciÃ³n no iniciada**.
- Incremento activo planificado: **CU-2.1 â€” Modelo y validaciÃ³n**, cambio OpenSpec `cu-2-1-modelo-validacion`.
- CU-2.2 â€” Comandos e historial y CU-2.3 â€” Workspace visual permanecen pendientes.
- Benchmarks no ejecutados: B-TXT-UML/B-TXT-APPâ†’CU-8, B-STTâ†’CU-9, B-VLMâ†’CU-10, B-OFFLINEâ†’CU-11.

## Evidencia cerrada de CU-0

CU-0 dejÃ³ el monorepo reproducible con Node `v24.11.1`, npm `11.6.2`, Astro/Preact, NestJS 11, PostgreSQL `18.6-alpine`, health, OpenAPI, CORS, CI, E2E, build y reproducciÃ³n limpia. Su historial completo permanece en `docs/puds/use-cases/CU-0-inicializar-base.md` y en los cambios OpenSpec archivados.

## Evidencia cerrada de CU-1

| ComprobaciÃ³n | Resultado real |
|---|---|
| Estado OpenSpec | 9/9 tareas completas; cambio archivado en `openspec/changes/archive/2026-09-14-cu-1-gestionar-cuenta-sesion` |
| Registro | `firstName`, `lastName`, email normalizado y password; nombres obligatorios para cuentas nuevas |
| Login | Exclusivamente email + password |
| SesiÃ³n | JWT Bearer, consulta protegida y JWT solo en `sessionStorage` |
| Logout | Local, sin endpoint remoto |
| Persistencia | Migraciones TypeORM explÃ­citas; nombres nullable solo para cuentas legacy |
| Tests | API 18, web 19 con 1 integraciÃ³n condicional omitida, contracts 4; E2E Chromium 5/5 |
| ReproducciÃ³n limpia | InstalaciÃ³n, PostgreSQL, migraciones, lint, typecheck, tests, E2E, build, health y limpieza correctos |
| RevisiÃ³n manual | Registro/login/workspace/logout, teclado, responsive y ausencia de overflow horizontal comprobados |
| CI remoto | `Verify base executable` #6, run ID `34803009828`, commit `0cc67afe5cba99e93169f04a51915705dd4944b0`, `Success` |

Los warnings de verificaciÃ³n final de CU-1 sobre respuestas OpenAPI 401 y cobertura explÃ­cita de PostgreSQL caÃ­do en registro/sesiÃ³n quedaron como deuda no bloqueante; no se incorporan a CU-2.1 salvo correcciÃ³n separada aprobada.

## CU-2.1 â€” Plan activo

Objetivo: estabilizar el dominio UML antes de cualquier canvas o ruta alternativa de mutaciÃ³n.

Plan aprobado para revisiÃ³n:
- nuevo paquete portable `@primer-parcial/uml-domain`;
- `ProjectDocument` versiÃ³n 1;
- `CanonicalUmlModel` y `DiagramLayout` separados;
- paquetes, clases, atributos, operaciones, tipos, enums, asociaciones/agregaciÃ³n/composiciÃ³n/generalizaciÃ³n y multiplicidades;
- perfil de generaciÃ³n separado;
- serializaciÃ³n/round-trip;
- validador Ãºnico con diagnÃ³sticos estables y polÃ­ticas `edit/save/import/generate`;
- sin Command Bus, canvas, persistencia de proyectos, realtime, XMI, generaciÃ³n ni IA en este incremento.

La planificaciÃ³n OpenSpec estÃ¡ en `openspec/changes/cu-2-1-modelo-validacion/`. La implementaciÃ³n requiere aprobaciÃ³n explÃ­cita posterior.

## Pendientes y riesgos

- La rama fÃ­sica de Git debe revisarse antes de implementar CU-2.1 segÃºn la regla â€œuna rama por CU o incrementoâ€ de `AGENTS.md`; este parche no crea ni cambia ramas.
- `compose.yaml` y `opencode.json` pueden contener ajustes locales del usuario y este cambio no los modifica.
- CU-2.1 todavÃ­a no tiene evidencia de cÃ³digo, tests, build ni reproducciÃ³n; cualquier resultado permanece pendiente hasta ejecuciÃ³n real.
- Persistencia/reapertura del documento UML corresponde a CU-3.
- ColaboraciÃ³n, XMI, generaciÃ³n e IA siguen fuera de alcance.

## Estado por ciclo

| Ciclo | Estado | Entrega usable esperada |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 y CU-1 terminados; CU-2.1 planificado; CU-2.2/CU-2.3 y CU-3 pendientes | Cuenta, editor validado con Undo/Redo y proyectos privados persistentes |
| 2. ColaboraciÃ³n, interoperabilidad y generaciÃ³n | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicaciÃ³n Spring/web/PWA/Android generada |
| 3. Inteligencia, visiÃ³n y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imÃ¡genes y demostraciÃ³n integral offline |

## Historial reciente

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-13 | Se cerrÃ³ CU-0. | ReproducciÃ³n limpia, E2E/manuales y GitHub Actions correctos. |
| 2026-09-14 | Se completÃ³ y archivÃ³ CU-1. | 9/9 tareas; reproducciÃ³n limpia, revisiÃ³n manual y `Verify base executable` #6 correctos. |
| 2026-09-14 | Se preparÃ³ la planificaciÃ³n de CU-2.1. | Proposal, spec, design y tasks de `cu-2-1-modelo-validacion`; implementaciÃ³n aÃºn no autorizada. |