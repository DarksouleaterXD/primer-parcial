# Modelo de amenazas mínimo — CU-1 cuenta y sesión

## Alcance

CU-1 cubre registro con nombres/apellidos/email/password, login, JWT Bearer, consulta de sesión y logout local. No cubre proyectos, roles, OAuth, MFA, recuperación de contraseña, refresh tokens ni revocación persistida.

## Activos y límites

| Activo | Límite de protección |
|---|---|
| Password | Solo llega por HTTPS en un despliegue real, se hashea con bcrypt antes de persistir y nunca se devuelve. |
| JWT | Solo vive en `sessionStorage`; el cliente lo envía mediante `Authorization: Bearer`. |
| Secreto JWT y costo bcrypt | Requeridos por entorno; los ejemplos contienen valores sintéticos. |
| Cuenta y sesión | La API NestJS es la autoridad; devuelve solo id, nombres, apellidos y email. La guardia de navegador no otorga permisos. |

## Riesgos y controles

| Riesgo | Control actual | Límite explícito |
|---|---|---|
| Enumeración en login | Email inexistente y password incorrecta devuelven la misma respuesta pública. | Registro exitoso frente a duplicado puede revelar existencia; no se afirma lo contrario. |
| Fuga de hashes, secretos o PostgreSQL | DTOs cerrados, respuestas públicas tipadas y tests de errores seguros. | Logs y despliegue deben revisarse antes de producción. |
| Token robado mediante XSS | Token no persiste más allá de la sesión de navegador y CU-1 no renderiza contenido no confiable. | `sessionStorage` no elimina el riesgo XSS; cookies HTTP-only exigirían otro diseño aprobado. |
| Token vencido o inválido | Passport rechaza el Bearer; el cliente elimina el token y vuelve a login. | No hay refresh token. |
| Logout de una copia robada | Logout borra solo el token de este navegador. | No existe revocación, blacklist ni invalidación server-side antes del vencimiento. |
| PostgreSQL ausente | DataSource lazy; health conserva `503` y auth devuelve indisponibilidad pública. | La cuenta no opera hasta restaurar la dependencia. |
| Migración destructiva | Migraciones TypeORM explícitas y `synchronize: false`; `first_name`/`last_name` nullable preservan cuentas legacy sin backfill inventado. | Ejecutar solo el comando documentado; no borrar volúmenes como recuperación rutinaria. |

## Datos de prueba

Las pruebas E2E usan cuentas `e2e-cu1-*@example.test` y eliminan exclusivamente esas filas. No se incluyen datos personales, passwords reales ni secretos de despliegue.
