# Desarrollo local en Windows / PowerShell

**Estado:** CU-0 está terminado. CU-1 tiene cuenta/sesión, checks locales, E2E Chromium, reproducción limpia, build, revisión manual y CI remoto verificados; está formalmente listo para `/opsx-sync` y `/opsx-archive`. Consultá [CU-0](../puds/use-cases/CU-0-inicializar-base.md) y [CU-1](../puds/use-cases/CU-1-cuenta-sesion.md) para la evidencia real.

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
$env:JWT_SECRET = "local-example-jwt-secret-only"
$env:JWT_EXPIRES_IN_SECONDS = "900"
$env:BCRYPT_COST = "12"
npm run migration:run --workspace @primer-parcial/api
npm run dev
```

La API queda en `http://localhost:3000` y la web en `http://localhost:4321`. La migración crea `users` y nunca se ejecuta durante el bootstrap. Abrí la web y verificá el texto `API disponible`. La API expone `GET /api/health`, Swagger en `http://localhost:3000/api/docs` y el documento OpenAPI en `http://localhost:3000/api/docs-json`.

Los ejemplos `.env.example` solo contienen valores sintéticos. Compose puede leer el `.env` raíz para PostgreSQL, pero los procesos Node requieren variables exportadas como en el ejemplo anterior. No guardes ni imprimas credenciales reales.

## Comprobaciones

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
docker compose ps
```

El health devuelve `200` y `{ "status": "available" }` cuando puede ejecutar `SELECT 1` en PostgreSQL. Si la base no está disponible, devuelve `503` y `{ "status": "unavailable" }`, sin detalles de conexión. La isla web realiza una única consulta, tiene timeout y muestra `API no disponible` ante fallo, respuesta inválida o estado no 200.

CU-1 agrega `/register`, `/login` y `/workspace`. Registro usa nombres, apellidos, email y password; login usa únicamente `email + password`. El JWT se conserva solo en `sessionStorage` y el cierre de sesión lo elimina en el cliente, sin endpoint de logout. Las variables de autenticación son obligatorias: `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS` y `BCRYPT_COST`. Los valores de ejemplo son sintéticos y no son aptos para despliegue.

### Variables PostgreSQL para tests locales

Los helpers de tests API respetan `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_TEST_DB`. Si no se definen, conservan los valores locales historicos y puerto `5432`, que siguen siendo los usados por CI y `reproduce-clean`.

Si una estacion de trabajo publica PostgreSQL en otro puerto de host, por ejemplo `5433`, exporta ese puerto en la misma terminal antes de `npm run test`; no es necesario cambiar ni commitear `compose.yaml` para adaptar los tests.

## Reproducción limpia
### Puerto PostgreSQL de la reproduccion limpia

`reproduce-clean.ps1` prefiere `127.0.0.1:5432` para el PostgreSQL aislado. Si ese puerto ya esta ocupado o reservado en la estacion local, la receta selecciona automaticamente el primer puerto libre entre `55432` y `55531`, modifica solo el `compose.yaml` de la copia temporal y propaga ese puerto mediante `POSTGRES_PORT` a API/tests/E2E. El `compose.yaml` versionado no se modifica y ningun servicio existente es detenido.


La receta de CU-0.3 crea una copia temporal desde un commit Git, fuera de `D:\project-planning`; usa `git archive`, por lo que no copia cambios sin versionar, `node_modules`, builds ni archivos `.env` reales. Desde la raíz, elegí el commit a verificar y ejecutá:

```powershell
$snapshot = git rev-parse HEAD
pwsh -NoProfile -File .\scripts\reproduce-clean.ps1 -Snapshot $snapshot
```

La receta verifica Node, npm, Docker y el único `package-lock.json` raíz; ejecuta `npm ci`, inicia PostgreSQL, aplica las migraciones de usuarios, corre lint, typecheck, tests, E2E Chromium y build dentro de la copia. Después inicia solamente un proyecto Compose temporal, comprueba `pg_isready`, arranca la API en el puerto sintético `3100` y exige `GET /api/health` disponible. La suite E2E reserva `3101` y `4322` para no reutilizar procesos externos ni alterar la validez de su JWT de prueba.

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

### Cuenta y sesión

Con la API, web y PostgreSQL iniciados según el arranque local, una persona debe comprobar en `http://localhost:4321`:

