# Desarrollo inicial en Windows / PowerShell

**CU-0.1 solo tiene configuración y documentación.** Esta guía comprueba el repositorio sin instalar dependencias, crear lockfile ni iniciar servicios. El [CU-0](../puds/use-cases/CU-0-inicializar-base.md) registra resultados y pendientes.

## Requisitos y ubicación

Abrí PowerShell 7+ en `D:\project-planning` usando tu terminal/editor. Si la ruta tiene espacios, usá comillas dobles al pasarla a un comando.

| Herramienta | Requisito / finalidad | Versión observada en CU-0.1 |
|---|---|---|
| Git | Inspección del repositorio y rama | `2.39.2.windows.1` |
| Node.js | Línea 24; `.node-version` y `.nvmrc` fijan inicialmente `24.11.1` | `v24.11.1` |
| npm | Línea 11; gestor workspace, `packageManager` documenta `11.6.2` | `11.6.2` |
| Docker CLI + Compose | Validación de YAML/Compose sin motor | `28.5.1` / `v2.40.2-desktop.1` |
| Docker Engine | Necesario desde CU-0.2 para ejecutar PostgreSQL | No operativo según diagnóstico previo/estado informado |

Si falta una herramienta, detené el paso y registrá el error; su instalación no pertenece a esta entrega. Los archivos de versión documentan la selección: no instalan Node ni aseguran que un gestor Windows los lea automáticamente. Compará siempre la versión activa.

## Comprobación rápida

Ejecutá cada línea desde la raíz; todas son de inspección/validación:

```powershell
git status --short --branch
git branch --show-current
git --version
node --version
npm --version
docker --version
docker compose version
node docs/development/validate-cu-0.1.mjs
docker compose config --quiet
git diff --check
git diff --stat
git diff
```

- Rama esperada: `feature/cu-0-inicializar-base`. Si difiere, detenete y reportalo; no cambies de rama automáticamente.
- `validate-cu-0.1.mjs` es un verificador documental/configuración, no código de aplicación. Usa solo bibliotecas incluidas en Node y Git de lectura, no red, dependencias ni motor Docker. También puede ejecutarse con `npm run check:cu-0.1` sin instalar.
- El verificador comprueba JSON, Markdown/enlaces, 12/3, máximo tres incrementos, mapa histórico, preservación íntegra del plan anterior y cambios exclusivamente de referencias en benchmarks, políticas declaradas y archivos prematuros. La comparación histórica usa el commit base documentado en el propio verificador.
- `docker compose config --quiet`: salida vacía y código 0 indican configuración válida. No prueba imagen descargada, health ni persistencia.
- `git diff --check`: salida vacía y código 0 indican ausencia de errores de whitespace en cambios rastreados. Revisá además archivos nuevos: `git diff` sin staging no los muestra; el verificador también revisa su texto.

Podés consultar el código de salida nativo con `$LASTEXITCODE` inmediatamente después de cada comando. Si no es 0, conservá diagnóstico sin datos sensibles y corregí antes de declarar el incremento verificado.

## Entorno y PostgreSQL local

`compose.yaml` configura únicamente `postgres:18.6-alpine`. DB/usuario/contraseña vienen del entorno y tienen fallbacks sintéticos de desarrollo, iguales a `.env.example`. No se usa autenticación `trust`. `.env` y variantes reales están ignorados; `.env.example` se puede versionar. No guardar claves/tokens ni adjuntar archivos sensibles a prompts o reportes.

El puerto está fijado en **`127.0.0.1:5432:5432`** y no se puede ampliar por variable a toda la LAN. Volumen nombrado `postgres_data`, cuyo nombre efectivo incluye el proyecto Compose `primer-parcial`; montaje `/var/lib/postgresql`, adecuado a PostgreSQL 18 y su `PGDATA` versionado. Healthcheck usa `pg_isready` con variables expandidas dentro del contenedor mediante `$$` en Compose.

Para revisar la configuración expandida **solo con entorno sintético**, `docker compose config` muestra la definición completa. Con valores reales, usar `--quiet`: el renderizado normal incluye variables sensibles. En CU-0.1 no se crea `.env`, no se descarga imagen ni se inicia contenedor/volumen.

Antes de CU-0.2 habrá que revalidar motor y puerto 5432: un diagnóstico previo encontró un servicio ocupándolo. No detenerlo ni cambiarlo sin identificarlo. La configuración loopback de Compose no modifica servicios ya instalados. Variables `POSTGRES_*` inicializan una base nueva; cambiarlas luego no equivale a migrar credenciales/datos de un volumen existente.

## Configuración de herramientas

| Archivo | Propósito |
|---|---|
| `package.json` | Raíz privada, engines Node/npm, gestor/version y workspaces objetivo; único script verifica CU-0.1 |
| `.npmrc` | `engine-strict` exige engines; `save-exact` fija futuras dependencias; no desactiva lockfile |
| `.node-version`, `.nvmrc` | Mismo Node inicial que el entorno verificado |
| `.editorconfig`, `.gitattributes` | UTF-8, LF, newline final y dos espacios; `.bat`/`.cmd` con CRLF |
| `.gitignore` | Dependencias, cachés, artefactos y material sensible; lockfile futuro se versionará |
| `tsconfig.base.json` | Opciones estrictas comunes; módulos, resolución, target, decoradores y emisión se definen por aplicación cuando exista |
| `opencode.json` | Cuatro fuentes activas y permisos con regla general antes de excepciones |

OpenCode permite lectura/edición interna y deniega `.env` reales, con excepción exacta para `.env.example`. `external_directory` deniega salir del proyecto. La búsqueda de contenido pide aprobación; no usarla para esquivar la prohibición de lectura sensible. Shell no clasificado pide aprobación; inspección Git/versiones está permitida. Git de escritura, reset/clean, creación GitHub, borrados y lectura shell de `.env` se deniegan explícitamente. Reglas de patrones no sustituyen revisión humana de comandos desconocidos ni constituyen un sandbox del sistema operativo.

**Cerrá y reiniciá OpenCode** para cargar `opencode.json`. No usar `--auto` ni activar auto-aprobación en la interfaz. La configuración se combina con la global y agentes; verificar comportamiento efectivo al reiniciar, sin ejecutar acciones destructivas para probarlo. El verificador local comprueba reglas declaradas/orden, no simula el runtime completo de OpenCode.

## Siguientes incrementos y evidencia pendiente

- CU-0.2: autorización específica, motor/puerto, inicialización Astro/NestJS, dependencias/lockfile, TypeORM/PostgreSQL, health/Swagger/CORS y comunicación real.
- CU-0.3: tests/lint/tipos/CI, manual navegador, reproducibilidad y build ejecutado por usuario/CI. No hay build verde en CU-0.1.
- GitHub futuro público `DarksouleaterXD/primer-parcial`: solo necesario al crear/publicar remoto; credenciales fuera del repo. Sin commit/push en esta entrega.

## Referencias consultadas para esta configuración

- [npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces), [package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json), [config](https://docs.npmjs.com/cli/v11/using-npm/config).
- [Docker Compose config](https://docs.docker.com/reference/cli/docker/compose/config/), [interpolación](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/), [imagen oficial PostgreSQL y cambio PGDATA 18](https://github.com/docker-library/docs/blob/master/postgres/README.md).
- [OpenCode permisos](https://opencode.ai/docs/permissions/) y [esquema de configuración](https://opencode.ai/config.json).

Las referencias respaldan sintaxis/decisiones, no sustituyen evidencia de ejecución del proyecto.
