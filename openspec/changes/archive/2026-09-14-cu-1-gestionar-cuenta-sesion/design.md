## Context

La API actual es un módulo NestJS dinámico que recibe la configuración por entorno, publica health y OpenAPI, y usa un `DataSource` efímero solo para readiness. La web Astro estática solo contiene la isla `ApiStatus`. No existen entidades, migraciones, autenticación ni rutas privadas. Ver `proposal.md` y `specs/account-session/spec.md` para la motivación y el contrato observable.

CU-1 debe mantener `synchronize: false`, PostgreSQL en loopback, CORS con origen explícito y los contratos existentes de health. La documentación vigente exige Passport/JWT/bcrypt, Zod/`nestjs-zod`, TypeORM con auditoría y `@nestjs/swagger` para la API principal.

## Goals / Non-Goals

**Goals:**

- Incorporar una única capacidad de cuenta y sesión con registro de `firstName + lastName + email + password`, login de `email + password`, persistencia auditable, migración explícita y validación compartida entre API y web.
- Proteger la API mediante JWT Bearer con vencimiento y separar esa decisión autoritativa de la navegación protegida de la web estática.
- Mantener contraseñas, hashes, secretos y detalles de autenticación fuera de respuestas y logs públicos.
- Probar registro, login, autorización, expiración, logout y UI sobre PostgreSQL real y Chromium.

**Non-Goals:**

- No crear username, perfil, roles, entidades de proyectos, ownership de proyectos, membresías ni invitaciones.
- No incorporar refresh tokens, revocación persistida, recuperación de contraseña, verificación de identidad, OAuth, MFA ni administración de cuentas.
- No cambiar el contrato de health, el origen CORS permitido, el modelo UML ni agregar un router, estado global o paquetes para capacidades futuras.

## Decisions

### Un módulo de autenticación acotado se integra en la composición actual

`AppModule.register(configuration)` conservará su patrón de composición y añadirá un módulo de autenticación con controlador, servicio, estrategia JWT, guardia y proveedor de datos de usuario. El módulo recibe la misma configuración validada que usa la API, sin leer `process.env` directamente en controladores o servicios.

Antes de modificar dependencias se verificará la compatibilidad declarada con Node `24.11.1`, npm `11.6.2`, NestJS `11.1.6` y TypeORM `0.3.28`. Solo se fijarán versiones compatibles de `@nestjs/passport`, `@nestjs/jwt`, `nestjs-zod`, Passport, `passport-jwt`, bcrypt y Zod; no se usará `latest`, no se añadirá `@nestjs/typeorm` y se mantendrá el único lockfile raíz. `@primer-parcial/contracts` alojará esquemas/tipos diferenciados de registro (`firstName + lastName + email + password`), login (`email + password`) y sesión para que la web no invente cuerpos distintos a los de la API.

Se descarta una abstracción genérica de identidad, un paquete de autorización separado y roles porque CU-1 solo necesita una cuenta individual y una sesión.

### Usuario por email y DataSource lazy, sin sincronización automática

La aplicación tendrá una entidad `User` con UUID, `firstName`, `lastName`, `email` normalizado único, hash de contraseña y columnas de auditoría TypeORM. El contrato Zod de registro recorta nombres y apellidos, exige que no queden vacíos, normaliza el email y aplica una contraseña de mínimo 8 caracteres y máximo 72 bytes UTF-8 sin reglas de composición. El contrato de login conserva solamente email y password. La entidad nunca expone el hash ni acepta atributos de perfil. Una restricción única de PostgreSQL sobre el email normalizado resuelve también registros concurrentes; su conflicto se traduce a un error público genérico.

