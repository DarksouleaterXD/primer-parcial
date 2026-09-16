# UML Domain Validation Specification

## Purpose
TBD - Update Purpose after archive.

## Requirements

### Requirement: El proyecto UML usa un documento canonico versionado y serializable
El sistema SHALL representar el trabajo UML en memoria mediante un `ProjectDocument` con `schemaVersion`, UUID de documento, nombre, propietario autenticado, revision local no negativa, timestamps ISO-8601, `CanonicalUmlModel`, `DiagramLayout` y perfil de generacion separado. La serializacion SHALL producir un documento JSON versionado y el parser SHALL rechazar versiones no soportadas sin interpretar parcialmente el documento como valido.

#### Scenario: Creacion de documento vacio
- **GIVEN** un identificador de propietario autenticado y un nombre de proyecto no vacio
- **WHEN** se crea un `ProjectDocument` nuevo mediante la fabrica del dominio
- **THEN** el documento recibe UUID estable, `schemaVersion` soportada, revision inicial `0`, timestamps validos y colecciones UML/layout/perfil inicialmente vacias

#### Scenario: Round-trip del documento
- **GIVEN** un `ProjectDocument` valido con UML, layout y perfil de generacion
- **WHEN** se serializa y luego se deserializa con la misma version de esquema
- **THEN** se preservan semantica, IDs, referencias, multiplicidades, layout, perfil, revision y metadatos sin introducir objetos propios de UI

#### Scenario: Version no soportada
- **GIVEN** un JSON con una `schemaVersion` desconocida
- **WHEN** se intenta deserializar como `ProjectDocument`
- **THEN** el parser devuelve un error tipado de version y no produce un documento parcialmente aceptado

### Requirement: El modelo UML y el layout permanecen desacoplados
El sistema SHALL mantener `CanonicalUmlModel` como unica fuente de verdad semantica y `DiagramLayout` como estado visual referenciado por IDs. `CanonicalUmlModel` SHALL NOT contener coordenadas, objetos SVG/D3/ELK ni estado de seleccion. `DiagramLayout` SHALL NOT redefinir nombre, tipo, miembros o relaciones UML.

#### Scenario: Posicion visual separada
- **GIVEN** una clase UML con un ID estable
- **WHEN** se registra una posicion `x/y` para ese ID en `DiagramLayout`
- **THEN** la clase conserva exactamente la misma semantica y el layout puede cambiar sin modificar la entidad UML

#### Scenario: Referencia visual huerfana
- **GIVEN** un layout que referencia un ID que no pertenece a un elemento diagramable del modelo
- **WHEN** se valida el documento
- **THEN** se emite un diagnostico estable para la referencia de layout inexistente

### Requirement: El subconjunto UML 2.5.1 aprobado se expresa con contratos cerrados
El sistema SHALL representar paquetes, clases, atributos/propiedades, operaciones, parametros, visibilidad, referencias de tipo, enumeraciones, asociaciones, extremos, multiplicidades, agregacion, composicion y generalizacion mediante uniones discriminadas o contratos equivalentes cerrados. Los IDs de elementos SHALL ser unicos dentro del documento y las referencias SHALL usar IDs, nunca nombres como identidad.

#### Scenario: Clase completa valida
- **GIVEN** un modelo con una clase identificada por UUID, atributos y operaciones cuyos tipos son primitivos o referencias existentes
- **WHEN** se valida el modelo
- **THEN** no se emiten errores estructurales para esa clase

#### Scenario: Asociacion con multiplicidades
- **GIVEN** dos clases existentes y una asociacion cuyos dos extremos apuntan a sus IDs con multiplicidades validas
- **WHEN** se valida el modelo
- **THEN** la asociacion se acepta y sus extremos preservan rol, multiplicidad y tipo de agregacion cuando corresponda

#### Scenario: Generalizacion invalida
- **GIVEN** una generalizacion cuyo elemento especifico y general forman una autorreferencia o un ciclo de herencia
- **WHEN** se valida el modelo
- **THEN** se emite un error estable de generalizacion y el modelo no se considera valido para politicas bloqueantes

### Requirement: Las multiplicidades y referencias son deterministas
El sistema SHALL representar una multiplicidad con limite inferior entero no negativo y limite superior entero no negativo o `*`. Un limite superior numerico SHALL ser mayor o igual al inferior. Toda referencia a paquete, clase, enumeracion, tipo, extremo o miembro exigida por el contrato SHALL apuntar a un ID existente del tipo permitido.

