# Desarrollo local en Windows / PowerShell

**Estado:** CU-0.2 aporta una base web/API/PostgreSQL ejecutable y tiene evidencia de build. La reproducción limpia es trabajo pendiente de CU-0.3. El documento [CU-0](../puds/use-cases/CU-0-inicializar-base.md) conserva la evidencia y límites de cada incremento.

## Requisitos

Abrí PowerShell 7+ en `D:\project-planning`.

| Herramienta | Versión comprobada |
|---|---|
| Node.js | `v24.11.1` |
| npm | `11.6.2` |
| Docker Engine | `29.7.2` |
| Docker Compose | `v5.5.1` |

Usá la línea 24 de Node y npm 11, según `.node-version`, `.nvmrc` y `package.json`. Si una versión no coincide, detené la ejecución y corregí el entorno antes de atribuir el fallo al proyecto.

## Arranque local

Instalá las dependencias desde la raíz usando el lockfile versionado:

```powershell
npm ci
```

Iniciá PostgreSQL local. El contenedor publica únicamente `127.0.0.1:5432` y conserva sus datos en el volumen nombrado `postgres_data`:

```powershell
docker compose up -d --wait
docker compose exec -T postgres pg_isready -U primer_parcial_local -d primer_parcial
```

La API lee variables del entorno del proceso, no carga automáticamente archivos `.env`. Definí los orígenes antes de arrancar ambos workspaces en la misma terminal:

```powershell
$env:WEB_ORIGIN = "http://localhost:4321"
$env:PUBLIC_API_ORIGIN = "http://localhost:3000"
npm run dev
```

La API queda en `http://localhost:3000` y la web en `http://localhost:4321`. Abrí la web y verificá el texto `API disponible`. La API expone `GET /api/health`, Swagger en `http://localhost:3000/api/docs` y el documento OpenAPI en `http://localhost:3000/api/docs-json`.

Los ejemplos `.env.example` solo contienen valores sintéticos. Compose puede leer el `.env` raíz para PostgreSQL, pero los procesos Node requieren variables exportadas como en el ejemplo anterior. No guardes ni imprimas credenciales reales.

## Comprobaciones

```powershell
npm run lint
npm run typecheck
npm run test
docker compose ps
```

El health devuelve `200` y `{ "status": "available" }` cuando puede ejecutar `SELECT 1` en PostgreSQL. Si la base no está disponible, devuelve `503` y `{ "status": "unavailable" }`, sin detalles de conexión. La isla web realiza una única consulta, tiene timeout y muestra `API no disponible` ante fallo, respuesta inválida o estado no 200.

## Reproducción limpia

La receta de CU-0.3 crea una copia temporal desde un commit Git, fuera de `D:\project-planning`; usa `git archive`, por lo que no copia cambios sin versionar, `node_modules`, builds ni archivos `.env` reales. Desde la raíz, elegí el commit a verificar y ejecutá:

```powershell
$snapshot = git rev-parse HEAD
pwsh -NoProfile -File .\scripts\reproduce-clean.ps1 -Snapshot $snapshot
```

La receta verifica Node, npm, Docker y el único `package-lock.json` raíz; ejecuta `npm ci`, lint, typecheck, tests y build dentro de la copia. Después inicia solamente un proyecto Compose temporal, comprueba `pg_isready`, arranca la API en el puerto sintético `3100` y exige `GET /api/health` disponible. No ejecuta E2E ni abre el navegador.

PostgreSQL conserva el puerto contractual `127.0.0.1:5432`. Si ese puerto, el `3100`, Docker o el snapshot no están disponibles, la receta aborta y no toca los servicios ni archivos del checkout. Al finalizar detiene únicamente su servicio Compose aislado y elimina únicamente su propio directorio temporal, salvo que se agregue `-KeepTemporaryDirectory` para inspección.

## Revisión manual de navegador

Esta revisión es distinta de `npm run test:e2e` y requiere una persona que observe el navegador. Con PostgreSQL healthy, exportá los orígenes y ejecutá `npm run dev`; abrí `http://localhost:4321` y registrá la fecha, URL y el texto `API disponible`.

Después, desde otra terminal en la raíz, ejecutá `docker compose stop postgres`, abrí una nueva pestaña o recargá la página y registrá `API no disponible`. Restaurá solo el servicio con `docker compose up -d --wait`, comprobá `pg_isready`, abrí una nueva pestaña o recargá y registrá nuevamente `API disponible`.

La evidencia manual debe indicar la fecha, URL, ambos estados, recuperación y resultado. No se considera realizada hasta que una persona aporte esas observaciones; no uses `docker compose down -v` ni borres datos o volúmenes.

Para detener solo el contenedor local sin borrar datos:

```powershell
docker compose stop postgres
```

Restauralo con `docker compose up -d --wait`. No uses comandos de borrado de volúmenes para una prueba rutinaria.

## Configuración y seguridad

- `compose.yaml` usa `postgres:18.6-alpine`, healthcheck `pg_isready`, volumen nombrado y publicación loopback fija.
- `WEB_ORIGIN` debe ser una URL concreta. La API rechaza origen vacío o `*`; CORS usa ese origen para los métodos HTTP documentados.
- `PUBLIC_API_ORIGIN` es el origen de la API para la web. No incluyas rutas ni secretos.
- `.env` y variantes reales están ignorados; `.env.example` se puede versionar porque sus datos no son secretos.
- La raíz npm es privada y los workspaces viven en `apps/*` y `packages/*`.

## Pendientes

- CU-0.3 cubre CI, E2E, reproducción limpia, build y cierre de CU-0.
- GitHub futuro `DarksouleaterXD/primer-parcial` no es necesario para ejecutar localmente. No hagas commit ni push sin autorización explícita.
