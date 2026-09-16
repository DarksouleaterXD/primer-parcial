## ADDED Requirements

### Requirement: El proyecto UML usa un documento canÃ³nico versionado y serializable
El sistema SHALL representar el trabajo UML en memoria mediante un `ProjectDocument` con `schemaVersion`, UUID de documento, nombre, propietario autenticado, revisiÃ³n local no negativa, timestamps ISO-8601, `CanonicalUmlModel`, `DiagramLayout` y perfil de generaciÃ³n separado. La serializaciÃ³n SHALL producir un documento JSON versionado y el parser SHALL rechazar versiones no soportadas sin interpretar parcialmente el documento como vÃ¡lido.

#### Scenario: CreaciÃ³n de documento vacÃ­o
- **GIVEN** un identificador de propietario autenticado y un nombre de proyecto no vacÃ­o
- **WHEN** se crea un `ProjectDocument` nuevo mediante la fÃ¡brica del dominio
- **THEN** el documento recibe UUID estable, `schemaVersion` soportada, revisiÃ³n inicial `0`, timestamps vÃ¡lidos y colecciones UML/layout/perfil inicialmente vacÃ­as

#### Scenario: Round-trip del documento
- **GIVEN** un `ProjectDocument` vÃ¡lido con UML, layout y perfil de generaciÃ³n
- **WHEN** se serializa y luego se deserializa con la misma versiÃ³n de esquema
- **THEN** se preservan semÃ¡ntica, IDs, referencias, multiplicidades, layout, perfil, revisiÃ³n y metadatos sin introducir objetos propios de UI

#### Scenario: VersiÃ³n no soportada
- **GIVEN** un JSON con una `schemaVersion` desconocida
- **WHEN** se intenta deserializar como `ProjectDocument`
- **THEN** el parser devuelve un error tipado de versiÃ³n y no produce un documento parcialmente aceptado

### Requirement: El modelo UML y el layout permanecen desacoplados
El sistema SHALL mantener `CanonicalUmlModel` como Ãºnica fuente de verdad semÃ¡ntica y `DiagramLayout` como estado visual referenciado por IDs. `CanonicalUmlModel` SHALL NOT contener coordenadas, objetos SVG/D3/ELK ni estado de selecciÃ³n. `DiagramLayout` SHALL NOT redefinir nombre, tipo, miembros o relaciones UML.

#### Scenario: PosiciÃ³n visual separada
- **GIVEN** una clase UML con un ID estable
- **WHEN** se registra una posiciÃ³n `x/y` para ese ID en `DiagramLayout`
- **THEN** la clase conserva exactamente la misma semÃ¡ntica y el layout puede cambiar sin modificar la entidad UML

#### Scenario: Referencia visual huÃ©rfana
- **GIVEN** un layout que referencia un ID que no pertenece a un elemento diagramable del modelo
- **WHEN** se valida el documento
- **THEN** se emite un diagnÃ³stico estable para la referencia de layout inexistente

### Requirement: El subconjunto UML 2.5.1 aprobado se expresa con contratos cerrados
El sistema SHALL representar paquetes, clases, atributos/propiedades, operaciones, parÃ¡metros, visibilidad, referencias de tipo, enumeraciones, asociaciones, extremos, multiplicidades, agregaciÃ³n, composiciÃ³n y generalizaciÃ³n mediante uniones discriminadas o contratos equivalentes cerrados. Los IDs de elementos SHALL ser Ãºnicos dentro del documento y las referencias SHALL usar IDs, nunca nombres como identidad.

#### Scenario: Clase completa vÃ¡lida
- **GIVEN** un modelo con una clase identificada por UUID, atributos y operaciones cuyos tipos son primitivos o referencias existentes
- **WHEN** se valida el modelo
- **THEN** no se emiten errores estructurales para esa clase

#### Scenario: AsociaciÃ³n con multiplicidades
- **GIVEN** dos clases existentes y una asociaciÃ³n cuyos dos extremos apuntan a sus IDs con multiplicidades vÃ¡lidas
- **WHEN** se valida el modelo
- **THEN** la asociaciÃ³n se acepta y sus extremos preservan rol, multiplicidad y tipo de agregaciÃ³n cuando corresponda

#### Scenario: GeneralizaciÃ³n invÃ¡lida
- **GIVEN** una generalizaciÃ³n cuyo elemento especÃ­fico y general forman una autorreferencia o un ciclo de herencia
- **WHEN** se valida el modelo
- **THEN** se emite un error estable de generalizaciÃ³n y el modelo no se considera vÃ¡lido para polÃ­ticas bloqueantes

### Requirement: Las multiplicidades y referencias son deterministas
El sistema SHALL representar una multiplicidad con lÃ­mite inferior entero no negativo y lÃ­mite superior entero no negativo o `*`. Un lÃ­mite superior numÃ©rico SHALL ser mayor o igual al inferior. Toda referencia a paquete, clase, enumeraciÃ³n, tipo, extremo o miembro exigida por el contrato SHALL apuntar a un ID existente del tipo permitido.

