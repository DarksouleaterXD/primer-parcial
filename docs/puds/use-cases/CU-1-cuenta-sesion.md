# CU-1 â€” Gestionar cuenta y sesiÃ³n

## Estado y trazabilidad

- **Estado del CU: Terminado y archivado el 2026-09-14.**
- Bloque 1 â€” Persistencia y API: terminado.
- Bloque 2 â€” Landing, sesiÃ³n y rutas privadas: terminado.
- Bloque 3.1 â€” E2E real: terminado y verificado el 2026-09-13.
- Bloque 3.2 â€” Evidencia y documentaciÃ³n: terminado; reproducciÃ³n limpia, build, revisiÃ³n manual y CI remoto con resultado correcto.
- Bloque 3.3 â€” RevisiÃ³n de alcance: terminado localmente.
- Cambio OpenSpec archivado: `openspec/changes/archive/2026-09-14-cu-1-gestionar-cuenta-sesion`; 9/9 tareas.

## Objetivo y alcance real

CU-1 permite registrar una cuenta con `firstName`, `lastName`, email y password; iniciar sesiÃ³n exclusivamente con `email + password`; confirmar una sesiÃ³n JWT en una vista privada mÃ­nima y cerrarla localmente. No incorpora proyectos, ownership, UML, roles, perfiles, recuperaciÃ³n de contraseÃ±a, OAuth, MFA, refresh tokens, revocaciÃ³n, colaboraciÃ³n, XMI, generaciÃ³n ni IA.

## Decisiones aplicadas

| Tema | ImplementaciÃ³n |
|---|---|
| Registro | `firstName` y `lastName` obligatorios despuÃ©s de `trim()`, email normalizado con `trim().toLowerCase()` y password de mÃ­nimo 8 caracteres/mÃ¡ximo 72 bytes UTF-8, sin composiciÃ³n adicional. |
| Login | Solo email y password; no solicita nombres ni apellidos. |
| Persistencia | Entidad `users` auditable, UUID generado por aplicaciÃ³n, migraciones TypeORM explÃ­citas y `synchronize: false`. `first_name` y `last_name` son nullable solo para preservar cuentas legacy. |
| Disponibilidad | DataSource de auth lazy; PostgreSQL caÃ­do no bloquea Nest ni cambia health. |
| SesiÃ³n | JWT Bearer de duraciÃ³n configurada; `/api/auth/session` devuelve solo `id`, `firstName`, `lastName` y email. |
| Cliente | JWT solo en `sessionStorage` bajo `primer-parcial.session-token`; nunca en `localStorage`. |
| Logout | El cliente elimina el token, limpia la vista y navega a `/`; no existe endpoint ni revocaciÃ³n server-side. |

## Flujos implementados

1. Registro vÃ¡lido crea una cuenta con nombres/apellidos recortados, email normalizado y no devuelve password ni hash.
2. Registro duplicado, nombres/apellidos vacÃ­os, email invÃ¡lido o password fuera de lÃ­mites devuelven errores pÃºblicos seguros.
3. Login vÃ¡lido emite JWT, lo guarda solo en `sessionStorage` y abre `/workspace`.
4. La vista privada consulta la sesiÃ³n con Bearer antes de mostrar contenido; muestra nombre/apellido o email si la cuenta legacy tiene nombres nulos. Token ausente, invÃ¡lido o vencido limpia estado y vuelve a `/login`.
5. Logout elimina el token local y vuelve a la landing sin una peticiÃ³n HTTP de logout.

## Contratos, datos y migraciones

`@primer-parcial/contracts` define esquemas Zod separados para registro, login y respuesta de cuenta. La API publica registro, login y sesiÃ³n actual con Swagger/OpenAPI; `/api/auth/logout` no existe. La migraciÃ³n `1736800000000-create-users.ts` crea `users` y su unicidad de email; `1736900000000-add-user-names.ts` agrega `first_name` y `last_name` nullable sin recrear la tabla ni borrar filas existentes. Ejecutar:

```powershell
npm run migration:run --workspace @primer-parcial/api
```

Las variables `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS` y `BCRYPT_COST` son obligatorias para API y migraciÃ³n. Los ejemplos son sintÃ©ticos.