La tabla se crea y evoluciona mediante migraciones TypeORM versionadas y un `DataSource` de migraciones que deriva de la misma configuración PostgreSQL. La evolución agrega `first_name` y `last_name` nullable, sin recrear la tabla ni borrar cuentas existentes; el contrato de registro impide crear cuentas nuevas con valores nulos o vacíos. Para ejecución, un proveedor manual mantiene el `DataSource` de usuarios sin inicializar durante bootstrap y lo inicializa de forma lazy, con una única promesa compartida, cuando llega una operación de auth. Un fallo de inicialización se traduce en indisponibilidad pública segura y deja la API viva para reintentar operaciones posteriores. La API mantiene `synchronize: false`, no ejecuta migraciones durante bootstrap y no ejecuta cambios destructivos de esquema. Las guías incorporarán el comando de migración antes del arranque; las pruebas de integración ejecutarán la migración contra una base configurada exclusivamente para pruebas.

`HealthService` conserva su `DataSource` efímero e independiente para `SELECT 1`. Por eso, PostgreSQL caído no bloquea `createApiApplication`: NestJS sigue atendiendo y health conserva `503 {"status":"unavailable"}` aunque el proveedor de usuarios no pueda inicializarse.

Se descartan `synchronize: true`, la creación manual de tablas y `@nestjs/typeorm` con inicialización automática porque pueden romper la trazabilidad o bloquear el bootstrap ante PostgreSQL caído.

### Contraseñas y errores se tratan en el límite de autenticación

Los DTOs usan esquemas Zod y `nestjs-zod` para rechazar payloads malformados antes de consultar PostgreSQL. El registro exige nombres y apellidos no vacíos tras recortar; login no los recibe ni los consulta como credenciales. El servicio aplica bcrypt al registrar y compara bcrypt al iniciar sesión. La configuración exige por entorno el secreto JWT, su vencimiento y el costo bcrypt; los ejemplos contienen valores sintéticos y ningún fallback de secreto real.

Una capa única de mapeo transforma errores de validación, duplicado, credenciales inválidas, JWT inválido/vencido e indisponibilidad PostgreSQL en respuestas públicas sin hash, contraseña, secreto, detalle de PostgreSQL ni señal de login que enumere identidades. El registro duplicado devuelve un rechazo genérico, pero el diseño no afirma que oculte la existencia de la cuenta: el éxito frente al rechazo puede revelar esa diferencia. En login, email inexistente y contraseña incorrecta sí comparten la misma respuesta pública. Las respuestas internas tipadas permanecen dentro de la API para que tests y logs seguros puedan distinguir la causa operativa sin filtrarla al visitante.

Se descarta devolver conflictos de unicidad o mensajes distintos por campo, y se descarta confiar solo en validación de formulario, porque ambas alternativas permiten enumeración o desvíos entre clientes.

### JWT Bearer de duración configurada y logout local

Al iniciar sesión, la API firma un JWT de duración configurada que contiene solo el identificador interno mínimo de la cuenta. La estrategia Passport extrae el token Bearer, verifica firma y vencimiento, y la guardia protege una operación de sesión actual que devuelve solo `id`, `firstName`, `lastName` y `email`, para que la web confirme y muestre el nombre de la cuenta sin exponer hash o password. Swagger declara el esquema Bearer y solo las operaciones de registro, login y sesión actual, sin ejemplos sensibles.

La web guarda el token únicamente en `sessionStorage`, lo añade como `Authorization: Bearer` en la consulta de sesión y lo elimina al cerrar sesión antes de redirigir a una ruta pública. No existe llamada de logout a la API. Las páginas Astro de registro, login y área privada usan islas Preact pequeñas: la ruta privada no muestra contenido privado hasta que la API confirma la sesión. La API sigue siendo la autoridad: el guard cliente solo mejora navegación y no sustituye la guardia JWT.

Se descartan cookies HTTP-only porque exigirían ampliar CORS con credenciales, definir protección CSRF y cambiar el contrato de transporte sin que CU-1 lo requiera. También se descarta `localStorage`, que conservaría el token más allá de la sesión de navegador sin aportar un requisito de CU-1. No se introduce revocación en servidor: logout elimina la sesión de ese cliente, tal como define la spec.

