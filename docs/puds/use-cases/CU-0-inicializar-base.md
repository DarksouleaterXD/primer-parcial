# CU-0 — Inicializar la base ejecutable del proyecto

## Estado y trazabilidad

- **Estado del CU: En implementación.**
- Incremento activo de esta entrega: **CU-0.1 — Repositorio, configuración y documentación inicial**, **Terminado: verificado documental/configuración** el 2026-09-10. CU-0.2 no iniciado.
- Rama obligatoria: `feature/cu-0-inicializar-base`, comprobada al inicio con árbol limpio.
- Aprobación: instrucción explícita del usuario de implementar solo CU-0.1 y sus decisiones definitivas, 2026-09-10.
- Actor: equipo de desarrollo; agente ejecuta configuración/documentación, usuario revisa y realiza manuales de aplicaciones cuando existan.
- Trazabilidad: CU anterior 0 → CU nuevo 0, ciclo 1. [Plan maestro](README.md), [STATUS](../../STATUS.md) y [ADR-0001](../../decisions/ADR-0001-initial-technical-boundaries.md).
- Código de aplicaciones: no iniciado. No existe evidencia de build ni de servicios funcionales.

## Objetivo y resultado usable

Al cerrar CU-0, una persona puede obtener/configurar el monorepositorio, iniciar PostgreSQL, API NestJS y web Astro/Preact, y observar comunicación real con health comprobado siguiendo una guía reproducible. CU-0.1 entrega únicamente la base documental/configuración verificable para empezar esa implementación.

## Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Identidad | Primer Parcial; slug `primer-parcial`; ruta `D:\project-planning` |
| GitHub futuro | `DarksouleaterXD/primer-parcial`, público; no bloquea desarrollo local |
| Repositorio/gestor | Monorepositorio npm workspaces `apps/*` y `packages/*`; raíz npm privada, sin Nx/Turborepo |
| Runtime/entorno | Windows/PowerShell 7+, Node 24; versión inicial local fijada `24.11.1`, npm `11.6.2` |
| Aplicación principal | Astro/Preact y NestJS 11/Express, TypeORM/PostgreSQL, Swagger Nest; implementación desde CU-0.2 |
| Aplicación generada | Java/Spring/JPA/springdoc y Astro/Preact; frontera documentada, implementación en CU-6/7 |
| PostgreSQL local | `postgres:18.6-alpine`, puerto `127.0.0.1:5432:5432`, volumen nombrado en `/var/lib/postgresql`, healthcheck |
| Entorno sensible | Ejemplo sintético versionable; entorno real ignorado; no credenciales reales en repositorio/prompts/logs |
| Flujo/arquitectura | 12 CUs/3 ciclos, máximo tres incrementos; diez decisiones de ADR-0001 |
| Autonomía del agente | Inspección/edición local permitidas, shell no clasificado pide aprobación; Git de escritura/GitHub creación/destructivos/externos denegados |

## Precondiciones

- Leer completos AGENTS, contexto, STATUS, producto, plan y benchmarks antes de modificar archivos: realizado.
- Rama exacta y estado Git revisados: realizados; detenerse ante rama distinta o contradicción no resuelta.
- Nombre, mapa histórico, topología y fronteras aprobados: constan en prompt/ADR.
- Git, Node y npm disponibles. Compose CLI basta en CU-0.1; motor operativo se requiere desde CU-0.2.
- No se requieren credenciales ni creación del remoto para esta entrega.

## Tres incrementos

| Incremento | Alcance integrado | Estado |
|---|---|---|
| CU-0.1 — Repositorio, configuración y documentación inicial | Plan 12/3, trazabilidad, ADR, contexto/estado/guías, configuración raíz y validaciones sin instalar ni iniciar servicios | Terminado: verificado, evidencia debajo |
| CU-0.2 — Aplicaciones y servicios conectados | Astro/Preact, NestJS, instalación y lockfile, PostgreSQL/TypeORM, health/OpenAPI, entorno URL/CORS y comunicación real web→API | Pendiente; detenerse antes de este incremento |
| CU-0.3 — Calidad, reproducibilidad y cierre | Checks automáticos, smoke, CI, manuales, build por usuario/CI, guía de arranque, evidencia y cierre | Pendiente |

## Alcance real y fuera de alcance

