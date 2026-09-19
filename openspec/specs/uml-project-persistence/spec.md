# uml-project-persistence Specification

## Purpose

Permite conservar proyectos UML privados como documentos canonicos y reabrirlos con control de concurrencia, sin ampliar el alcance hacia colaboracion o generacion.

## Requirements

### Requirement: Los proyectos UML durables son privados y se resuelven desde la sesion autenticada
El sistema SHALL crear, listar, obtener, reabrir, renombrar, guardar y eliminar proyectos UML solamente para una identidad obtenida de una sesion autenticada vigente. La identidad del propietario SHALL ser determinada por el backend; ningun `ownerId` proporcionado por el cliente SHALL decidir ownership. La lista SHALL contener exclusivamente proyectos de esa identidad. Para obtener, reabrir, renombrar, guardar o eliminar, un identificador inexistente o perteneciente a otra identidad SHALL responder de forma indistinguible como recurso no encontrado (`404`) y SHALL NOT revelar contenido, propietario, revision ni estado del proyecto.

#### Scenario: Solicitud sin sesion
- **GIVEN** una solicitud sin una sesion autenticada vigente
- **WHEN** intenta crear, listar, obtener, reabrir, renombrar, guardar o eliminar un proyecto UML
- **THEN** el sistema la rechaza como no autenticada sin exponer datos de proyectos

#### Scenario: Lista privada
- **GIVEN** una persona autenticada posee proyectos y existen proyectos de otra persona
- **WHEN** solicita la lista de proyectos
- **THEN** recibe solamente los proyectos propios y cada elemento incluye la revision vigente necesaria para una mutacion posterior

#### Scenario: Identificador ajeno o inexistente no visible
- **GIVEN** una persona autenticada usa para una operacion sobre un proyecto un identificador ajeno o inexistente
- **WHEN** solicita obtener, reabrir, renombrar, guardar o eliminar ese proyecto
- **THEN** el sistema responde `404` de forma indistinguible y no modifica ningun proyecto

### Requirement: Una persona autenticada puede crear un proyecto privado valido
El sistema SHALL permitir crear un proyecto privado a partir de un nombre valido y no vacio tras la validacion backend. La creacion SHALL asignar el propietario desde la sesion, crear un `ProjectDocument` canonico inicial y devolver el proyecto creado con su identidad de documento, timestamps y revision inicial `0`. La solicitud de creacion SHALL NOT aceptar un propietario controlado por el cliente.

#### Scenario: Creacion correcta
- **GIVEN** una persona autenticada envia un nombre de proyecto valido y no vacio
- **WHEN** crea un proyecto UML
- **THEN** el sistema crea un proyecto privado con un `ProjectDocument` canonico inicial, propietario derivado de la sesion, revision `0` y timestamps, y devuelve ese estado creado

#### Scenario: Creacion invalida
- **GIVEN** una persona autenticada envia un nombre vacio tras la validacion backend o un payload de creacion invalido
- **WHEN** intenta crear un proyecto UML
- **THEN** el sistema rechaza la solicitud sin crear ningun proyecto

### Requirement: Una persona autenticada puede obtener y reabrir su documento canonico completo
El sistema SHALL permitir obtener y reabrir un proyecto propio devolviendo su `ProjectDocument` completo y la revision vigente. El documento devuelto SHALL conservar `CanonicalUmlModel`, `DiagramLayout`, perfil de generacion, metadatos, identidad de documento, revision y timestamps compatibles con el contrato de CU-2. El backend SHALL conservar el documento mediante una representacion de almacenamiento que no constituye un segundo modelo UML ni una fuente de verdad semantica divergente.

#### Scenario: Reapertura correcta
- **GIVEN** una persona autenticada posee un proyecto previamente creado o guardado
- **WHEN** obtiene o reabre ese proyecto
- **THEN** recibe el `ProjectDocument` completo compatible con CU-2 y su revision vigente, preservando modelo UML, layout, perfil, identidad y metadatos

### Requirement: El renombre de un proyecto propio usa revision optimista
El sistema SHALL requerir `expectedRevision` para renombrar un proyecto propio. Si la revision esperada coincide con la vigente y el nuevo nombre es valido y no vacio tras la validacion backend, el sistema SHALL renombrar atomica y exclusivamente ese proyecto, actualizar sus timestamps de auditoria y devolver su nueva revision. Si la revision no coincide, SHALL responder un conflicto explicito sin aplicar cambios; el sistema SHALL NOT usar last-write-wins.

#### Scenario: Renombre correcto
- **GIVEN** una persona autenticada posee un proyecto con revision vigente y envia un nombre valido junto con el mismo `expectedRevision`
- **WHEN** solicita renombrarlo
- **THEN** el sistema reemplaza el nombre de forma atomica, actualiza el timestamp de auditoria y devuelve una revision nueva

