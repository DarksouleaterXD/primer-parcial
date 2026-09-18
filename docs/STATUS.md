# Estado real del proyecto

Última actualización: 2026-09-18

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), 12 CUs en 3 ciclos.
- CU-0 — Inicializar la base ejecutable: **terminado y archivado**.
- CU-1 — Gestionar cuenta y sesión: **terminado y archivado**.
- CU-2 — Modelar diagramas UML manualmente: **terminado** en sus incrementos CU-2.1, CU-2.2 y CU-2.3; CU-2.3 quedó archivado y la reproducción limpia del snapshot `67f01a8bc4663cf45d1b363ea31c1347d017ca0b` terminó con health `available`.
- CU-3 — Gestionar proyectos UML persistentes: **implementado y listo para verificación**, 21/21 tareas. `reproduce-clean` pasó sobre el snapshot `c277946d0a9d6ab69f043fd20c2bf4b8592cb20e`; quedan verify/sync/archive.
- CU-4 a CU-11: pendientes.

## CU-3 — Implementación vigente

CU-3 conserva proyectos UML privados y durables usando el `ProjectDocument` canónico ya definido en CU-2.

### Backend

- migración TypeORM explícita `CreateUmlProjects1737000000000`;
- tabla `uml_projects` con UUID, `owner_id`, nombre, revisión no negativa, JSONB canónico y auditoría;
- FK `owner_id -> users.id` con `ON DELETE CASCADE`;
- índice `(owner_id, updated_at DESC, id)`;
- repository/storage con parser/serializer canónico;
- ownership derivado del JWT;
- API `/api/projects` para create/list/get/rename/save/delete;
- `404` indistinguible para ajeno/inexistente;
- `409` seguro para revisión stale;
- mutaciones condicionadas por `id + owner_id + revision` dentro de transacciones;
- save usa parser y `validateProjectDocument(..., "save")`.

### Web

- repository tipado API-only;
- Bearer desde la sesión existente;
- create/reopen construye un nuevo `UmlCommandBus` local;
- save es explícito y usa `bus.currentDocument`;
- outcomes 404/409 tipados;
- sin acceso a PostgreSQL/TypeORM desde browser;
- sin autosave ni persistencia de Undo/Redo.

### Regresión

Bloques 1–4 completaron:

- round-trip dominio -> JSONB -> dominio;
- aislamiento de owners;
- concurrencia optimista y rollback;
- no regresión de 27 comandos, Command Bus, Undo/Redo y workspace CU-2.3.

## Cierre técnico CU-3 — 2026-09-18

`CU-3-bloque5-preclose.ps1` verificó correctamente auditoría de exports/fronteras, lint, typecheck, tests, build, OpenSpec strict y `git diff --check` usando PostgreSQL local en `127.0.0.1:5433`.

La reproducción limpia final se ejecutó correctamente sobre un snapshot Git coherente:

- snapshot: `c277946d0a9d6ab69f043fd20c2bf4b8592cb20e`;
- Compose project aislado: `primer-parcial-clean-f65295ccce3a`;
- PostgreSQL host port aislado: `55432`;
- migraciones: correctas;
- lint, typecheck y suites de tests: correctos;
- Playwright E2E: `5/5`;
- build raíz: correcto;
- health final: `available`;
- cleanup: contenedor PostgreSQL aislado detenido.

CU-3 queda implementado con 21/21 tareas y listo para `verify`; sync/archive permanecen pendientes hasta completar esa verificación.

## Progreso OpenSpec CU-3

| Bloque | Tareas | Estado |
|---|---:|---|
| 1. Persistencia y esquema backend | 1.1–1.3 | Completo |
| 2. API, ownership y concurrencia | 2.1–2.8 | Completo |
| 3. Frontera web | 3.1–3.3 | Completo |
| 4. Seguridad, round-trip y regresión | 4.1–4.3 | Completo |
| 5. Integración y cierre | 5.1–5.4 | Completo |
| **Total** | **21/21** | **Listo para verify** |

## Fuera de alcance de CU-3

No se agregaron autosave, realtime/WebSocket, colaboración/presencia/share/roles, Undo/Redo persistido, merge de conflictos, XMI, generación, IA ni cambios a los 27 comandos o a `UmlCommandBus`.

## Configuración local

`compose.yaml` y `opencode.json` pueden contener ajustes locales del usuario. No deben incorporarse accidentalmente a commits del CU salvo autorización explícita.
