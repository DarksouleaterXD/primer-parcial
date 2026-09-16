# Estado real del proyecto

Ultima actualizacion: 2026-09-16

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), con 12 CUs en 3 ciclos y mapa histórico 30→12 preservado.
- CU-0 — Inicializar la base ejecutable: **terminado y archivado**.
- CU-1 — Gestionar cuenta y sesión: **terminado y archivado** el 2026-09-14; 9/9 tareas, validación local completa y CI remoto `Verify base executable` #6 correcto.
- CU-2 — Modelar diagramas UML manualmente: **en implementación**.
- CU-2.1 tiene 9/9 tareas completas;
- CU-2.1: 9/9 tareas completas. `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.
- CU-2.2 — Comandos e historial y CU-2.3 — Workspace visual permanecen pendientes.
- Benchmarks no ejecutados: B-TXT-UML/B-TXT-APP→CU-8, B-STT→CU-9, B-VLM→CU-10, B-OFFLINE→CU-11.

## Evidencia cerrada de CU-0

CU-0 dejó el monorepo reproducible con Node `v24.11.1`, npm `11.6.2`, Astro/Preact, NestJS 11, PostgreSQL `18.6-alpine`, health, OpenAPI, CORS, CI, E2E, build y reproducción limpia. Su historial completo permanece en `docs/puds/use-cases/CU-0-inicializar-base.md` y en los cambios OpenSpec archivados.

## Evidencia cerrada de CU-1

| Comprobación | Resultado real |
|---|---|
| Estado OpenSpec | 9/9 tareas completas; cambio archivado en `openspec/changes/archive/2026-09-14-cu-1-gestionar-cuenta-sesion` |
| Registro | `firstName`, `lastName`, email normalizado y password; nombres obligatorios para cuentas nuevas |
| Login | Exclusivamente email + password |
| Sesión | JWT Bearer, consulta protegida y JWT solo en `sessionStorage` |
| Logout | Local, sin endpoint remoto |
| Persistencia | Migraciones TypeORM explícitas; nombres nullable solo para cuentas legacy |
| Tests | API 18, web 19 con 1 integración condicional omitida, contracts 4; E2E Chromium 5/5 |
| Reproducción limpia | Instalación, PostgreSQL, migraciones, lint, typecheck, tests, E2E, build, health y limpieza correctos |
| Revisión manual | Registro/login/workspace/logout, teclado, responsive y ausencia de overflow horizontal comprobados |
| CI remoto | `Verify base executable` #6, run ID `34803009828`, commit `0cc67afe5cba99e93169f04a51915705dd4944b0`, `Success` |

Los warnings de verificación final de CU-1 sobre respuestas OpenAPI 401 y cobertura explícita de PostgreSQL caído en registro/sesión quedaron como deuda no bloqueante; no se incorporan a CU-2.1 salvo corrección separada aprobada.

## CU-2.1 — Implementacion completada; verify final

Objetivo: estabilizar el dominio UML antes de cualquier canvas o ruta alternativa de mutación.

Implementación aprobada y aplicada:
- nuevo paquete portable `@primer-parcial/uml-domain`;
- `ProjectDocument` versión 1;
- `CanonicalUmlModel` y `DiagramLayout` separados;
- paquetes, clases, atributos, operaciones, tipos, enums, asociaciones/agregación/composición/generalización y multiplicidades;
- perfil de generación separado;
- serialización/round-trip;
- validador único con diagnósticos estables y políticas `edit/save/import/generate`;
- sin Command Bus, canvas, persistencia de proyectos, realtime, XMI, generación ni IA en este incremento.

- CU-2.1 tiene 9/9 tareas completas;
- CU-2.1: 9/9 tareas completas. `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.

### Evidencia de integracion CU-2.1 - 2026-09-15

- Regresion raiz: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` correctos.
- Tests: API 18/18; web 19 correctos con 1 omitido condicional; contracts 4/4; `uml-domain` conteo historico previo a remediacion (no vigente).
- Alcance: sin Command Bus, Undo/Redo, canvas, persistencia, XMI, generacion ni IA dentro de CU-2.1.
- OpenSpec strict y `git diff --check`: correctos.
- Infraestructura de tests API: ahora respeta variables PostgreSQL del entorno con fallback contractual a 5432; esto permite la misma regresion en una estacion local con publicacion 5433 sin modificar `compose.yaml`.
- CU-2.1 tiene 9/9 tareas completas;
- CU-2.1: 9/9 tareas completas. `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.

## Pendientes y riesgos

