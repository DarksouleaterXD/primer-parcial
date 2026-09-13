## Purpose

Define garantías repetibles de calidad, reproducción y navegador para cerrar la base ejecutable de CU-0 sin extender sus capacidades funcionales.

## ADDED Requirements

### Requirement: La integración continua verifica la base ejecutable

La base ejecutable SHALL disponer de una ejecución de integración continua que parta de las dependencias versionadas, prepare únicamente los servicios requeridos por sus pruebas y ejecute las comprobaciones raíz de calidad, E2E y build. Un fallo de cualquiera de esas comprobaciones SHALL hacer fallar la ejecución de CI sin publicar secretos. La evidencia real SHALL provenir de un repositorio y runner autorizados; la ausencia de ambos SHALL bloquear el cierre de CU-0 sin crear remoto, hacer push ni publicar.

#### Scenario: Ejecución correcta de CI

- **GIVEN** un checkout con el lockfile y los ejemplos de entorno versionados
- **WHEN** se ejecuta la integración continua
- **THEN** instala las dependencias reproduciblemente, verifica PostgreSQL cuando corresponde y completa las comprobaciones raíz, E2E y build

#### Scenario: Fallo de una comprobación

- **GIVEN** una comprobación de calidad, E2E o build falla durante CI
- **WHEN** finaliza la ejecución de CI
- **THEN** el resultado informa el fallo y no declara la base ejecutable validada

#### Scenario: Runner CI no autorizado

- **GIVEN** el workflow versionado existe pero no hay repositorio o runner autorizado para ejecutarlo
- **WHEN** se intenta cerrar CU-0
- **THEN** se registra el bloqueo y CU-0 no se marca terminado ni se fabrica evidencia de CI

### Requirement: La base se puede reproducir desde archivos versionados

La base ejecutable SHALL poder prepararse en un directorio temporal fuera del checkout desde un snapshot versionado, sin depender de `node_modules`, `dist`, `.astro`, cobertura, salidas de build ni configuración sensible previa. La receta SHALL usar el único lockfile raíz, los ejemplos de entorno sintéticos y PostgreSQL local para llegar a un health verificable; solo podrá eliminar el directorio temporal que ella misma creó.

#### Scenario: Preparación limpia correcta

- **GIVEN** una copia limpia sin dependencias instaladas ni artefactos de build
- **WHEN** se sigue la receta de reproducción
- **THEN** se instalan las dependencias desde el lockfile raíz, PostgreSQL queda saludable y el health de la API puede verificarse

#### Scenario: Configuración sensible ausente

- **GIVEN** una copia limpia sin archivos `.env` reales
- **WHEN** se prepara la base ejecutable
- **THEN** usa solamente los valores sintéticos documentados y no requiere versionar ni mostrar secretos

#### Scenario: Snapshot no versionado

- **GIVEN** los cambios que se quieren comprobar no forman parte del snapshot versionado elegido
- **WHEN** se intenta registrar una reproducción limpia
- **THEN** no se declara evidencia de reproducción limpia hasta disponer de un snapshot que los contenga

### Requirement: El flujo web se comprueba en un navegador real

La verificación de la base SHALL observar en un navegador real el flujo existente desde la web a `ApiStatus`, la API y PostgreSQL. SHALL incluir una prueba E2E automatizada en Chromium y una revisión manual acotada. La suite SHALL comprobar los estados disponible y no disponible sin introducir polling, reintentos ni actualización automática.

#### Scenario: Estado disponible en navegador

- **GIVEN** web, API y PostgreSQL están disponibles con los orígenes configurados
- **WHEN** la prueba E2E automatizada abre la web en Chromium
- **THEN** `ApiStatus` muestra `API disponible` tras consultar el health real

#### Scenario: Estado no disponible en navegador

- **GIVEN** web y API están iniciadas y PostgreSQL deja de estar disponible
- **WHEN** la prueba E2E automatizada abre o recarga la web en Chromium
- **THEN** `ApiStatus` muestra `API no disponible` tras la respuesta de health no disponible y la prueba restaura PostgreSQL para comprobar la recuperación cuando estaba iniciado inicialmente

#### Scenario: Revisión manual de navegador

- **GIVEN** el flujo web, API y PostgreSQL está preparado para revisión manual
- **WHEN** una persona realiza las comprobaciones disponible, no disponible y recuperación en navegador
- **THEN** registra URL, fecha, ambos estados, recuperación y resultado real sin sustituir la evidencia E2E automatizada

### Requirement: La verificación preserva el estado local de PostgreSQL

Las pruebas locales SHALL actuar únicamente sobre el servicio `postgres` definido por el `compose.yaml` del proyecto. Antes de modificarlo SHALL registrar su estado inicial y, incluso ante fallo, SHALL restaurarlo a ese estado sin borrar contenedores, volúmenes ni datos y sin afectar instancias externas. En CI, el ciclo de vida del servicio iniciado expresamente pertenece al job.

#### Scenario: PostgreSQL iniciado antes de E2E

- **GIVEN** el servicio `postgres` del Compose del proyecto está iniciado y saludable antes de la prueba
- **WHEN** la E2E provoca el estado no disponible
- **THEN** al finalizar, incluso ante fallo, el mismo servicio queda iniciado y saludable sin eliminar datos

#### Scenario: PostgreSQL detenido antes de E2E

- **GIVEN** el servicio `postgres` del Compose del proyecto está detenido antes de la prueba
- **WHEN** la E2E completa o falla
- **THEN** el servicio no queda iniciado permanentemente y ninguna instancia PostgreSQL externa resulta afectada