CU-0.1 crea configuración y documentación, sin código de aplicaciones. El plan nuevo incorpora todas las capacidades/criterios técnicos históricos y conserva el cuerpo anterior en `history/initial-30-use-cases.md`. Benchmarks cambian solo cinco referencias de CU.

Fuera de CU-0.1: inicializar Astro/NestJS, instalar dependencias, lockfile, scripts para apps inexistentes, crear paquetes vacíos, health de aplicación, TypeORM, OpenAPI, comunicación frontend-backend, contenedores en ejecución y CI ejecutada. Fuera de todo CU-0: auth, UML, persistencia de proyectos, realtime, generación e IA. Producto intacto. Prohibidos git add/commit/push, creación GitHub y builds por el agente.

## Flujo principal, alternativas y errores

1. Verificar rama/estado y fuentes; resolver precisiones mediante ADR aprobado.
2. Reorganizar plan y remapear puertas, registrar estado fiel y continuidad.
3. Crear configuración raíz/Compose y guías, sin aplicaciones o instalaciones.
4. Validar JSON, estructura/enlaces Markdown, mapa, Compose, diff y secretos.
5. Corregir fallos y registrar resultado real por iteración.
6. Entregar reporte y detenerse antes de CU-0.2.

Rama equivocada/contradicción material: detenerse y reportar. JSON/Compose inválido: corregir configuración y repetir su check. Herramienta ausente: declarar bloqueo, no instalar automáticamente. Hallazgo sensible: no copiar su contenido ni versionarlo. Un Compose válido solo prueba configuración, no imagen descargada, PostgreSQL saludable ni persistencia.

Desde CU-0.2: caída de PostgreSQL se informa sin secretos; health distingue vida/dependencias cuando se implemente readiness; error URL/CORS es visible/recuperable en web, sin valor saludable hardcodeado.

## Contratos, datos y migraciones

No hay contratos HTTP, entidades ni migraciones implementadas. `compose.yaml` describe solo PostgreSQL local; `.env.example` ofrece valores sintéticos. Workspaces son patrones objetivo y `tsconfig.base.json` contiene opciones neutrales/estrictas, sin resolver todavía módulos ni decoradores de frameworks. Cada aplicación definirá su configuración específica en CU-0.2.

## Riesgos del entorno, desviaciones y recuperación

- **Motor Docker no operativo:** estado informado y diagnosticado previamente; impide comprobar servicios en CU-0.2, no `docker compose config`. No se inició ni reparó motor aquí.
- **5432 posiblemente ocupado:** inspección previa detectó un servicio en ese puerto. No se revalidó ahora; identificarlo antes de CU-0.2 sin detener ni reconfigurar servicios ajenos. Compose permanece limitado a loopback; no modifica listeners preexistentes.
- **Imagen/volumen:** PostgreSQL 18 usa `/var/lib/postgresql` como montaje, con datos en subdirectorio por versión. Config validada no prueba pull, arranque, persistencia ni migración entre versiones.
- **Valores locales:** ejemplo sintético compartido para desarrollo loopback; no es secreto real ni configuración de despliegue. Credenciales reales se introducen fuera del repo y no se imprimen en evidencia.
- **Herramientas:** Node 24.11.1/npm 11.6.2 son versiones locales iniciales, no compatibilidad Astro/Nest probada. CU-0.2 debe verificarla al seleccionar dependencias.
- **Permisos OpenCode:** reglas por patrones y última coincidencia; shell desconocido requiere revisión humana. Configuración/skills/agentes globales pueden combinarse; reiniciar y revisar permisos efectivos antes de la próxima sesión. No habilitar auto-aprobación.
- **Recuperación documental:** revisar diff por archivo y corregir con parches; no usar reset/clean/borrado recursivo ni reescribir historia.

## Criterios de aceptación de CU-0.1

