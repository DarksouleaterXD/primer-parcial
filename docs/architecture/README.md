# Arquitectura aprobada — Primer Parcial

## Estado

CU-0, CU-1 y CU-2 están cerrados. CU-3 agrega persistencia durable privada sobre el mismo `ProjectDocument` canónico y se encuentra en cierre técnico; después del precierre quedan 20/21 tareas y falta únicamente `reproduce-clean` para 5.3.

## Capas

```text
Astro / Preact
  |
  | HTTP Bearer
  v
NestJS project controller
  |
  v
UmlProjectService
  |
  v
UmlProjectRepository / TypeORM
  |
  v
PostgreSQL uml_projects.document JSONB
```

El dominio permanece independiente:

```text
@primer-parcial/uml-domain
  |- ProjectDocument
  |- CanonicalUmlModel
  |- DiagramLayout
  |- GenerationProfile
  |- parser / serializer
  |- validator
  |- UmlCommandBus + Undo/Redo local
```

NestJS/TypeORM dependen del dominio; el dominio no depende de NestJS, TypeORM, PostgreSQL, Astro o Preact.

## Persistencia de proyectos

CU-3 no crea un segundo modelo UML. `uml_projects.document` almacena el JSON canónico completo.

La fila durable también materializa metadata necesaria para ownership, listado y concurrencia:

- `id`;
- `owner_id`;
- `name`;
- `revision`;
- `created_at`;
- `updated_at`.

La aplicación valida coherencia entre metadata y documento antes de aceptar un save.

## Ownership

Todas las rutas `/api/projects` usan JWT. `ownerId` se obtiene de `request.user.id`; los payloads públicos no controlan ownership.

Un ID ajeno y un ID inexistente comparten `404 PROJECT_NOT_FOUND`.

## Concurrencia optimista

Rename, save y delete usan `expectedRevision` y una condición equivalente a:

```sql
WHERE id = :projectId
  AND owner_id = :ownerId
  AND revision = :expectedRevision
```

Una revisión obsoleta devuelve `409 PROJECT_REVISION_CONFLICT`. No se devuelve snapshot autoritativo en el conflicto y no existe merge automático.

## Frontera web

`apps/web/src/projects/project-repository.ts` es el único adapter web de persistencia.

`project-workspace-session.ts` mantiene separados:

- revisión durable del servidor;
- revisión local de `UmlCommandBus`.

Crear/reabrir produce un nuevo bus local. Guardar es una acción explícita. Comandos, Undo y Redo no disparan persistencia.

## Esquema PostgreSQL

Migración explícita `1737000000000-create-uml-projects.ts`.

- `synchronize: false`;
- JSONB;
- FK owner con cascade;
- check de revisión no negativa;
- índice de listado owner/update/id.

## Límites

CU-3 no incorpora:

- WebSocket/realtime;
- colaboración/presencia;
- share/roles;
- autosave;
- historial durable de Undo/Redo;
- historial de revisiones;
- XMI;
- generación;
- IA.

## Regresión y precierre

Las regresiones cross-layer cubren round-trip, aislamiento, concurrencia y la independencia de CU-2/CU-2.3.

En el precierre del 2026-09-18 pasaron lint, typecheck, tests, build, OpenSpec strict y `git diff --check`. PostgreSQL local fue `127.0.0.1:5433`.

La reproducción limpia de CU-3 sigue pendiente y no debe declararse ejecutada hasta realizarla sobre un commit coherente.