#### Scenario: Renombre invalido
- **GIVEN** una persona autenticada envia un nombre vacio tras la validacion backend o un payload de renombre invalido
- **WHEN** intenta renombrar un proyecto propio
- **THEN** el sistema rechaza la solicitud sin modificar nombre, revision ni timestamps

#### Scenario: Renombre con revision obsoleta
- **GIVEN** una persona autenticada posee un proyecto pero envia un `expectedRevision` distinto de la revision vigente
- **WHEN** solicita renombrarlo
- **THEN** el sistema responde un conflicto explicito y no modifica nombre, documento, revision ni timestamps

### Requirement: El guardado reemplaza atomica y validamente el ProjectDocument propio
El sistema SHALL requerir `expectedRevision` para guardar o reemplazar el `ProjectDocument` de un proyecto propio. Antes de persistir, SHALL aplicar el parser y el validador canonicos de CU-2 con la politica de guardado pertinente; SHALL rechazar versiones, estructuras o diagnosticos bloqueantes sin aceptar parcialmente el documento. Si la revision esperada coincide y el documento es valido, el reemplazo de documento, revision y timestamps de auditoria SHALL ocurrir como una unica operacion logica y la respuesta SHALL devolver el documento persistido y su nueva revision. Si la revision no coincide, SHALL responder un conflicto explicito sin aplicar cambios y SHALL NOT usar last-write-wins.

#### Scenario: Guardado correcto
- **GIVEN** una persona autenticada posee un proyecto y envia un `ProjectDocument` compatible y valido junto con el `expectedRevision` vigente
- **WHEN** solicita guardar o reemplazar el documento
- **THEN** el sistema persiste atomica y completamente el documento canonico, actualiza timestamps, devuelve el documento persistido y una revision nueva

#### Scenario: Documento invalido no se persiste
- **GIVEN** una persona autenticada envia un documento con version no soportada, estructura invalida o diagnosticos bloqueantes bajo la politica de guardado
- **WHEN** solicita guardar o reemplazar el documento
- **THEN** el sistema rechaza la solicitud y no modifica documento, revision ni timestamps

#### Scenario: Guardado con revision obsoleta
- **GIVEN** una persona autenticada posee un proyecto pero envia un `expectedRevision` distinto de la revision vigente
- **WHEN** solicita guardar o reemplazar el documento
- **THEN** el sistema responde un conflicto explicito y no modifica documento, revision ni timestamps

### Requirement: La eliminacion de un proyecto propio usa revision optimista
El sistema SHALL requerir `expectedRevision` para eliminar un proyecto propio. Si la revision esperada coincide con la vigente, la eliminacion SHALL ser atomica y el proyecto SHALL dejar de estar disponible para su propietario. Si la revision no coincide, SHALL responder un conflicto explicito sin eliminar ni modificar el proyecto; el sistema SHALL NOT usar last-write-wins.

#### Scenario: Eliminacion correcta
- **GIVEN** una persona autenticada posee un proyecto y envia el `expectedRevision` vigente
- **WHEN** solicita eliminarlo
- **THEN** el sistema elimina atomica y completamente el proyecto y posteriores consultas propias reciben recurso no encontrado

#### Scenario: Eliminacion con revision obsoleta
- **GIVEN** una persona autenticada posee un proyecto pero envia un `expectedRevision` distinto de la revision vigente
- **WHEN** solicita eliminarlo
- **THEN** el sistema responde un conflicto explicito y el proyecto, su documento, revision y timestamps permanecen sin cambios

### Requirement: La persistencia no amplía los limites de CU-2 ni introduce canales alternativos
El sistema SHALL mantener los comandos y el historial locales de CU-2 ajenos a PostgreSQL, ownership y control de concurrencia. El backend SHALL ser responsable del almacenamiento durable, ownership y revision optimista; el frontend SHALL acceder a la persistencia solo mediante la API. Esta capability SHALL NOT introducir autosave, WebSocket, realtime, colaboracion, presencia, compartir proyectos, roles, merge de conflictos, historial persistido de Undo/Redo, historial completo de revisiones, XMI, generacion de codigo, IA ni cambios de semantica de modelado de CU-2.

#### Scenario: Alcance limitado de la persistencia
- **GIVEN** una persona usa el ciclo durable de un proyecto UML
- **WHEN** crea, reabre, renombra, guarda o elimina el proyecto mediante la API
- **THEN** el sistema no activa sincronizacion automatica, colaboracion, historial persistido, merge, XMI, generacion, IA ni nuevas reglas semanticas UML
