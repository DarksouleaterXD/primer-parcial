# CU-1 — Gestionar cuenta y sesión

## Estado y trazabilidad

- **Estado del CU: En validación.**
- Bloque 1 — Persistencia y API: terminado.
- Bloque 2 — Landing, sesión y rutas privadas: terminado.
- Bloque 3.1 — E2E real: terminado el 2026-09-13.
- Bloques 3.2 y 3.3: pendientes de reproducción limpia, build, CI real, revisión manual y cierre final.
- Cambio OpenSpec: `cu-1-gestionar-cuenta-sesion`; progreso actual 7/9 tareas.

## Objetivo y alcance real

CU-1 permite registrar e iniciar sesión con `email + password`, confirmar una sesión JWT en una vista privada mínima y cerrarla localmente. No incorpora proyectos, ownership, UML, roles, perfiles, recuperación de contraseña, OAuth, MFA, refresh tokens, revocación, colaboración, XMI, generación ni IA.

## Decisiones aplicadas

| Tema | Implementación |
|---|---|
| Credenciales | Email normalizado con `trim().toLowerCase()` y password de mínimo 8 caracteres/máximo 72 bytes UTF-8, sin composición adicional. |
| Persistencia | Entidad `users` auditable, UUID generado por aplicación, migración TypeORM explícita y `synchronize: false`. |
| Disponibilidad | DataSource de auth lazy; PostgreSQL caído no bloquea Nest ni cambia health. |
| Sesión | JWT Bearer de duración configurada; `/api/auth/session` confirma la sesión. |
| Cliente | JWT solo en `sessionStorage` bajo `primer-parcial.session-token`; nunca en `localStorage`. |
| Logout | El cliente elimina el token, limpia la vista y navega a `/`; no existe endpoint ni revocación server-side. |

## Flujos implementados

1. Registro válido crea una cuenta con email normalizado y no devuelve password ni hash.
2. Registro duplicado, email inválido o password fuera de límites devuelven errores públicos seguros.
3. Login válido emite JWT, lo guarda solo en `sessionStorage` y abre `/workspace`.
4. La vista privada consulta la sesión con Bearer antes de mostrar contenido; token ausente, inválido o vencido limpia estado y vuelve a `/login`.
5. Logout elimina el token local y vuelve a la landing sin una petición HTTP de logout.

## Contratos, datos y migraciones

`@primer-parcial/contracts` define los esquemas Zod compartidos. La API publica registro, login y sesión actual con Swagger/OpenAPI; `/api/auth/logout` no existe. La migración `1736800000000-create-users.ts` crea la tabla `users` y su unicidad de email. Ejecutar:

```powershell
npm run migration:run --workspace @primer-parcial/api
```

Las variables `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS` y `BCRYPT_COST` son obligatorias para API y migración. Los ejemplos son sintéticos.

## Pruebas ejecutadas

| Comprobación | Resultado real |
|---|---|
| API lint y typecheck | Correctos durante Bloque 1 y tras corregir el comando de migración. |
| API tests | 16 tests correctos durante Bloque 1. |
| Contracts lint, typecheck y tests | Correctos; 3 tests. |
| Web lint y typecheck | Correctos; Astro sin errores, warnings ni hints. |
| Web tests | 19 correctos y 1 integración condicional omitida; advertencia Vite existente por `astro:dev-toolbar`. |
| E2E Chromium | `npm run test:e2e`: 5 escenarios correctos en 1.0 minuto contra Astro, NestJS y PostgreSQL reales. |
| E2E auth | Migración explícita, registro normalizado, duplicado, límites de password, login, Bearer, sesión privada, logout local, credenciales uniformes, token ausente/inválido/vencido y Swagger sin logout. |
| E2E health | Disponible, no disponible y recuperación correctos; PostgreSQL terminó healthy. |

Las cuentas E2E usan el prefijo `e2e-cu1-` y se limpian selectivamente. No se borran volúmenes ni datos generales.

## Pruebas manuales pendientes

La revisión humana de teclado, labels, mensajes, registro, login, área privada, logout y responsive escritorio/tablet/móvil sigue pendiente. Seguir la lista de `docs/development/README.md` y registrar fecha, URL, navegador, observaciones y resultado antes de cerrar este CU.

## Riesgos y pendientes

- Falta ejecutar la reproducción limpia actualizada, que ahora debe incluir migración y E2E.
- Falta ejecutar build por política de sesión y registrar su resultado real.
- Falta una ejecución real del workflow CI después de sus cambios; no se declara CI correcta sin ella.
- Falta la revisión final de alcance y validación OpenSpec de la tarea 3.3.

## Archivos relevantes

- `apps/api/src/auth/**`, `apps/api/src/database/**`, `apps/api/src/migrations/**` — API y migración.
- `apps/web/src/auth/auth-client.ts` — cliente y ciclo de `sessionStorage`.
- `apps/web/src/components/AuthForm.tsx`, `PrivateArea.tsx` — formularios y guardia cliente.
- `e2e/account-session.spec.ts` — E2E real de cuenta/sesión.
- `docs/security/account-session-threat-model.md` — amenazas y límites de CU-1.

## Cómo ejecutar

Seguir `docs/development/README.md`: iniciar Compose, exportar los orígenes y variables JWT sintéticas, ejecutar migración y luego `npm run dev`. Para E2E: `npm run test:e2e`.
