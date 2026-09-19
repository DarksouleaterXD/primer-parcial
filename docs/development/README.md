# Desarrollo local en Windows / PowerShell

## Requisitos

Trabajá desde:

```powershell
cd C:\Software-Parcial-1\project-planning
```

Versiones aprobadas:

- Node.js 24.x;
- npm 11.x;
- Docker Engine / Docker Compose;
- PostgreSQL 18.6-alpine mediante Compose.

## Instalación

```powershell
npm ci
```

## PostgreSQL y migraciones

```powershell
docker compose up -d --wait postgres
```

La API usa variables de entorno. Ejemplo local:

```powershell
$env:WEB_ORIGIN = "http://localhost:4321"
$env:PUBLIC_API_ORIGIN = "http://localhost:3000"
$env:JWT_SECRET = "local-example-jwt-secret-only"
$env:JWT_EXPIRES_IN_SECONDS = "900"
$env:BCRYPT_COST = "12"

npm run migration:run --workspace @primer-parcial/api
```

Las migraciones vigentes crean:

- `users`;
- nombres de usuario;
- `uml_projects`.

No usar `synchronize`.

Si la estación publica PostgreSQL en un puerto distinto, exportá `POSTGRES_PORT` para los procesos Node/tests; no es necesario commitear un cambio local de `compose.yaml`.

## Arranque

```powershell
npm run dev
```

Servicios esperados:

- web: `http://localhost:4321`;
- API: `http://localhost:3000`;
- Swagger: `http://localhost:3000/api/docs`;
- OpenAPI JSON: `http://localhost:3000/api/docs-json`.

## API de proyectos CU-3

Todas las operaciones requieren JWT Bearer:

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId/name
PUT    /api/projects/:projectId/document
DELETE /api/projects/:projectId
```

Ownership se deriva del JWT. El browser nunca envía un `ownerId` autoritativo.

Mutaciones usan `expectedRevision`; stale produce `409`. Ajeno/inexistente produce el mismo `404`.

## Persistencia desde web

La web usa exclusivamente el project repository HTTP. No accede a TypeORM/PostgreSQL.

Reabrir:

```text
GET snapshot -> parse -> UmlCommandBus -> workspace
```

Guardar:

```text
Save explícito -> bus.currentDocument + durableRevision -> PUT /document
```

No existe autosave ni persistencia de Undo/Redo.

## Checks normales

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
openspec validate cu-3-persistencia-proyectos --strict
git diff --check
```

El precierre de CU-3 ejecutó correctamente esos checks el 2026-09-18 usando PostgreSQL local en `127.0.0.1:5433`.

## Reproducción limpia

La receta usa un snapshot Git y un Compose temporal aislado:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\reproduce-clean.ps1"
```

La receta verifica instalación limpia, migraciones, lint, typecheck, tests, E2E, build, health y cleanup.

Para CU-3, la reproducción limpia final se completó correctamente el 2026-09-18 sobre el snapshot `c277946d0a9d6ab69f043fd20c2bf4b8592cb20e`, con Compose project `primer-parcial-clean-f65295ccce3a`, PostgreSQL aislado en `127.0.0.1:55432`, Playwright `5/5`, build correcto, health `available` y cleanup del contenedor PostgreSQL confirmado.

## Seguridad de configuración local

`compose.yaml` y `opencode.json` pueden contener ajustes exclusivamente locales. No usar `git add .` si esos archivos no deben formar parte del commit.
