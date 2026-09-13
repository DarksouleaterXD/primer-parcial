## Purpose

Permite que visitantes creen y usen una cuenta privada de forma segura antes de que CU-3 incorpore recursos y proyectos propios.

## ADDED Requirements

### Requirement: Un visitante puede registrar una cuenta con email y password válidos
El sistema SHALL aceptar para registro únicamente `email` y `password`. SHALL normalizar el email mediante recorte de espacios y conversión consistente a minúsculas antes de persistirlo, SHALL validarlo como email, y SHALL exigir una contraseña de al menos 8 caracteres y como máximo 72 bytes UTF-8 sin reglas adicionales de composición. PostgreSQL SHALL imponer unicidad sobre el email normalizado. La contraseña nunca SHALL persistirse, devolverse ni registrarse en texto plano.

#### Scenario: Registro correcto
- **GIVEN** un visitante sin sesión envía `email + password` válidos cuyo email normalizado no pertenece a una cuenta existente
- **WHEN** solicita el registro
- **THEN** el sistema crea la cuenta con el email normalizado, responde sin la contraseña y permite continuar al inicio de sesión

#### Scenario: Registro no aceptado
- **GIVEN** un visitante sin sesión envía un email inválido, una contraseña fuera de los límites declarados o un email normalizado ya registrado
- **WHEN** solicita el registro
- **THEN** el sistema rechaza la solicitud con un error público genérico que no expone contraseñas, hashes, detalles PostgreSQL ni información interna

### Requirement: Un visitante puede iniciar sesión mediante email y password válidos
El sistema SHALL autenticar `email + password` válidos tras aplicar al email la misma normalización del registro, y SHALL emitir una sesión JWT con vencimiento para acceder a recursos protegidos. Un email inexistente y una contraseña incorrecta SHALL producir la misma respuesta pública de autenticación fallida.

#### Scenario: Inicio de sesión correcto
- **GIVEN** una cuenta registrada y sin sesión activa en el cliente
- **WHEN** el visitante envía su email y password válidos para iniciar sesión
- **THEN** el sistema entrega una sesión JWT vigente y la interfaz permite entrar al área privada

#### Scenario: Credenciales incorrectas
- **GIVEN** un visitante sin sesión envía un email inexistente o una contraseña incorrecta
- **WHEN** solicita el inicio de sesión
- **THEN** el sistema responde con la misma respuesta pública de autenticación fallida sin indicar cuál de los dos datos fue incorrecto

### Requirement: Las rutas privadas requieren una sesión JWT vigente
El sistema SHALL permitir el acceso a rutas privadas y a la consulta de sesión actual solo cuando la solicitud presenta una sesión JWT válida y vigente. Una solicitud anónima, con token inválido o vencido SHALL recibir el mismo resultado de no autenticación sin información sensible.

#### Scenario: Acceso privado autorizado
- **GIVEN** una persona tiene una sesión JWT vigente
- **WHEN** accede a una ruta privada
- **THEN** el sistema permite el acceso a esa ruta

#### Scenario: Acceso privado no autenticado
- **GIVEN** una persona no tiene sesión, presenta un token inválido o presenta un token vencido
- **WHEN** intenta acceder a una ruta privada
- **THEN** el sistema rechaza el acceso como no autenticado sin revelar detalles internos ni la causa específica del rechazo

### Requirement: Una persona puede cerrar la sesión local actual
El sistema SHALL ofrecer una acción de cierre de sesión exclusivamente en el cliente, que elimine el JWT vigente de `sessionStorage`, deje de mostrar el área privada y redirija a una ruta pública. CU-1 SHALL NOT exponer un endpoint de logout ni revocación server-side.

#### Scenario: Cierre de sesión correcto
- **GIVEN** una persona se encuentra en el área privada con una sesión vigente
- **WHEN** selecciona cerrar sesión
- **THEN** la sesión deja de estar disponible en el cliente y la persona vuelve a una ruta pública

### Requirement: La experiencia pública y de autenticación es accesible y responsive
El sistema SHALL ofrecer una landing pública y pantallas de registro e inicio de sesión con la identidad visual CASE aprobada, controles con etiquetas comprensibles y uso operativo en escritorio, tablet y móvil.

#### Scenario: Navegación pública hacia autenticación
- **GIVEN** un visitante abre la landing sin sesión
- **WHEN** elige registrarse o iniciar sesión
- **THEN** accede a la pantalla correspondiente sin necesitar acceso al área privada

#### Scenario: Revisión de accesibilidad y adaptación
- **GIVEN** la landing o una pantalla de autenticación se visualiza en escritorio, tablet o móvil
- **WHEN** una persona navega sus controles con teclado y lector de pantalla cuando corresponda
- **THEN** los campos y acciones tienen etiquetas comprensibles, foco utilizable y una disposición que conserva la interacción

### Requirement: Las operaciones de cuenta y sesión se documentan como parte de la API principal
El sistema SHALL publicar en la documentación OpenAPI de la API principal las operaciones de registro, inicio de sesión y consulta protegida de sesión actual, sus entradas válidas y sus respuestas de éxito y no autenticación, sin incluir secretos ni ejemplos de contraseñas reales. La documentación SHALL NOT declarar un endpoint de logout inexistente.

#### Scenario: Consulta de la documentación de autenticación
- **GIVEN** la API principal está iniciada
- **WHEN** una persona consulta su documento OpenAPI
- **THEN** encuentra las operaciones de registro, inicio de sesión y sesión actual, sus respuestas documentadas sin datos sensibles y ningún endpoint de logout

### Requirement: La API conserva health cuando PostgreSQL no está disponible
El sistema SHALL iniciar NestJS aunque PostgreSQL no esté disponible. `GET /api/health` SHALL conservar el contrato `503 {"status":"unavailable"}` en ese estado. Las operaciones de cuenta y sesión que requieran PostgreSQL SHALL fallar de forma pública y segura sin detener el proceso de API.

#### Scenario: API iniciada sin PostgreSQL
- **GIVEN** PostgreSQL no está disponible al iniciar la API
- **WHEN** NestJS termina su bootstrap y se solicita `GET /api/health`
- **THEN** la API permanece atendiendo y responde `503 {"status":"unavailable"}` sin detalles de conexión

#### Scenario: Operación de cuenta sin PostgreSQL
- **GIVEN** la API está iniciada y PostgreSQL no está disponible
- **WHEN** una persona solicita registro, login o sesión actual
- **THEN** la API responde un error público seguro de dependencia no disponible y permanece atendiendo health
