# Estado real del proyecto

Ultima actualizacion: 2026-09-16

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), con 12 CUs en 3 ciclos y mapa histórico 30→12 preservado.
- CU-0 — Inicializar la base ejecutable: **terminado y archivado**.
- CU-1 — Gestionar cuenta y sesión: **terminado y archivado** el 2026-09-14.
- CU-2 — Modelar diagramas UML manualmente: **en implementación** porque CU-2.3 sigue pendiente.
- CU-2.1 — Modelo y validación: **implementado y verificado**, 9/9 tareas OpenSpec, `uml-domain` 37/37 post-remediación y verificación de comportamiento completada mediante `reproduce-clean` sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`.
- El `/opsx-verify` más reciente no reportó CRITICAL. La verificación de comportamiento autorizada ya fue completada; resta repetir el verify final sobre la documentación consolidada y, si no aparecen bloqueos, ejecutar `sync/archive`.
- CU-2.2 — Comandos e historial: **implementado**, 20/20 tareas y evidencia técnica de cierre registrada.
- CU-2.3 — Workspace visual: pendiente.
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

## CU-2.1 — Modelo y validación implementado

Objetivo cumplido: estabilizar el dominio UML antes de cualquier Command Bus, canvas o ruta alternativa de mutación.

Implementación aplicada:
- paquete portable `@primer-parcial/uml-domain`;
- `ProjectDocument` versión 1;
- `CanonicalUmlModel` y `DiagramLayout` separados;
- paquetes, clases, atributos, operaciones, parámetros, tipos, enums, asociaciones, agregación/composición, generalización y multiplicidades;
- perfil de generación separado;
- serialización/round-trip;
- validador único con diagnósticos estables y políticas `edit/save/import/generate`;
- sin Command Bus, canvas, persistencia de proyectos, realtime, XMI, generación ni IA en CU-2.1.

Evidencia vigente:
- OpenSpec: 9/9 tareas;
- runtime-contract remediation `ec30194`: incluida en la ancestry del snapshot vigente;
- `uml-domain`: 37/37 tests post-remediación;
- composite válido y round-trip: cubiertos;
- snapshot `reproduce-clean` vigente: `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`;
- PostgreSQL aislado: host port `55432`;
- Compose aislado: `primer-parcial-clean-fe04b87c22b7`;
- health final: `available`;
- `git diff --check` y `openspec validate cu-2-1-modelo-validacion --strict`: correctos.

El verify read-only más reciente confirmó **CRITICAL: None**. Después de ese reporte se ejecutó la verificación de comportamiento autorizada mediante `reproduce-clean` sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b` y finalizó correctamente. Gate restante: repetir `/opsx-verify cu-2-1-modelo-validacion` sobre el cierre consolidado; si no hay bloqueos, continuar con `sync/archive`.

## Pendientes y riesgos

- Rama de CU-2.2 confirmada: `feature/cu-2-2-comandos-historial`.
- CU-2.2 expone el catálogo cerrado de 27 comandos y `UmlCommandBus` con snapshots privados de 100, sin UI, persistencia, red, realtime, XMI, generación, IA ni dependencias nuevas.
- En la integración final, `uml-domain` pasó 69/69; lint y typecheck raíz pasaron. El test raíz no cerró: 14 tests API fallaron porque falta el rol PostgreSQL local `primer_parcial_local`; web terminó 19 correctos y 1 omitido, contracts 4/4 y `uml-domain` 69/69.
- Reproducción limpia posterior al snapshot `fedb59247aec93936e23c941afdb8c74b9187243`: directorio temporal `C:\Users\brand\AppData\Local\Temp\primer-parcial-clean-f6aa052723c24bf9b7b91fe7fb98a856`; Compose `primer-parcial-clean-5a07494313ca`; PostgreSQL host port `55432`; health `available`; y contenedor `primer-parcial-clean-5a07494313ca-postgres-1` en `Stopped` al limpiar. El aislamiento evita depender del rol PostgreSQL local `primer_parcial_local`.
- En el cierre de 5.4, `openspec validate cu-2-2-comandos-historial --strict` finalizó correcto y `git diff --check` finalizó correcto sin salida. No se afirman checks individuales adicionales a los ya registrados.
- La tarea 5.4 está completa; no se ejecutaron build ni tests durante este cierre documental.
- `compose.yaml` y `opencode.json` contienen ajustes locales del usuario y deben permanecer fuera del cierre de CU-2.1.
- La verificación de comportamiento autorizada ya fue completada correctamente; resta el verify final antes de `sync/archive`.
- CU-2.3 no debe iniciarse antes del cierre formal de CU-2.2.
- Persistencia/reapertura del documento UML corresponde a CU-3.
- Colaboración, XMI, generación e IA siguen fuera de alcance.

## Estado por ciclo

| Ciclo | Estado | Entrega usable esperada |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 y CU-1 archivados; CU-2.1 con evidencia vigente; CU-2.2 implementado (20/20, evidencia técnica registrada); CU-2.3 y CU-3 pendientes | Cuenta, editor validado con Undo/Redo y proyectos privados persistentes |
| 2. Colaboración, interoperabilidad y generación | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicación Spring/web/PWA/Android generada |
| 3. Inteligencia, visión y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imágenes y demostración integral offline |

## Historial reciente

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-13 | Se cerró CU-0. | Reproducción limpia, E2E/manuales y GitHub Actions correctos. |
| 2026-09-14 | Se completó y archivó CU-1. | 9/9 tareas; reproducción limpia, revisión manual y `Verify base executable` #6 correctos. |
| 2026-09-14 | Se preparó y aprobó la planificación de CU-2.1. | Proposal, spec, design y tasks de `cu-2-1-modelo-validacion`. |
| 2026-09-14 | Se implementaron los bloques de dominio y validacion de CU-2.1. | Implementacion inicial completada; el cierre posterior queda documentado en la evidencia vigente de CU-2.1. |

## Historial de remediación CU-2.1 — 2026-09-15

El snapshot `3c030ef6674f82b674bd48823a95e2623c22f8d1` fue reproducido correctamente antes de la remediación runtime. Ese resultado queda como evidencia histórica porque precede a `ec30194`.

El verify posterior detectó que `parseProjectDocument` no validaba recursivamente el contrato cerrado. La remediación añadió validación runtime exhaustiva y regresiones negativas. También se agregó cobertura de composite válido y round-trip. Después de la remediación, `uml-domain` quedó en 37/37 tests.

## Evidencia vigente CU-2.1

- Rama: `feature/cu-2-1-modelo-validacion`.
- Snapshot limpio conductualmente verificado: `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`.
- Runtime-contract remediation `ec30194`: ancestro del snapshot.
- Comando: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Software-Parcial-1\project-planning\scripts\reproduce-clean.ps1"`.
- Resultado: reproducción limpia finalizada correctamente.
- `uml-domain`: 37/37 tests post-remediación.
- Composite válido y round-trip: cubiertos.
- PostgreSQL aislado: host port `55432`.
- Compose aislado: `primer-parcial-clean-fe04b87c22b7`.
- Health final: `available`.
- Contenedor temporal PostgreSQL: detenido correctamente.
- OpenSpec: 9/9 tareas.
- Verify estático más reciente: **CRITICAL: None**.

Verificación de comportamiento autorizada: completada correctamente mediante `reproduce-clean` sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`. Gate restante antes de `sync/archive`: repetir `/opsx-verify cu-2-1-modelo-validacion` y mantener fuera del cierre los cambios locales de `compose.yaml` y `opencode.json`.