#### Scenario: Multiplicidad ilimitada valida
- **GIVEN** una multiplicidad `0..*`
- **WHEN** el validador la evalua
- **THEN** la multiplicidad se acepta

#### Scenario: Multiplicidad invertida
- **GIVEN** una multiplicidad `5..2`
- **WHEN** el validador la evalua
- **THEN** se emite `UML_MULTIPLICITY_INVALID` con path logico al valor incorrecto

#### Scenario: Tipo referenciado inexistente
- **GIVEN** un atributo cuyo tipo referencia un elemento inexistente
- **WHEN** se valida el documento
- **THEN** se emite `UML_REFERENCE_MISSING` asociado al atributo afectado

### Requirement: El perfil de generacion permanece separado del UML puro
El sistema SHALL modelar `entity`, `auditable`, `readOnly`, `searchable`, `crud`, `required`, `unique`, `sortable` y `defaultSort` en un perfil de generacion independiente que referencia elementos UML por ID. Eliminar o modificar metadatos del perfil SHALL NOT cambiar la semantica UML. El validador SHALL detectar referencias del perfil a elementos inexistentes o incompatibles.

#### Scenario: Perfil de clase y atributo valido
- **GIVEN** una clase y un atributo existentes
- **WHEN** el perfil marca la clase con metadatos de generacion y el atributo con `required`, `unique` o `sortable`
- **THEN** el documento conserva esos metadatos fuera de la entidad UML y la validacion acepta sus referencias

#### Scenario: Default sort invalido
- **GIVEN** un `defaultSort` que apunta a un atributo inexistente o ajeno a la clase configurada
- **WHEN** se valida el perfil
- **THEN** se emite un diagnostico estable de referencia de perfil y el UML puro permanece sin cambios

### Requirement: La validacion produce diagnosticos estables y reutilizables
El sistema SHALL exponer un unico motor de validacion para `ProjectDocument`. Cada diagnostico SHALL contener `severity` (`error` o `warning`), `code` estable, mensaje, `path` logico y `elementId` cuando exista un elemento asociado. Un fallo interno del motor SHALL NOT interpretarse como documento valido.

El nucleo SHALL reservar como minimo los codigos `DOCUMENT_VERSION_UNSUPPORTED`, `UML_ID_DUPLICATE`, `UML_NAME_REQUIRED`, `UML_REFERENCE_MISSING`, `UML_MULTIPLICITY_INVALID`, `UML_PACKAGE_CYCLE`, `UML_GENERALIZATION_CYCLE`, `LAYOUT_REFERENCE_MISSING` y `PROFILE_REFERENCE_MISSING`.

#### Scenario: IDs duplicados
- **GIVEN** dos elementos UML con el mismo ID
- **WHEN** se valida el documento
- **THEN** se emite `UML_ID_DUPLICATE` como error con un path reproducible

#### Scenario: Nombre obligatorio vacio
- **GIVEN** una clase, atributo, operacion, enumeracion o paquete cuyo nombre requerido queda vacio despues de `trim`
- **WHEN** se valida el documento
- **THEN** se emite `UML_NAME_REQUIRED` asociado al elemento correspondiente

#### Scenario: Resultado con warnings
- **GIVEN** un documento sin errores pero con una regla que produce warning
- **WHEN** una politica no bloqueante lo valida
- **THEN** el resultado conserva el warning y continua siendo utilizable bajo esa politica

### Requirement: Las politicas de validacion separan contexto sin duplicar el motor
El sistema SHALL definir politicas identificables para `edit`, `save`, `import` y `generate` sobre el mismo conjunto de diagnosticos y reglas. CU-2.1 SHALL implementar el contrato y la seleccion de politica, pero SHALL NOT implementar persistencia, XMI ni generacion. Una politica puede decidir si determinados diagnosticos bloquean el consumidor sin alterar el `CanonicalUmlModel`.

#### Scenario: Misma regla en dos consumidores
- **GIVEN** un documento con una referencia UML rota
- **WHEN** se valida con las politicas `edit` y `save`
- **THEN** ambas evaluaciones usan el mismo codigo y path de diagnostico, aunque la politica pueda decidir de forma distinta si bloquea la operacion consumidora

#### Scenario: Consumidor futuro no implementado
- **GIVEN** las politicas `import` y `generate` definidas por contrato
- **WHEN** se ejecutan los tests de CU-2.1
- **THEN** no existe importador XMI, generador de codigo, endpoint o persistencia creada por este incremento
