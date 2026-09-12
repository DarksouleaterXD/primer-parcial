# base-executable-workspaces Specification

## Purpose

Establece la estructura mínima y verificable del monorepositorio para ejecutar los dos servicios de CU-0.2 y su contrato compartido, sin crear paquetes ni herramientas de capacidades futuras.

## Requirements

### Requirement: Los workspaces contienen solo los componentes de CU-0.2

El monorepositorio SHALL contener `apps/web`, `apps/api` y `packages/contracts`, y el paquete compartido SHALL contener únicamente el contrato de health requerido por este cambio.

#### Scenario: Estructura de workspaces creada

- **GIVEN** el repositorio se prepara para CU-0.2
- **WHEN** se inspeccionan sus workspaces
- **THEN** existen la web, la API y el paquete de contrato de health, sin paquetes vacíos ni componentes de funcionalidades fuera de alcance

### Requirement: La raíz ofrece comandos verificables de CU-0.2

La raíz SHALL ofrecer comandos reales para desarrollo, pruebas, lint, comprobación de tipos y build de los workspaces de CU-0.2.

#### Scenario: Ejecución de comandos raíz

- **GIVEN** las dependencias del monorepositorio están instaladas
- **WHEN** se ejecuta cada comando raíz de desarrollo, pruebas, lint, tipos o build de CU-0.2
- **THEN** el comando invoca trabajo real de los workspaces correspondientes y finaliza con éxito o informa el fallo de ese trabajo

### Requirement: La instalación usa un único lockfile raíz

La instalación de CU-0.2 SHALL producir un único `package-lock.json` en la raíz del monorepositorio y SHALL NOT producir lockfiles dentro de los workspaces.

#### Scenario: Instalación de dependencias

- **GIVEN** se instalan las dependencias de CU-0.2 desde la raíz
- **WHEN** finaliza la instalación
- **THEN** existe un único `package-lock.json` en la raíz y no existen lockfiles de npm en `apps/web`, `apps/api` ni `packages/contracts`
