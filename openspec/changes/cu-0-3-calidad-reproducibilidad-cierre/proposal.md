## Why

CU-0.2 dejó una base ejecutable validada localmente, pero CU-0 sigue abierto porque faltan evidencia repetible de CI, reproducción desde un entorno limpio y observación de navegador del flujo web → API → PostgreSQL. CU-0.3 cierra únicamente esas garantías de calidad para que la base existente pueda declararse terminada sin adelantar capacidades del producto.

## What Changes

### Alcance

- Definir CI mínimo para instalar con el único `package-lock.json`, iniciar solo PostgreSQL cuando las pruebas lo requieran y ejecutar lint, tipos, tests, E2E y build de la base actual. La evidencia real requiere un repositorio y runner autorizados; su ausencia bloquea el cierre sin crear remoto, hacer push ni publicar.
- Definir una receta y comprobación de reproducción limpia en un directorio temporal fuera del checkout, basada solo en un snapshot versionado y sin `node_modules`, `dist`, `.astro`, cobertura, outputs generados ni archivos `.env` reales.
- Añadir E2E de navegador Chromium para el flujo existente `ApiStatus` → `GET /api/health` → PostgreSQL, incluyendo estados disponible, no disponible y recuperación; Playwright se justifica solo por esa interacción de navegador observable. La evidencia E2E no sustituye la revisión manual acotada de navegador.
- Registrar evidencia real, revisión manual y deuda residual; cerrar CU-0 solo cuando todos los criterios se hayan satisfecho, sin iniciar CU-1.

### Fuera de alcance

- Cambiar el contrato health, CORS, Swagger/OpenAPI, `ApiStatus`, la arquitectura web/API o el sistema de build actual.
- Infraestructura de despliegue, publicación de paquetes, remoto GitHub, autenticación, UML, proyectos, colaboración, XMI, generación, IA, voz, imágenes u offline integral.
- Modificar el verificador histórico `docs/development/validate-cu-0.1.mjs`; CU-0.3 define comprobaciones independientes.

## Capabilities

### New Capabilities

- `base-executable-assurance`: Garantías observables de CI, reproducción limpia y E2E de navegador para la base ejecutable ya implementada en CU-0.2.

### Modified Capabilities

- Ninguna. `api-health`, `web-api-status` y `base-executable-workspaces` conservan su comportamiento; CU-0.3 los verifica sin cambiar sus requisitos.

## Impact

- Configuración de CI versionada, scripts o configuración de pruebas estrictamente necesarios, prueba E2E y documentación de desarrollo/CU-0/STATUS.
- Posible dependencia de desarrollo `@playwright/test` y navegador Chromium, justificados por el flujo E2E de navegador; no se añade otra infraestructura o servicio de aplicación.
- Reutilización de `compose.yaml`, `.env.example`, scripts raíz y las tres specs sincronizadas como fuentes de comportamiento existente.
