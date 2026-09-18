# Contexto de continuidad para nuevos chats y agentes

## Proyecto

- Nombre: **Primer Parcial** (`primer-parcial`).
- Repositorio: `DarksouleaterXD/primer-parcial`.
- Ruta local vigente: `C:\Software-Parcial-1\project-planning`.
- Stack: Node.js 24, npm workspaces, Astro/Preact, NestJS 11/Express, TypeORM y PostgreSQL.
- OpenSpec: schema `spec-driven`.
- CU activo: **CU-3 — Gestionar proyectos UML persistentes**.
- Cambio activo: `cu-3-persistencia-proyectos`.
- Rama de trabajo esperada: `feature/cu-3-persistencia-proyectos`.

## Estado funcional

CU-0, CU-1 y CU-2 están cerrados. CU-2 dejó:

- `ProjectDocument` canónico y validador;
- catálogo cerrado de 27 comandos;
- `UmlCommandBus`;
- Undo/Redo local acotado;
- workspace visual manual;
- `MoveNode`, selección, Inspector, relaciones y routing visual.

CU-3 está en cierre técnico. Después del precierre tiene **20/21 tareas**. La única tarea pendiente es 5.3, que requiere `reproduce-clean` real sobre un commit coherente.

## Arquitectura CU-3

```text
@primer-parcial/uml-domain
  ProjectDocument + parser + validator
            |
            v
NestJS application service
            |
            v
TypeORM repository / PostgreSQL JSONB
```

El navegador usa:

```text
/api/projects
  -> project-repository
  -> ProjectSnapshot
  -> parse ProjectDocument
  -> nuevo UmlCommandBus local
  -> workspace controller
  -> Save explícito
```

Reglas:

- backend determina owner desde JWT;
- browser nunca decide ownership;
- web nunca accede directamente a DB/TypeORM;
- `UmlCommandBus` nunca persiste por sí mismo;
- `404` no distingue ajeno/inexistente;
- stale revision produce `409`;
- no last-write-wins;
- no autosave;
- no persistencia de Undo/Redo.

## Tabla durable

`uml_projects`:

- `id` UUID PK;
- `owner_id` UUID FK a `users.id`, cascade;
- `name`;
- `revision >= 0`;
- `document` JSONB con el único `ProjectDocument` canónico;
- `created_at` / `updated_at`;
- índice `(owner_id, updated_at DESC, id)`.

## Evidencia vigente CU-3

Bloques 1–4 están completos.

Evidencia ya observada durante implementación:

- contratos de proyectos: 4/4 en el cierre del Bloque 2;
- tests focalizados API/repository: 17/17 en el cierre del Bloque 2;
- regresión API: 35/35 en el cierre del Bloque 2;
- Bloque 4 agregó regresiones cross-layer sin modificar comportamiento productivo.

Precierre Bloque 5, 2026-09-18:

- auditoría de exports/fronteras: correcta;
- lint raíz: correcto;
- typecheck raíz: correcto;
- tests raíz: correctos;
- build raíz: correcto;
- OpenSpec strict: correcto;
- `git diff --check`: correcto;
- PostgreSQL local de pruebas: `127.0.0.1:5433`.

No afirmar todavía `reproduce-clean` de CU-3.

## Próximos pasos exactos

1. Revisar `git status` y excluir de staging `compose.yaml` y `opencode.json`.
2. Crear commit coherente de CU-3 con 5.3 todavía pendiente.
3. Ejecutar `scripts/reproduce-clean.ps1` sobre ese snapshot.
4. Registrar la evidencia real y marcar 5.3.
5. Ejecutar `/opsx-verify cu-3-persistencia-proyectos`.
6. Si no hay CRITICAL, continuar con sync/archive.
7. Solo después iniciar CU-4.

## Acuerdo de trabajo

Para este proyecto, las implementaciones/correcciones se entregan preferentemente como scripts PowerShell deterministas. Los scripts deben usar preflight, proteger configuración local, hacer rollback cuando corresponda y evitar `git add`, commit o push salvo autorización explícita.

`compose.yaml` y `opencode.json` son ajustes locales del usuario y deben permanecer fuera de los commits del CU salvo indicación expresa.