#### Scenario: Multiplicidad ilimitada vÃ¡lida
- **GIVEN** una multiplicidad `0..*`
- **WHEN** el validador la evalÃºa
- **THEN** la multiplicidad se acepta

#### Scenario: Multiplicidad invertida
- **GIVEN** una multiplicidad `5..2`
- **WHEN** el validador la evalÃºa
- **THEN** se emite `UML_MULTIPLICITY_INVALID` con path lÃ³gico al valor incorrecto

#### Scenario: Tipo referenciado inexistente
- **GIVEN** un atributo cuyo tipo referencia un elemento inexistente
- **WHEN** se valida el documento
- **THEN** se emite `UML_REFERENCE_MISSING` asociado al atributo afectado

### Requirement: El perfil de generaciÃ³n permanece separado del UML puro
El sistema SHALL modelar `entity`, `auditable`, `readOnly`, `searchable`, `crud`, `required`, `unique`, `sortable` y `defaultSort` en un perfil de generaciÃ³n independiente que referencia elementos UML por ID. Eliminar o modificar metadatos del perfil SHALL NOT cambiar la semÃ¡ntica UML. El validador SHALL detectar referencias del perfil a elementos inexistentes o incompatibles.

#### Scenario: Perfil de clase y atributo vÃ¡lido
- **GIVEN** una clase y un atributo existentes
- **WHEN** el perfil marca la clase con metadatos de generaciÃ³n y el atributo con `required`, `unique` o `sortable`
- **THEN** el documento conserva esos metadatos fuera de la entidad UML y la validaciÃ³n acepta sus referencias

#### Scenario: Default sort invÃ¡lido
- **GIVEN** un `defaultSort` que apunta a un atributo inexistente o ajeno a la clase configurada
- **WHEN** se valida el perfil
- **THEN** se emite un diagnÃ³stico estable de referencia de perfil y el UML puro permanece sin cambios

### Requirement: La validaciÃ³n produce diagnÃ³sticos estables y reutilizables
El sistema SHALL exponer un Ãºnico motor de validaciÃ³n para `ProjectDocument`. Cada diagnÃ³stico SHALL contener `severity` (`error` o `warning`), `code` estable, mensaje, `path` lÃ³gico y `elementId` cuando exista un elemento asociado. Un fallo interno del motor SHALL NOT interpretarse como documento vÃ¡lido.

El nÃºcleo SHALL reservar como mÃ­nimo los cÃ³digos `DOCUMENT_VERSION_UNSUPPORTED`, `UML_ID_DUPLICATE`, `UML_NAME_REQUIRED`, `UML_REFERENCE_MISSING`, `UML_MULTIPLICITY_INVALID`, `UML_PACKAGE_CYCLE`, `UML_GENERALIZATION_CYCLE`, `LAYOUT_REFERENCE_MISSING` y `PROFILE_REFERENCE_MISSING`.

#### Scenario: IDs duplicados
- **GIVEN** dos elementos UML con el mismo ID
- **WHEN** se valida el documento
- **THEN** se emite `UML_ID_DUPLICATE` como error con un path reproducible

#### Scenario: Nombre obligatorio vacÃ­o
- **GIVEN** una clase, atributo, operaciÃ³n, enumeraciÃ³n o paquete cuyo nombre requerido queda vacÃ­o despuÃ©s de `trim`
- **WHEN** se valida el documento
- **THEN** se emite `UML_NAME_REQUIRED` asociado al elemento correspondiente

#### Scenario: Resultado con warnings
- **GIVEN** un documento sin errores pero con una regla que produce warning
- **WHEN** una polÃ­tica no bloqueante lo valida
- **THEN** el resultado conserva el warning y continÃºa siendo utilizable bajo esa polÃ­tica

### Requirement: Las polÃ­ticas de validaciÃ³n separan contexto sin duplicar el motor
El sistema SHALL definir polÃ­ticas identificables para `edit`, `save`, `import` y `generate` sobre el mismo conjunto de diagnÃ³sticos y reglas. CU-2.1 SHALL implementar el contrato y la selecciÃ³n de polÃ­tica, pero SHALL NOT implementar persistencia, XMI ni generaciÃ³n. Una polÃ­tica puede decidir si determinados diagnÃ³sticos bloquean el consumidor sin alterar el `CanonicalUmlModel`.

#### Scenario: Misma regla en dos consumidores
- **GIVEN** un documento con una referencia UML rota
- **WHEN** se valida con las polÃ­ticas `edit` y `save`
- **THEN** ambas evaluaciones usan el mismo cÃ³digo y path de diagnÃ³stico, aunque la polÃ­tica pueda decidir de forma distinta si bloquea la operaciÃ³n consumidora

#### Scenario: Consumidor futuro no implementado
- **GIVEN** las polÃ­ticas `import` y `generate` definidas por contrato
- **WHEN** se ejecutan los tests de CU-2.1
- **THEN** no existe importador XMI, generador de cÃ³digo, endpoint o persistencia creada por este incremento