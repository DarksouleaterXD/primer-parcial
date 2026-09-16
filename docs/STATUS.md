# Estado real del proyecto

Última actualización: 2026-09-14

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), con 12 CUs en 3 ciclos y mapa histórico 30→12 preservado.
- CU-0 — Inicializar la base ejecutable: **terminado y archivado**.
- CU-1 — Gestionar cuenta y sesión: **terminado y archivado** el 2026-09-14; 9/9 tareas, validación local completa y CI remoto `Verify base executable` #6 correcto.
- CU-2 — Modelar diagramas UML manualmente: **en implementación**.
- Incremento activo: **CU-2.1 - Modelo y validacion**; bloqueo critico del parser remediado localmente, nueva reproduccion limpia pendiente. No esta listo para archive.
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

## CU-2.1 — Implementación activa

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

La planificación OpenSpec está en `openspec/changes/cu-2-1-modelo-validacion/` y fue aprobada explícitamente antes de implementar. `packages/uml-domain` contiene el código actual; checks raíz, reproducción limpia y cierre permanecen pendientes hasta evidencia real.

### Evidencia de integracion CU-2.1 - 2026-09-15

- Regresion raiz: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` correctos.
- Tests: API 18/18; web 19 correctos con 1 omitido condicional; contracts 4/4; `uml-domain` conteo historico previo a remediacion (no vigente).
- Alcance: sin Command Bus, Undo/Redo, canvas, persistencia, XMI, generacion ni IA dentro de CU-2.1.
- OpenSpec strict y `git diff --check`: correctos.
- Infraestructura de tests API: ahora respeta variables PostgreSQL del entorno con fallback contractual a 5432; esto permite la misma regresion en una estacion local con publicacion 5433 sin modificar `compose.yaml`.
- Pendiente: snapshot Git versionado + `reproduce-clean` + cierre documental de CU-2.1.

## Pendientes y riesgos

- La rama física de Git debe revisarse antes de implementar CU-2.1 según la regla “una rama por CU o incremento” de `AGENTS.md`; este parche no crea ni cambia ramas.
- `compose.yaml` y `opencode.json` pueden contener ajustes locales del usuario y este cambio no los modifica.
- CU-2.1 ya tiene implementación de dominio y pruebas unitarias preparadas. Los checks raíz, build/reproducción limpia y evidencia de cierre permanecen pendientes hasta ejecución real en el entorno del proyecto.
- Persistencia/reapertura del documento UML corresponde a CU-3.
- Colaboración, XMI, generación e IA siguen fuera de alcance.

## Estado por ciclo

| Ciclo | Estado | Entrega usable esperada |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 y CU-1 terminados; CU-2.1 en implementación; CU-2.2/CU-2.3 y CU-3 pendientes | Cuenta, editor validado con Undo/Redo y proyectos privados persistentes |
| 2. Colaboración, interoperabilidad y generación | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicación Spring/web/PWA/Android generada |
| 3. Inteligencia, visión y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imágenes y demostración integral offline |

## Historial reciente

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-13 | Se cerró CU-0. | Reproducción limpia, E2E/manuales y GitHub Actions correctos. |
| 2026-09-14 | Se completó y archivó CU-1. | 9/9 tareas; reproducción limpia, revisión manual y `Verify base executable` #6 correctos. |
| 2026-09-14 | Se preparó y aprobó la planificación de CU-2.1. | Proposal, spec, design y tasks de `cu-2-1-modelo-validacion`. |
| 2026-09-14 | Se implementaron los bloques de dominio y validación de CU-2.1. | `packages/uml-domain` con modelo canónico, perfil, serialización, validador y pruebas; integración/cierre pendientes. |

## Historial - cierre local previo al verify critico - 2026-09-15

CU-2.1 tiene 9/9 tareas completas y verificacion local final correcta.

- Snapshot reproducido: `3c030ef6674f82b674bd48823a95e2623c22f8d1`.
- `uml-domain`: conteo historico previo a remediacion (no vigente) tests.
- E2E Chromium: 5/5.
- Build raiz: correcto.
- PostgreSQL aislado: `55432`.
- Health final: `available`.
- Estado: listo para verify/sync/archive.

## Estado vigente CU-2.1 tras remediacion del verify

- El verify detecto validacion runtime incompleta del contrato cerrado del `ProjectDocument`.
- Parser y validador fueron remediados para validar forma recursiva antes de aceptar el documento.
- Se agregaron regresiones negativas y assertions de `severity`, `path` y `elementId`.
- La evidencia `reproduce-clean` del snapshot anterior queda como historial porque el codigo cambio despues.
- OpenSpec vuelve temporalmente a 8/9: 3.2 permanece pendiente hasta un nuevo snapshot versionado y nueva reproduccion limpia.
- CU-2.1 no esta listo para archive hasta renovar esa evidencia y repetir verify.

## Cierre local CU-2.1 - 2026-09-15

CU-2.1 tiene 9/9 tareas completas y verificacion local final correcta.

- Snapshot reproducido: `3c030ef6674f82b674bd48823a95e2623c22f8d1`.
- `uml-domain`: conteo historico previo a remediacion (no vigente) tests.
- E2E Chromium: 5/5.
- Build raiz: correcto.
- PostgreSQL aislado: `55432`.
- Health final: `available`.
- Estado: listo para verify/sync/archive.

## Estado vigente post-remediacion verify

- Rama: $TargetBranch.
- Tests uml-domain: 37/37 correctos.
- Composite valido y round-trip: cubiertos.
- Runtime-contract remediation ec30194: incluida.
- OpenSpec 3.2: pendiente.
- Siguiente evidencia requerida: nuevo snapshot Git +
eproduce-clean.
- No archivar CU-2.1 todavia.