## Pruebas ejecutadas

| ComprobaciÃ³n | Resultado real |
|---|---|
| Lint raÃ­z | `npm run lint` correcto en API, web y contracts. |
| Typecheck raÃ­z | `npm run typecheck` correcto; Astro informÃ³ 0 errores, 0 warnings y 0 hints. |
| Tests raÃ­z | `npm run test` correcto: API 18, web 19 correctos con 1 integraciÃ³n condicional omitida y contracts 4. Vitest mantiene la advertencia no bloqueante de `astro:dev-toolbar`. |
| E2E Chromium | `npm run test:e2e`: 5 escenarios correctos en 1.2 minutos contra Astro, NestJS y PostgreSQL reales. |
| E2E auth | MigraciÃ³n explÃ­cita, nombres/apellidos recortados, email normalizado, duplicado, nombres vacÃ­os, lÃ­mites de password, login de dos credenciales, Bearer, sesiÃ³n privada con nombre, `sessionStorage`, logout local, credenciales uniformes, token ausente/invÃ¡lido/vencido y Swagger sin logout. |
| E2E health | Disponible, no disponible y recuperaciÃ³n correctos; PostgreSQL terminÃ³ healthy. |
| Aislamiento E2E | Chromium usa API `127.0.0.1:3101` y web `localhost:4322`, sin reutilizar procesos externos para conservar el vencimiento JWT de prueba. |
| ReproducciÃ³n limpia | Correcta desde un snapshot Git versionado, en un temporal aislado sin `.env` reales ni archivos no versionados: `npm ci`, PostgreSQL, migraciones CU-1, lint, typecheck, tests, E2E Chromium, build, health y recuperaciÃ³n finalizaron correctamente. La limpieza/restauraciÃ³n final fue correcta. |
| Build | Correcto dentro de la reproducciÃ³n limpia. |
| CI remoto | GitHub Actions `Verify base executable`, ejecuciÃ³n `#6` (ID `34803009828`) por `push` en `feature/cu-0-inicializar-base`, commit `0cc67afe5cba99e93169f04a51915705dd4944b0`: `Success` en aproximadamente 2m 35s. La anotaciÃ³n de Actions sobre el runtime interno Node de `actions/checkout@v4` y `actions/setup-node@v4` fue no bloqueante y no afectÃ³ el workflow ni constituye un fallo de CU-1. |

Las cuentas E2E usan el prefijo `e2e-cu1-` y se limpian selectivamente. No se borran volÃºmenes ni datos generales.

## Pruebas manuales

Una persona confirmÃ³ el registro con nombres, apellidos, email y password; labels y mensajes visibles; navegaciÃ³n por teclado; login limitado a email/password; sesiÃ³n confirmada con nombre/apellido; logout local hacia el Ã¡rea pÃºblica; y diseÃ±o responsive en escritorio y viewport mÃ³vil sin overflow horizontal ni controles inaccesibles. La evidencia recibida no incluye fecha, URL ni navegador.

## Cierre operativo

No quedan bloqueos de evidencia para CU-1. Con las 9/9 tareas completas, la ejecuciÃ³n remota correcta, la sincronizaciÃ³n y el archivo OpenSpec realizados, CU-1 queda terminado. Los warnings no bloqueantes de verificaciÃ³n permanecen documentados como deuda separada y no se trasladan implÃ­citamente a CU-2.

## Archivos relevantes

- `apps/api/src/auth/**`, `apps/api/src/database/**`, `apps/api/src/migrations/**` â€” API y migraciÃ³n.
- `apps/web/src/auth/auth-client.ts` â€” cliente y ciclo de `sessionStorage`.
- `apps/web/src/components/AuthForm.tsx`, `PrivateArea.tsx` â€” formularios y guardia cliente.
- `e2e/account-session.spec.ts` â€” E2E real de cuenta/sesiÃ³n.
- `docs/security/account-session-threat-model.md` â€” amenazas y lÃ­mites de CU-1.

## CÃ³mo ejecutar

Seguir `docs/development/README.md`: iniciar Compose, exportar los orÃ­genes y variables JWT sintÃ©ticas, ejecutar migraciÃ³n y luego `npm run dev`. Para E2E: `npm run test:e2e`.