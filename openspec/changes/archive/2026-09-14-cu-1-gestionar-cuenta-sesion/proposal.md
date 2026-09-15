## Why

La base ejecutable ya está cerrada, pero una persona visitante todavía no puede crear una cuenta ni entrar a un espacio privado. CU-1 incorpora la identidad mínima necesaria para que los CUs posteriores puedan asociar recursos a una sesión autenticada sin adelantar proyectos ni el dominio UML.

## What Changes

- Incorporar la persistencia versionada de usuarios con `firstName`, `lastName`, `email` único normalizado, auditoría TypeORM y manejo seguro de password mediante bcrypt. El registro usa nombres, apellidos, email y password; el login conserva exclusivamente email y password.
- Exponer registro, login y consulta protegida de sesión actual con validación Zod, Passport/JWT, respuestas de error uniformes y documentación OpenAPI de la API principal.
- Aplicar autenticación JWT a las rutas privadas y tratar tokens vencidos o inválidos sin revelar información sensible.
- Implementar logout exclusivamente como acción cliente: eliminar el JWT de `sessionStorage` y volver a una ruta pública, sin endpoint ni revocación server-side.
- Crear landing y pantallas de registro e inicio de sesión con la identidad CASE aprobada, manejo de sesión, navegación protegida y comportamiento responsive y accesible.
- Preservar el arranque de NestJS y el contrato de health cuando PostgreSQL no está disponible; las operaciones de cuenta fallan de forma pública y segura sin detener la API.
- Documentar las variables de entorno de autenticación, el modelo de amenazas mínimo y el estado real de CU-1.
- Mantener fuera de alcance la gestión de proyectos, ownership de proyectos, UML, colaboración, XMI, generación, asistentes y capacidades offline posteriores.

## Capabilities

### New Capabilities
- `account-session`: Permite a visitantes registrarse con nombres, apellidos, email y password; iniciar sesión exclusivamente con email y password; consultar una sesión JWT protegida y cerrarla localmente en el cliente.

### Modified Capabilities

- Ninguna. Los contratos de health, CORS y estado web existentes permanecen sin cambios de comportamiento.

## Impact

- API NestJS: entidad y migración de usuario, inicialización TypeORM lazy, servicios y controladores de autenticación, guardias Passport/JWT, validación y documentación Swagger/OpenAPI.
- PostgreSQL/TypeORM: tabla de usuarios con `firstName` y `lastName` nullable para preservar cuentas previas, `email` normalizado único y auditoría. La migración evoluciona la tabla sin recrearla ni borrar cuentas.
- Web Astro/Preact: landing, registro con nombres/apellidos/email/password, login de email/password y navegación/rutas protegidas; la isla `ApiStatus` conserva su responsabilidad actual.
- Contratos, pruebas Jest/Supertest, Vitest y Playwright, junto con el documento de CU-1, guía de variables y modelo de amenazas mínimo.