- [x] Raíz privada `primer-parcial`, Node 24, npm workspaces, versiones coherentes y archivos requeridos válidos.
- [x] Exactamente 12 encabezados activos de CU y 3 ciclos en plan maestro; máximo tres incrementos por CU.
- [x] Matriz completa de 30 IDs, capacidades/pruebas/documentación reorganizadas y cuerpo histórico preservado.
- [x] Benchmarks modificados solo en referencias: texto CU-8, STT CU-9, visión CU-10, offline CU-11; métricas/datasets/estado intactos.
- [x] ADR con diez decisiones, contexto, consecuencias y alternativas; contexto/estado/arquitectura/desarrollo fieles.
- [x] JSON parseable, Markdown coherente, enlaces locales válidos y ausencia de espacios conflictivos en diff.
- [x] Compose validado sin motor: imagen aprobada, entorno local sintético, healthcheck, volumen nombrado y loopback fijo.
- [x] OpenCode declara cuatro fuentes activas y reglas ordenadas de lectura/edición/shell, secretos/externos/destructivos/Git, comprobadas estáticamente; aplicación efectiva requiere reinicio.
- [x] Búsqueda de posibles secretos revisada; `.env` sensible ignorado y `.env.example` versionable.
- [x] Sin lockfile, dependencias instaladas, aplicaciones ni paquetes prematuros; producto intacto, sin staging/commit/push/GitHub.
- [x] Evidencia real registrada; CU-0 sigue En implementación y build pendiente para CU-0.3; no se avanzó CU-0.2.

## Criterios de aceptación del CU completo (pendientes)

- Web/API/PostgreSQL reales y reproducibles desde entorno limpio, configuración documentada y health estable.
- Web consume API, muestra fallo real/recuperación; URL/CORS por entorno y contrato `@nestjs/swagger` verificable.
- Pruebas unitarias/smoke, lint, tipos, CI y build verdes; manual en navegador con URL/resultado y arranque limpio.
- Documento fiel, deuda/bloqueos resueltos o explicitados y comandos finales concretos revisados. No cerrar por mocks o pruebas omitidas.

## Pruebas automáticas y manuales previstas

| Incremento | Automáticas / comprobaciones | Manuales / evidencia requerida |
|---|---|---|
| CU-0.1 | Parsear todos los JSON; contar CUs/ciclos/incrementos/matriz; comprobar Markdown/enlaces; diff de benchmark; Compose config; permisos por patrones; git diff --check; búsqueda de secretos; ausencia lockfile/apps/paquetes | Revisar diff completo, diez decisiones y cobertura histórica; revisar guía PowerShell/estado/ejemplos y confirmar alcance detenido |
| CU-0.2 | Unitarias/smoke health, integración TypeORM/PostgreSQL, contrato OpenAPI, web→API y fallos de entorno | Arranque real, health, navegador y errores de DB/URL/CORS; URL y resultado real, evidencia sin secretos |
| CU-0.3 | Lint/tipos/tests/E2E/CI y build por usuario/CI; ejecución limpia con lockfile | Reproducir guía desde entorno limpio, registrar evidencia y revisar cierre |

Stack de pruebas previsto: Jest/`@nestjs/testing`/Supertest en backend, Vitest/Testing Library Preact en frontend, Playwright E2E. No están instalados ni ejecutados en CU-0.1. Benchmarks: no ejecutados; no corresponden al cierre de este incremento.

## Evidencia de verificaciones

### CU-0.1 — Ejecutado el 2026-09-10

| Comando / comprobación ejecutada | Resultado real |
|---|---|
| `git status --short --branch`, `git branch --show-current` | Código 0; rama `feature/cu-0-inicializar-base`, árbol limpio al comienzo |
| `git --version`, `node --version`, `npm --version`, `docker --version`, `docker compose version` | Código 0; versiones de la preinspección registradas debajo |
| `git log --oneline -10`, `git rev-parse HEAD` | Código 0; único commit inicial `eff9bdc240ccae6a75a96ad1e6ae957e07df5b1f`, `docs: add initial product specification and planning` |
| `node docs/development/validate-cu-0.1.mjs` | Código 0; **12 grupos de comprobaciones estáticas correctos**, sin instalar, escribir archivos ni usar red/motor |
| `docker compose config` | Código 0; definición expandida con entorno sintético, imagen `postgres:18.6-alpine`, `host_ip: 127.0.0.1`, puerto publicado `5432`, volumen `primer-parcial_postgres_data` en `/var/lib/postgresql`, healthcheck con variables del contenedor |
| `git diff --check` | Código 0; sin errores de whitespace rastreado. Verificador revisó además texto de archivos nuevos |
| `git diff`, `git diff --stat`, `git diff --numstat` | Código 0; diff rastreado revisado. Benchmarks: únicamente cinco líneas reemplazadas. Reorganización del maestro complementada por archivo histórico nuevo íntegro |
| `git diff --cached --quiet` | Código 0; índice sin cambios |
| `git ls-files --others --exclude-standard` | Código 0; 18 archivos nuevos, incluidos histórico y verificador documental; sin lockfile ni aplicaciones |

