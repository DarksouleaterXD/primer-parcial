# CU-3 — Gestionar proyectos UML persistentes

**Estado:** En cierre técnico. Bloques 1–4 implementados y verificados; 20/21 tareas OpenSpec tras el precierre. La tarea 5.3 permanece pendiente hasta ejecutar `reproduce-clean` sobre un commit coherente y registrar esa evidencia.

## Objetivo

CU-3 incorpora persistencia durable y privada para `ProjectDocument` sin alterar la semántica de modelado de CU-2. El backend NestJS/PostgreSQL es autoritativo para ownership y revisión durable; el navegador accede a persistencia únicamente mediante `/api/projects`.

## Alcance implementado

- creación, listado, obtención/reapertura, renombre, guardado explícito y eliminación de proyectos privados;
- `ProjectDocument` canónico almacenado como JSONB, sin un segundo modelo UML;
- ownership derivado exclusivamente del JWT autenticado;
- `404` indistinguible para identificador ajeno o inexistente;
- concurrencia optimista mediante `expectedRevision`;
- `409` seguro ante revisión obsoleta, sin devolver documento, owner, timestamps ni revisión del servidor;
- parser y `validateProjectDocument(..., "save")` reutilizados antes de persistir;
- transacciones y mutaciones condicionadas por `id + owner_id + revision`;
- web repository API-only con Bearer desde el `sessionStorage` existente;
- reapertura que crea un `UmlCommandBus` local nuevo;
- guardado únicamente explícito de `bus.currentDocument`;
- la revisión durable del servidor se mantiene separada de la revisión local del Command Bus.

## Modelo de datos

Migración explícita: `1737000000000-create-uml-projects.ts`.

Tabla `uml_projects`:

| Campo | Tipo / regla |
|---|---|
| `id` | UUID, PK |
| `owner_id` | UUID, FK a `users.id`, `ON DELETE CASCADE` |
| `name` | varchar, requerido |
| `revision` | integer, `>= 0`, inicial 0 |
| `document` | JSONB, contiene el `ProjectDocument` canónico |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

Índice: `(owner_id, updated_at DESC, id)`.

TypeORM mantiene `synchronize: false`; el esquema se administra por migraciones explícitas.

## Contratos HTTP

Todas las rutas están bajo `/api/projects` y requieren JWT.

| Operación | Método / ruta | Resultado principal |
|---|---|---|
| Crear | `POST /api/projects` | `201 ProjectSnapshot` |
| Listar propios | `GET /api/projects` | `200 ProjectList` |
| Obtener / reabrir | `GET /api/projects/:projectId` | `200 ProjectSnapshot` |
| Renombrar | `PATCH /api/projects/:projectId/name` | `200 ProjectSnapshot` |
| Guardar documento | `PUT /api/projects/:projectId/document` | `200 ProjectSnapshot` |
| Eliminar | `DELETE /api/projects/:projectId` | `204` |

Errores públicos relevantes:

- `400 PROJECT_DOCUMENT_INVALID` o request inválido;
- `401` para sesión no autenticada;
- `404 PROJECT_NOT_FOUND` tanto para ajeno como inexistente;
- `409 PROJECT_REVISION_CONFLICT` para revisión obsoleta;
- `503 PROJECT_STORAGE_UNAVAILABLE` para fallo de almacenamiento.

Los DTOs no aceptan `ownerId` controlado por cliente.

## Concurrencia y atomicidad

`rename`, `save` y `delete` condicionan la escritura por `id + owner_id + revision` dentro de una transacción. Si la mutación afecta cero filas, una consulta adicional limitada a `(id, owner_id)` en la misma transacción clasifica:

- fila propia existente → `409`;
- ninguna fila propia → `404`.

No existe last-write-wins. Un request stale, inválido o ajeno no modifica documento, revisión ni timestamps.

## Frontera web

`apps/web/src/projects/project-repository.ts` encapsula fetch, Bearer, envelopes y outcomes tipados.

`apps/web/src/projects/project-workspace-session.ts` implementa el seam durable:

```text
ProjectSnapshot API
  -> parse ProjectDocument
  -> UmlCommandBus local
  -> workspace controller
  -> Save explícito
  -> API repository
```

`UmlCommandBus` no conoce PostgreSQL, HTTP, ownership ni revisión durable.

## Evidencia implementada antes del precierre

- Bloque 1: migración, repository/storage y round-trip PostgreSQL.
- Bloque 2: contratos, API privada, ownership, 404/409, concurrencia y rollback.
- Bloque 3: repository web, create/reopen, nuevo bus local y save explícito.
- Bloque 4: regresiones cross-layer de round-trip, seguridad/concurrencia y no regresión de CU-2/CU-2.3.
- Tests focalizados del Bloque 2: contracts 4/4 y API/repository 17/17.
- Regresión API reportada al cerrar Bloque 2: 35/35.
- OpenSpec strict y `git diff --check` quedaron correctos en los cierres de bloques previos.

## Precierre de Bloque 5

Resultado ejecutado por `CU-3-bloque5-preclose.ps1` el 2026-09-18:

- auditoría de exports y fronteras: correcta;
- `npm run lint`: correcto;
- `npm run typecheck`: correcto;
- `npm run test`: correcto;
- `npm run build`: correcto;
- `openspec validate cu-3-persistencia-proyectos --strict`: correcto;
- `git diff --check`: correcto;
- PostgreSQL local usado para pruebas: `127.0.0.1:5433`.

`reproduce-clean` **todavía no se declara ejecutado** en este documento. Debe correrse después de crear un commit coherente del CU-3 y su resultado real debe registrarse antes de marcar la tarea 5.3.

## Fuera de alcance confirmado

CU-3 no agrega:

- autosave;
- WebSocket/realtime;
- colaboración, presencia, share o roles;
- persistencia de Undo/Redo;
- merge automático de conflictos;
- historial completo de revisiones;
- XMI;
- generación;
- IA;
- cambios al catálogo de 27 comandos;
- cambios a la semántica de `UmlCommandBus`.

## Gate de cierre

1. Crear commit coherente con la implementación y este precierre.
2. Ejecutar `scripts/reproduce-clean.ps1` sobre ese snapshot.
3. Registrar snapshot, Compose project, puerto PostgreSQL, health y cleanup.
4. Marcar 5.3 solo con esa evidencia.
5. Ejecutar `/opsx-verify cu-3-persistencia-proyectos`.
6. Resolver cualquier hallazgo crítico antes de sync/archive.