- Rama de CU-2.1 confirmada: eature/cu-2-1-modelo-validacion.
- `compose.yaml` y `opencode.json` pueden contener ajustes locales del usuario y este cambio no los modifica.
- CU-2.1 tiene 9/9 tareas completas;
- CU-2.1: 9/9 tareas completas. `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.
- Persistencia/reapertura del documento UML corresponde a CU-3.
- Colaboración, XMI, generación e IA siguen fuera de alcance.

## Estado por ciclo

| Ciclo | Estado | Entrega usable esperada |
|---|---|---|
- CU-2.1: implementacion completa, 9/9 tareas y
- CU-2.1: `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.
| 2. Colaboración, interoperabilidad y generación | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicación Spring/web/PWA/Android generada |
| 3. Inteligencia, visión y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imágenes y demostración integral offline |

## Historial reciente

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-13 | Se cerró CU-0. | Reproducción limpia, E2E/manuales y GitHub Actions correctos. |
| 2026-09-14 | Se completó y archivó CU-1. | 9/9 tareas; reproducción limpia, revisión manual y `Verify base executable` #6 correctos. |
| 2026-09-14 | Se preparó y aprobó la planificación de CU-2.1. | Proposal, spec, design y tasks de `cu-2-1-modelo-validacion`. |
| 2026-09-14 | Se implementaron los bloques de dominio y validacion de CU-2.1. | Implementacion inicial completada; el cierre posterior queda documentado en la evidencia vigente de CU-2.1. |

## Historial - cierre local previo al verify critico - 2026-09-15

CU-2.1 tiene 9/9 tareas completas y verificacion local final correcta.

- Snapshot reproducido: `3c030ef6674f82b674bd48823a95e2623c22f8d1`.
- `uml-domain`: conteo historico previo a remediacion (no vigente) tests.
- E2E Chromium: 5/5.
- Build raiz: correcto.
- PostgreSQL aislado: `55432`.
- Health final: `available`.
- Estado historico: evidencia supersedida por el snapshot post-remediacion 6f7f4759bd74516ee1bead9645fe2cb975af1b8f.

## Estado vigente CU-2.1 tras remediacion del verify

- El verify detecto validacion runtime incompleta del contrato cerrado del `ProjectDocument`.
- Parser y validador fueron remediados para validar forma recursiva antes de aceptar el documento.
- Se agregaron regresiones negativas y assertions de `severity`, `path` y `elementId`.
- La evidencia `reproduce-clean` del snapshot anterior queda como historial porque el codigo cambio despues.
- CU-2.1 tiene 9/9 tareas completas;
- CU-2.1: 9/9 tareas completas. `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.

## Cierre local CU-2.1 - 2026-09-15

CU-2.1 tiene 9/9 tareas completas y verificacion local final correcta.

- Snapshot reproducido: `3c030ef6674f82b674bd48823a95e2623c22f8d1`.
- `uml-domain`: conteo historico previo a remediacion (no vigente) tests.
- E2E Chromium: 5/5.
- Build raiz: correcto.
- PostgreSQL aislado: `55432`.
- Health final: `available`.
- Estado historico: evidencia supersedida por el snapshot post-remediacion 6f7f4759bd74516ee1bead9645fe2cb975af1b8f.

## Estado vigente post-remediacion verify

- Rama: feature/cu-2-1-modelo-validacion.
- Tests uml-domain: 37/37 correctos.
- Composite valido y round-trip: cubiertos.
- Runtime-contract remediation ec30194: incluida.
- CU-2.1 tiene 9/9 tareas completas;
- CU-2.1: 9/9 tareas completas. `reproduce-clean` completado sobre `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`. Gate restante: verify final antes de sync/archive.

## Evidencia vigente final CU-2.1 - 2026-09-15

- Rama: `feature/cu-2-1-modelo-validacion`.
- Snapshot limpio post-remediacion: `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`.
- Comando: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Software-Parcial-1\project-planning\scripts\reproduce-clean.ps1"`.
- Resultado: reproduccion limpia finalizada correctamente.
- `uml-domain` post-remediacion: 37/37 tests correctos.
- Composite valido y round-trip: cubiertos.
- PostgreSQL aislado: host port `55432`.
- Compose aislado: `primer-parcial-clean-50365d5da937`.
- Health final: `available`.
- Contenedor temporal PostgreSQL: detenido correctamente al finalizar.
- OpenSpec: 9/9.
- Estado: repetir `/opsx-verify`; no ejecutar sync/archive antes de un verify sin CRITICAL.