1. Abrir `Registro`, recorrer nombres, apellidos, email, contraseña y botón con `Tab`. Intentar nombres/apellidos vacíos o solo espacios, email inválido y contraseña corta; comprobar labels, foco y mensaje público.
2. Registrar una cuenta sintética nueva y confirmar que se muestra el resultado sin password ni detalles internos.
3. Abrir `Iniciar sesión`, confirmar que solo muestra email y contraseña; probar una contraseña incorrecta y comprobar que el mensaje es genérico. Luego iniciar sesión correctamente y comprobar que el área privada muestra nombre y apellido.
4. Activar `Cerrar sesión`; confirmar retorno a la landing y que una navegación posterior a `/workspace` vuelve a login.
5. Repetir la inspección en escritorio, tablet y móvil, confirmando que no hay overflow horizontal ni controles inaccesibles. Anotar fecha, URL, navegador, resultado y cualquier incidencia en el documento CU-1. No declarar esta revisión realizada hasta aportar esas observaciones humanas.

## Configuración y seguridad

- `compose.yaml` usa `postgres:18.6-alpine`, healthcheck `pg_isready`, volumen nombrado y publicación loopback fija.
- `WEB_ORIGIN` debe ser una URL concreta. La API rechaza origen vacío o `*`; CORS usa ese origen para los métodos HTTP documentados.
- `PUBLIC_API_ORIGIN` es el origen de la API para la web. No incluyas rutas ni secretos.
- `.env` y variantes reales están ignorados; `.env.example` se puede versionar porque sus datos no son secretos.
- La raíz npm es privada y los workspaces viven en `apps/*` y `packages/*`.

## Estado del CU-0

- El workflow `Verify base executable` pasó en GitHub Actions #3 para `0a0337b2a283098f53e3392ec062d0644c1ac386`, con Node `v24.11.1` y npm `11.6.2`.
- CU-1 está formalmente listo para `/opsx-sync` y `/opsx-archive`. No hagas commit ni push sin autorización explícita.

### Historial - evidencia reproduce-clean previa a remediacion CU-2.1 - 2026-09-15

El snapshot `3c030ef6674f82b674bd48823a95e2623c22f8d1` fue reproducido correctamente. Como `5432` estaba ocupado, la receta portable uso el puerto aislado `55432` sin modificar el `compose.yaml` versionado ni detener servicios existentes. El resultado final fue 5/5 E2E Chromium, build raiz correcto y health `available`.

### Remediacion runtime CU-2.1

El verify posterior a la primera reproduccion limpia encontro que el parser aceptaba formas JSON que violaban contratos cerrados. Tras corregir parser/validador, la evidencia del snapshot anterior es historica. Debe ejecutarse `reproduce-clean` otra vez sobre un commit que incluya la remediacion antes de archivar CU-2.1.

### Evidencia reproduce-clean CU-2.1 - 2026-09-15

El snapshot `3c030ef6674f82b674bd48823a95e2623c22f8d1` fue reproducido correctamente. Como `5432` estaba ocupado, la receta portable uso el puerto aislado `55432` sin modificar el `compose.yaml` versionado ni detener servicios existentes. El resultado final fue 5/5 E2E Chromium, build raiz correcto y health `available`.

### Estado de verificacion CU-2.1 post-remediacion

El paquete uml-domain tiene 37/37 tests correctos post-remediacion, incluyendo una composicion valida y su round-trip. La evidencia
eproduce-clean anterior a ec30194 es historica. Debe versionarse el estado actual y ejecutar una nueva reproduccion limpia antes de cerrar OpenSpec 3.2.

### Evidencia limpia vigente CU-2.1

Comando ejecutado:

`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Software-Parcial-1\project-planning\scripts\reproduce-clean.ps1"`

Resultado observado:

- snapshot: `6f7f4759bd74516ee1bead9645fe2cb975af1b8f`;
- rama: `feature/cu-2-1-modelo-validacion`;
- Compose project: `primer-parcial-clean-50365d5da937`;
- PostgreSQL host port: `55432`;
- health final: `available`;
- contenedor PostgreSQL temporal: `Stopped`;
- tests `uml-domain` post-remediacion previos al snapshot: 37/37 correctos;
- composite valido y round-trip: cubiertos.

Esta es la evidencia vigente para OpenSpec 3.2. La reproduccion de `3c030ef6674f82b674bd48823a95e2623c22f8d1` es solo historica.
