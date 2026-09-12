# web-api-status Specification

## Purpose

Comunica en la web la disponibilidad real de la API principal para que una persona vea la comprobación, el éxito y los fallos recuperables sin recibir un estado saludable falso.

## Requirements

### Requirement: La web consulta el health configurado

La web SHALL consultar `GET /api/health` en el origen de API configurado por entorno y SHALL usar la respuesta de health para determinar el estado mostrado.

#### Scenario: Consulta correcta al origen configurado

- **GIVEN** la web tiene configurado el origen de una API disponible
- **WHEN** se carga la isla de estado de API
- **THEN** la isla consulta `GET /api/health` en ese origen y no usa un valor saludable predefinido

### Requirement: La web comunica el ciclo de disponibilidad

La web SHALL mostrar "comprobando" mientras la consulta de health está pendiente, "API disponible" tras una respuesta `200` válida y "API no disponible" tras una respuesta no disponible o inválida.

#### Scenario: Consulta pendiente

- **GIVEN** la isla de estado de API inició una consulta de health que aún no finalizó
- **WHEN** la persona observa la isla
- **THEN** la isla muestra el estado comprobando

#### Scenario: API disponible

- **GIVEN** la isla está consultando el health de la API
- **WHEN** recibe una respuesta `200` válida
- **THEN** la isla muestra API disponible

#### Scenario: API no disponible

- **GIVEN** la isla está consultando el health de la API
- **WHEN** recibe una respuesta `503` o una respuesta que no cumple el contrato de health
- **THEN** la isla muestra API no disponible

### Requirement: La web trata timeout y fallos de red como no disponibles

La web SHALL finalizar la comprobación como "API no disponible" cuando la solicitud exceda el timeout aplicado por la web o falle por red, sin mantener un estado disponible previo ni informar salud falsa.

#### Scenario: Timeout de la consulta

- **GIVEN** la isla inició una consulta de health que no finaliza antes del timeout configurado
- **WHEN** vence el timeout
- **THEN** la isla muestra API no disponible

#### Scenario: Error de red

- **GIVEN** la isla inició una consulta de health
- **WHEN** la solicitud falla por un error de red
- **THEN** la isla muestra API no disponible