### La interfaz se extiende mediante páginas e islas existentes

La landing sustituye la pantalla de base por una composición editorial CASE y conserva `ApiStatus` como señal de disponibilidad. Registro solicita nombres, apellidos, email y password; login conserva email y password. El área privada muestra solo el nombre confirmado de sesión y el cierre de sesión, no un listado simulado de proyectos. Formularios y mensajes usan etiquetas visibles, foco y estados de envío/error; el CSS se limita a la identidad visual aprobada y a diseños de escritorio, tablet y móvil.

Se descartan un dashboard genérico, datos mock de proyectos y un gestor de estado global porque corresponden a CU-3 o no son necesarios para los formularios y la sesión actuales.

### Verificación por capa sin falsear PostgreSQL ni navegador

Las pruebas unitarias cubren validación de nombres/apellidos, hash/comparación, emisión y validación de tokens, y mapeo de errores. Las pruebas Supertest validan migración evolutiva, persistencia/retorno seguro de nombres, registro, login de solo email/password, documentación OpenAPI y respuestas anónimas/expiradas contra PostgreSQL real configurado para pruebas. Las pruebas de componentes cubren los cuatro campos de registro, login de dos credenciales, almacenamiento de sesión, cabecera Bearer, logout y redirección. Playwright cubre el recorrido registro → login → área privada con nombre → logout, acceso anónimo y token vencido sin mocks de la API.

La revisión manual comprobará teclado, lector de pantalla cuando corresponda, escritorio/tablet/móvil y que ningún mensaje ni Swagger muestra secretos. Los checks raíz existentes, reproducción limpia y CI se actualizarán solo cuando las nuevas migraciones y pruebas formen parte del flujo real.

## Risks / Trade-offs

- [Token en `sessionStorage` puede ser leído por una XSS] → No se persiste fuera de la sesión, no se renderiza contenido no confiable en CU-1 y el modelo de amenazas documenta la limitación; una estrategia de cookies requiere un CU aprobado.
- [Logout local no invalida una copia robada del JWT antes de vencer] → Se usa vencimiento configurado y se documenta explícitamente que no hay revocación en servidor en este CU.
- [La migración puede fallar por una base desactualizada] → La migración agrega columnas nullable para preservar cuentas existentes; el arranque y las guías exigen ejecutarla explícitamente, sin habilitar `synchronize` como atajo.
- [PostgreSQL puede no estar disponible al arrancar] → El DataSource de usuarios se inicializa solo al atender auth; health conserva su conexión efímera y la regresión comprueba API viva con `503`.
- [Las pruebas podrían alterar datos de desarrollo] → La configuración de tests selecciona una base de pruebas y la suite no puede apuntar a los valores de desarrollo.
- [El error de restricción única puede variar por PostgreSQL] → El adaptador reconoce el conflicto de unicidad y lo convierte al mismo error público cubierto por integración.

## Migration Plan

1. Actualizar contratos diferenciados de registro/login, entidad y una migración aditiva de nombres y apellidos nullable, sin ejecutar cambios automáticos de esquema.
2. Ejecutar la migración en PostgreSQL local y verificar que conserva filas existentes, agrega ambas columnas y mantiene la restricción de email; si falla, detener la API y corregir o revertir mediante una migración nueva, nunca mediante sincronización destructiva.
3. Incorporar API, Swagger, pantallas e islas y ejecutar las pruebas unitarias, integración, componentes y E2E de nombres/apellidos, registro, login y sesión.
4. Actualizar la guía de variables, modelo de amenazas, documento CU-1 y `STATUS` con resultados reales; reproducción limpia y CI solo se ajustan después de comprobarlos.

El rollback funcional elimina las rutas y UI de CU-1 en un cambio posterior; el rollback de datos se hace con una migración inversa revisada antes de aplicarla. No se borran cuentas ni volúmenes como mecanismo de recuperación rutinario.
