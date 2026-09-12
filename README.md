# Primer Parcial

Herramienta CASE colaborativa y offline-first para modelar UML y generar aplicaciones. **Estado actual: CU-0.2 terminado; web, API y PostgreSQL locales están validados.**

| Identidad | Valor |
|---|---|
| Slug | `primer-parcial` |
| Repositorio futuro | `DarksouleaterXD/primer-parcial` (público) |
| Directorio local | `D:\project-planning` |
| Rama de CU-0 | `feature/cu-0-inicializar-base` |
| Topología | Monorepositorio npm workspaces: `apps/*`, `packages/*` |
| Entorno | Windows/PowerShell, Node.js 24 y npm 11 |

## Empezar por la documentación

1. [Estado real](docs/STATUS.md) y [CU-0 activo](docs/puds/use-cases/CU-0-inicializar-base.md).
2. [Guía Windows/PowerShell](docs/development/README.md) para comprobar el entorno sin instalar ni arrancar aplicaciones.
3. [Plan maestro: 12 CUs / 3 ciclos](docs/puds/use-cases/README.md), [arquitectura objetivo](docs/architecture/README.md) y [ADR-0001](docs/decisions/ADR-0001-initial-technical-boundaries.md).
4. [Producto aprobado](docs/product/product-05-astro-nestjs.md), [reglas](AGENTS.md), [continuidad](docs/PROJECT_CONTEXT.md) y [benchmarks no ejecutados](docs/benchmarks/external-services.md).

## Ejecutar CU-0.2

Desde PowerShell abierto en la raíz del repositorio:

```powershell
git status --short --branch
git branch --show-current
node --version
npm --version
docker compose up -d --wait
$env:WEB_ORIGIN = "http://localhost:4321"
$env:PUBLIC_API_ORIGIN = "http://localhost:3000"
npm run dev
```

La API lee `WEB_ORIGIN=http://localhost:4321` del entorno del proceso y la web recibe `PUBLIC_API_ORIGIN=http://localhost:3000`, como muestran sus respectivos `.env.example`. La API publica `GET /api/health`, Swagger en `/api/docs` y OpenAPI en `/api/docs-json`.

## Verificar

```powershell
npm run lint
npm run typecheck
npm run test
docker compose exec -T postgres pg_isready -U primer_parcial_local -d primer_parcial
```

`GET /api/health` responde `200` con `{ "status": "available" }` cuando PostgreSQL está disponible y `503` con `{ "status": "unavailable" }` cuando no lo está. La isla `ApiStatus` muestra el estado de una única consulta configurada, sin polling ni reintentos.

## Qué sigue

CU-0.2 está terminado con evidencia manual de build. CU-0.3 conserva el cierre de calidad, CI y reproducibilidad; no está implementado.

La raíz npm es privada para evitar publicación de un paquete; el remoto futuro será público. GitHub no bloquea trabajo local. La configuración OpenCode requiere reiniciar la herramienta para aplicarse; mantené la auto-aprobación desactivada.
