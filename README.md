# Primer Parcial

Herramienta CASE colaborativa y offline-first para modelar UML y generar aplicaciones. **Estado actual: CU-0.1, configuración y documentación inicial; código de aplicaciones no iniciado.**

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

## Comprobar esta entrega

Desde PowerShell abierto en la raíz del repositorio:

```powershell
git status --short --branch
git branch --show-current
node --version
npm --version
node docs/development/validate-cu-0.1.mjs
docker compose config --quiet
git diff --check
git diff
```

La validación estática usa únicamente Node y Git ya disponibles. Compose valida la definición sin motor ni contenedores. Con entorno real, usá `--quiet` para no mostrar valores sensibles; el ejemplo contiene solo datos sintéticos locales.

## Qué sigue

CU-0.2 inicializará Astro/Preact y NestJS, instalará dependencias/lockfile e integrará PostgreSQL/TypeORM, health, OpenAPI y comunicación web→API. CU-0.3 verificará calidad, CI, build y reproducibilidad para cerrar CU-0. Cada incremento necesita su instrucción aprobada.

La raíz npm es privada para evitar publicación de un paquete; el remoto futuro será público. GitHub no bloquea trabajo local. No existen aún `apps/`, `packages/`, aplicaciones ejecutables ni comandos de inicio. La configuración OpenCode requiere reiniciar la herramienta para aplicarse; mantené la auto-aprobación desactivada.
