# CU-1 — Gestionar cuenta y sesión

## Estado y trazabilidad

- **Estado del CU: En validación.**
- Bloque 1 — Persistencia y API: terminado.
- Bloque 2 — Landing, sesión y rutas privadas: terminado.
- Bloque 3.1 — E2E real: terminado y verificado el 2026-09-13.
- Bloque 3.2 — Evidencia y documentación: terminado localmente; reproducción limpia, build y revisión manual con resultado correcto. CI remoto pendiente.
- Bloque 3.3 — Revisión de alcance: terminado localmente.
- Cambio OpenSpec: `cu-1-gestionar-cuenta-sesion`; progreso actual 9/9 tareas.

## Objetivo y alcance real

CU-1 permite registrar una cuenta con `firstName`, `lastName`, email y password; iniciar sesión exclusivamente con `email + password`; confirmar una sesión JWT en una vista privada mínima y cerrarla localmente. No incorpora proyectos, ownership, UML, roles, perfiles, recuperación de contraseña, OAuth, MFA, refresh tokens, revocación, colaboración, XMI, generación ni IA.

## Decisiones aplicadas

| Tema | Implementación |
|---|---|
| Registro | `firstName` y `lastName` obligatorios después de `trim()`, email normalizado con `trim().toLowerCase()` y password de mínimo 8 caracteres/máximo 72 bytes UTF-8, sin composición adicional. |
| Login | Solo email y password; no solicita nombres ni apellidos. |
| Persistencia | Entidad `users` auditable, UUID generado por aplicación, migraciones TypeORM explícitas y `synchronize: false`. `first_name` y `last_name` son nullable solo para preservar cuentas legacy. |
| Disponibilidad | DataSource de auth lazy; PostgreSQL caído no bloquea Nest ni cambia health. |
| Sesión | JWT Bearer de duración configurada; `/api/auth/session` devuelve solo `id`, `firstName`, `lastName` y email. |
| Cliente | JWT solo en `sessionStorage` bajo `primer-parcial.session-token`; nunca en `localStorage`. |
| Logout | El cliente elimina el token, limpia la vista y navega a `/`; no existe endpoint ni revocación server-side. |

## Flujos implementados

1. Registro válido crea una cuenta con nombres/apellidos recortados, email normalizado y no devuelve password ni hash.
2. Registro duplicado, nombres/apellidos vacíos, email inválido o password fuera de límites devuelven errores públicos seguros.
3. Login válido emite JWT, lo guarda solo en `sessionStorage` y abre `/workspace`.
4. La vista privada consulta la sesión con Bearer antes de mostrar contenido; muestra nombre/apellido o email si la cuenta legacy tiene nombres nulos. Token ausente, inválido o vencido limpia estado y vuelve a `/login`.
5. Logout elimina el token local y vuelve a la landing sin una petición HTTP de logout.

## Contratos, datos y migraciones

`@primer-parcial/contracts` define esquemas Zod separados para registro, login y respuesta de cuenta. La API publica registro, login y sesión actual con Swagger/OpenAPI; `/api/auth/logout` no existe. La migración `1736800000000-create-users.ts` crea `users` y su unicidad de email; `1736900000000-add-user-names.ts` agrega `first_name` y `last_name` nullable sin recrear la tabla ni borrar filas existentes. Ejecutar:

```powershell
npm run migration:run --workspace @primer-parcial/api
```

Las variables `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS` y `BCRYPT_COST` son obligatorias para API y migración. Los ejemplos son sintéticos.

## Pruebas ejecutadas

| Comprobación | Resultado real |
|---|---|
| Lint raíz | `npm run lint` correcto en API, web y contracts. |
| Typecheck raíz | `npm run typecheck` correcto; Astro informó 0 errores, 0 warnings y 0 hints. |
| Tests raíz | `npm run test` correcto: API 18, web 19 correctos con 1 integración condicional omitida y contracts 4. Vitest mantiene la advertencia no bloqueante de `astro:dev-toolbar`. |
| E2E Chromium | `npm run test:e2e`: 5 escenarios correctos en 1.2 minutos contra Astro, NestJS y PostgreSQL reales. |
| E2E auth | Migración explícita, nombres/apellidos recortados, email normalizado, duplicado, nombres vacíos, límites de password, login de dos credenciales, Bearer, sesión privada con nombre, `sessionStorage`, logout local, credenciales uniformes, token ausente/inválido/vencido y Swagger sin logout. |
| E2E health | Disponible, no disponible y recuperación correctos; PostgreSQL terminó healthy. |
| Aislamiento E2E | Chromium usa API `127.0.0.1:3101` y web `localhost:4322`, sin reutilizar procesos externos para conservar el vencimiento JWT de prueba. |
| Reproducción limpia | Correcta desde un snapshot Git versionado, en un temporal aislado sin `.env` reales ni archivos no versionados: `npm ci`, PostgreSQL, migraciones CU-1, lint, typecheck, tests, E2E Chromium, build, health y recuperación finalizaron correctamente. La limpieza/restauración final fue correcta. |
| Build | Correcto dentro de la reproducción limpia. |

Las cuentas E2E usan el prefijo `e2e-cu1-` y se limpian selectivamente. No se borran volúmenes ni datos generales.

## Pruebas manuales

Una persona confirmó el registro con nombres, apellidos, email y password; labels y mensajes visibles; navegación por teclado; login limitado a email/password; sesión confirmada con nombre/apellido; logout local hacia el área pública; y diseño responsive en escritorio y viewport móvil sin overflow horizontal ni controles inaccesibles. La evidencia recibida no incluye fecha, URL ni navegador.

## Riesgos y pendientes

- Falta una ejecución real del workflow CI después de sus cambios; no se declara CI correcta sin ella.
- CU-1 no se cierra hasta registrar ese resultado remoto, aunque las tareas locales estén completas.

## Archivos relevantes

- `apps/api/src/auth/**`, `apps/api/src/database/**`, `apps/api/src/migrations/**` — API y migración.
- `apps/web/src/auth/auth-client.ts` — cliente y ciclo de `sessionStorage`.
- `apps/web/src/components/AuthForm.tsx`, `PrivateArea.tsx` — formularios y guardia cliente.
- `e2e/account-session.spec.ts` — E2E real de cuenta/sesión.
- `docs/security/account-session-threat-model.md` — amenazas y límites de CU-1.

## Cómo ejecutar

Seguir `docs/development/README.md`: iniciar Compose, exportar los orígenes y variables JWT sintéticas, ejecutar migración y luego `npm run dev`. Para E2E: `npm run test:e2e`.
