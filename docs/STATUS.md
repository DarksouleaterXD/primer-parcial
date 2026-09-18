# Estado real del proyecto

Última actualización: 2026-09-18

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`), 12 CUs en 3 ciclos.
- CU-0 — Inicializar la base ejecutable: **terminado y archivado**.
- CU-1 — Gestionar cuenta y sesión: **terminado y archivado**.
- CU-2 — Modelar diagramas UML manualmente: **terminado** en sus incrementos CU-2.1, CU-2.2 y CU-2.3; CU-2.3 quedó archivado y la reproducción limpia del snapshot `67f01a8bc4663cf45d1b363ea31c1347d017ca0b` terminó con health `available`.
- CU-3 — Gestionar proyectos UML persistentes: **en cierre técnico**, 20/21 tareas después del precierre. Falta únicamente la evidencia de `reproduce-clean` de 5.3 antes de verify/sync/archive.
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

## Precierre CU-3 — 2026-09-18

`CU-3-bloque5-preclose.ps1` verificó correctamente:

- auditoría de exports/fronteras;
- lint raíz;
- typecheck raíz;
- tests raíz;
- build raíz;
- OpenSpec strict;
- `git diff --check`.

PostgreSQL de las pruebas locales fue publicado en `127.0.0.1:5433`.

No se atribuye todavía una reproducción limpia a CU-3. La tarea 5.3 permanece pendiente hasta ejecutar `scripts/reproduce-clean.ps1` sobre un commit coherente y registrar su evidencia.

## Progreso OpenSpec CU-3

| Bloque | Tareas | Estado |
|---|---:|---|
| 1. Persistencia y esquema backend | 1.1–1.3 | Completo |
| 2. API, ownership y concurrencia | 2.1–2.8 | Completo |
| 3. Frontera web | 3.1–3.3 | Completo |
| 4. Seguridad, round-trip y regresión | 4.1–4.3 | Completo |
| 5. Integración y cierre | 5.1, 5.2 y 5.4 completos; 5.3 pendiente | En cierre |
| **Total** | **20/21** | **Reproduce-clean pendiente** |

## Fuera de alcance de CU-3

No se agregaron autosave, realtime/WebSocket, colaboración/presencia/share/roles, Undo/Redo persistido, merge de conflictos, XMI, generación, IA ni cambios a los 27 comandos o a `UmlCommandBus`.

## Configuración local

`compose.yaml` y `opencode.json` pueden contener ajustes locales del usuario. No deben incorporarse accidentalmente a commits del CU salvo autorización explícita.
