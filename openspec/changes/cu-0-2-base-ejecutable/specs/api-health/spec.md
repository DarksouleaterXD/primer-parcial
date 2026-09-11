## Purpose

Define un punto de salud observable para la API principal que refleje la disponibilidad real de PostgreSQL y que pueda ser consumido de forma coherente por clientes locales.

## ADDED Requirements

### Requirement: La API expone su salud con dependencia verificada
La API SHALL atender `GET /api/health` y evaluar la disponibilidad de PostgreSQL antes de declarar el servicio disponible. La respuesta SHALL ser el contrato compartido `{ "status": "available" | "unavailable" }`.

#### Scenario: PostgreSQL disponible
- **GIVEN** la API está iniciada y puede conectarse a PostgreSQL
- **WHEN** un cliente solicita `GET /api/health`
- **THEN** la API responde `200` con `{ "status": "available" }`

#### Scenario: PostgreSQL no disponible
- **GIVEN** la API está iniciada y no puede conectarse a PostgreSQL
- **WHEN** un cliente solicita `GET /api/health`
- **THEN** la API responde `503` con `{ "status": "unavailable" }`, sin exponer credenciales ni detalles sensibles de conexión

### Requirement: La salud se documenta como parte de la API principal
La API SHALL publicar documentación interactiva en `/api/docs` y la descripción OpenAPI en `/api/docs-json`, incluyendo la operación `GET /api/health` y sus respuestas `200` y `503`.

#### Scenario: Consulta de documentación interactiva
- **GIVEN** la API está iniciada
- **WHEN** un cliente solicita `/api/docs`
- **THEN** recibe la documentación interactiva de la API principal que incluye la operación de health

#### Scenario: Consulta del documento OpenAPI
- **GIVEN** la API está iniciada
- **WHEN** un cliente solicita `/api/docs-json`
- **THEN** recibe un documento OpenAPI que describe `GET /api/health` y sus respuestas de disponibilidad

### Requirement: El acceso cruzado usa un origen configurado
La API SHALL habilitar CORS únicamente para el origen configurado mediante entorno y SHALL NOT habilitar el origen comodín `*`.

#### Scenario: Origen configurado
- **GIVEN** la API tiene configurado un origen web permitido
- **WHEN** el navegador realiza una solicitud desde ese origen
- **THEN** la respuesta CORS autoriza ese origen configurado

#### Scenario: Origen no permitido
- **GIVEN** la API tiene configurado un origen web permitido
- **WHEN** el navegador realiza una solicitud desde un origen distinto
- **THEN** la respuesta no autoriza ese origen mediante un comodín ni mediante el origen configurado