Los 12 grupos del verificador comprueban: rama; archivos/ausencias; los **3 JSON** y configuración npm/versiones; Markdown (cercas, enlaces y whitespace); **12 CUs/3 ciclos/máximo 3 incrementos**; **30 filas** y cuerpo histórico idéntico al original; benchmarks equivalentes salvo mapa de CU; producto/AGENTS intactos y diez decisiones ADR; permisos declarados con casos allow/ask/deny; Compose estático; ignore de entorno/ejemplo/lockfile futuro; búsqueda heurística de posibles secretos. Internamente usa `git show <commit-base>:<archivo>` y `git check-ignore --no-index -- <rutas-de-prueba>` solo de lectura.

La búsqueda de tokens conocidos, claves privadas, JWT y asignaciones sospechosas no encontró coincidencias. Revisión de configuración: los valores PostgreSQL son sintéticos (`.env.example` y fallbacks), no credenciales reales. Esta comprobación no afirma detección universal de secretos.

### Revisión documental del agente

- Contrastados todos los bloques funcionales/técnicos del plan inicial con incrementos, aceptación, pruebas y matriz nuevos; cuerpo histórico preservado y verificado por igualdad contra commit base.
- Revisados diff y contenido de archivos nuevos, identidad/slug, diez decisiones, guía PowerShell, estados pendientes, loopback/volumen y reglas OpenCode. No se realizaron pruebas humanas de navegador ni se atribuye al usuario una aprobación posterior ficticia.
- Reinicio de OpenCode y revisión de permisos efectivos: pendientes para la próxima sesión. El check local comprueba la declaración, no ejecuta comandos prohibidos ni certifica la configuración global fusionada.

Preinspección real: rama correcta/árbol limpio, Git `2.39.2.windows.1`, Node `v24.11.1`, npm `11.6.2`, Docker CLI `28.5.1` y Compose `v2.40.2-desktop.1`. Se leyeron completas las seis fuentes obligatorias. No se probó el motor.

Evidencia pendiente de CU-0.2/CU-0.3: servicios en ejecución, capturas de navegador, contratos, datos/migraciones, pruebas de aplicación, CI, build y arranque limpio. No hay resultados ficticios ni “build verde”.

## Documentación y archivos afectados

- Raíz: `README.md`, `package.json`, `.node-version`, `.nvmrc`, `.npmrc`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, `compose.yaml`, `tsconfig.base.json`, `opencode.json`.
- Actualizados: `docs/PROJECT_CONTEXT.md`, `docs/STATUS.md`, `docs/puds/use-cases/README.md`, `docs/benchmarks/external-services.md`.
- Creados: este CU, `docs/decisions/ADR-0001-initial-technical-boundaries.md`, `docs/architecture/README.md`, `docs/development/README.md`, verificador sin dependencias `docs/development/validate-cu-0.1.mjs` y registro íntegro `docs/puds/use-cases/history/initial-30-use-cases.md`.
- Producto y AGENTS preservados. No hay aplicaciones/paquetes/lockfile.

## Cómo verificar

Usar PowerShell en `D:\project-planning`; [guía inicial](../../development/README.md). Comandos de esta fase no instalan ni arrancan aplicaciones: versiones, inspección Git, validación JSON/Markdown y `docker compose config`. Resultados concretos se registran en evidencia; no ejecutar comandos de etapas futuras por anticipado.

## Historial de iteraciones

| Fecha | Iteración | Cambio y verificación |
|---|---|---|
| 2026-09-10 | 1 — CU-0.1 | Inspección inicial, reorganización 12/3 con histórico íntegro, ADR y configuración/documentación. Verificador: 12 grupos correctos; Compose config y diff --check código 0. Evidencia registrada, CU-0.1 verificado y CU-0 permanece En implementación. |

## Comandos finales de commit y push

**Pendiente para el cierre de CU-0 tras CU-0.3.** Se completará esta última sección con archivos reales revisados, mensaje convencional y rama/remoto verificados. No se ejecutaron `git add`, `git commit`, `git push` ni acciones GitHub en CU-0.1. No usar marcadores como comandos copiables de publicación.
