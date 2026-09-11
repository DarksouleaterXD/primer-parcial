## Why

CU-0.1 dejó configurada la topología del monorepositorio, pero aún no existe una base que una navegador, API y PostgreSQL de forma verificable. CU-0.2 habilita ese primer recorrido ejecutable y observable sin adelantar capacidades del editor CASE ni de los CUs posteriores.

## What Changes

### Alcance

- Crear `apps/web` con Astro, TypeScript y una isla Preact `ApiStatus` que consulte al backend y muestre los estados comprobando, API disponible y API no disponible, incluidos timeout y error de red.
- Crear `apps/api` con NestJS 11 sobre Express, conexión TypeORM a PostgreSQL y `GET /api/health`, que responda `200` cuando la API y PostgreSQL estén disponibles y `503` cuando la dependencia no esté disponible.
- Definir en `packages/contracts` exclusivamente el contrato tipado de health, consumido por web y API.
- Publicar la documentación Swagger de la API principal en `/api/docs` y `/api/docs-json`; configurar CORS mediante variable de entorno, sin permitir el origen comodín.
- Instalar las dependencias necesarias, generar el único `package-lock.json` raíz y proveer scripts reales de desarrollo, pruebas, lint, tipos y build.
- Añadir pruebas mínimas de health, contrato y `ApiStatus`, y actualizar solamente la documentación vinculada con CU-0.2.

### Fuera de alcance

- CI, Playwright completo y el cierre de calidad/reproducibilidad de CU-0.3.
- Autenticación, CRUD, dominio o canvas UML, WebSockets, colaboración, XMI, generación, voz, imágenes, IA y operación offline completa.
- Dependencias no exigidas por este incremento, refactorizaciones preventivas o abstracciones para capacidades futuras.

## Capabilities

### New Capabilities

- `api-health`: Contrato de salud de la API principal que refleja la disponibilidad real de PostgreSQL, se documenta mediante OpenAPI y se comparte de forma tipada.
- `web-api-status`: Isla web que consulta el health de la API y comunica disponibilidad, timeout y fallos de red sin informar un estado saludable falso.
- `base-executable-workspaces`: Workspaces y comandos raíz mínimos para instalar, ejecutar y verificar exclusivamente la web, la API y el contrato de health de CU-0.2.

### Modified Capabilities

- Ninguna: el repositorio no contiene capacidades OpenSpec existentes.

## Impact

- Se incorporan los workspaces `apps/web`, `apps/api` y `packages/contracts`, además del lockfile raíz y sus scripts de trabajo.
- Se integra la API NestJS principal con PostgreSQL mediante TypeORM, y la web Astro/Preact consume `GET /api/health` bajo configuración de entorno y CORS restringido.
- Sustentan el cambio `docs/puds/use-cases/CU-0-inicializar-base.md`, `docs/puds/use-cases/README.md`, `docs/architecture/README.md`, `docs/decisions/ADR-0001-initial-technical-boundaries.md`, `docs/STATUS.md` y `docs/product/product-05-astro-nestjs.md`.
