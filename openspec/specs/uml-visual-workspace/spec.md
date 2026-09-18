# uml-visual-workspace Specification

## Purpose

Define el workspace CASE autenticado y local que permite crear, seleccionar,
renombrar y mover el subconjunto visual minimo sin apartarse del documento UML
canonico, del layout separado ni de la frontera publica de `UmlCommandBus`.

## Requirements

### Requirement: Ciclo de vida autenticado y exclusivamente local
El sistema SHALL mostrar el workspace UML solo despues de confirmar la cuenta autenticada. Al montar el workspace autorizado SHALL crear un unico `ProjectDocument` vacio cuyo propietario es la cuenta autenticada y un unico `UmlCommandBus` para ese documento. Para satisfacer exclusivamente la precondicion estructural heredada de `createProjectDocument`, esa creacion SHALL usar `primer-parcial-workspace` como `ProjectDocument.name` interno transitorio. Ese valor SHALL NOT renderizarse, editarse, exponerse como feature o titulo, modificarse mediante comandos, participar de la UX ni agregar persistencia. El documento, el bus, la seleccion y el feedback SHALL vivir solo durante esa instancia de la isla; CU-2.3 SHALL NOT leerlos ni escribirlos mediante HTTP, WebSocket, PostgreSQL, almacenamiento del navegador, archivos o cualquier otro mecanismo de persistencia.

#### Scenario: Inicio de una sesion de modelado autorizada
- **GIVEN** una cuenta cuya sesion fue confirmada por la ruta protegida
- **WHEN** se monta el workspace visual
- **THEN** se presenta un documento local vacio, revision `0`, asociado al identificador de esa cuenta y gobernado por un unico bus

#### Scenario: La vida del documento termina con la isla
- **GIVEN** un documento local con ediciones aceptadas
- **WHEN** la persona recarga la pagina, cierra la pestana o desmonta el workspace
- **THEN** CU-2.3 no conserva ni recupera esas ediciones y una nueva instancia comienza con otro documento local vacio

### Requirement: Modelo UML sin titulo editable
El workspace SHALL representar un Modelo UML sin titulo editable. El shell MAY mostrar exclusivamente la etiqueta estatica `Modelo UML`. Esa etiqueta SHALL NOT pertenecer a `ProjectDocument` ni a metadata del modelo, ser editable o persistida, ni crear comandos, revision o entradas de Undo/Redo. CU-2.3 SHALL NOT exigir un campo de dominio ni agregar un `UmlCommand` para titulo o nombre; tampoco SHALL mostrar `Sin titulo`/`Untitled`, nombres autogenerados, inputs de nombre de proyecto o modelo, ni placeholders editables de titulo.

#### Scenario: Shell sin titulo de dominio
- **GIVEN** un workspace visual autorizado recien montado o con ediciones aceptadas
- **WHEN** la persona observa el shell y sus controles
- **THEN** puede ver solo la etiqueta estatica `Modelo UML` como identificacion del workspace, sin control para editar o persistir un titulo o nombre

#### Scenario: La etiqueta estatica no muta el documento
- **GIVEN** un documento local, su bus y una etiqueta `Modelo UML` visible
- **WHEN** la persona crea, renombra, mueve, deshace o rehace elementos UML
- **THEN** la etiqueta no origina un comando ni altera `ProjectDocument`, metadata, revision o disponibilidad de Undo/Redo

### Requirement: Toolbox cerrado con contexto de paquete e IDs provistos por el caller
El toolbox SHALL exponer exactamente tres acciones de creacion: `Package`, `Class` y `Enumeration`. `Package` SHALL solicitar un nombre requerido y enviar `CreatePackage` con `parentPackageId: null`; CU-2.3 SHALL NOT crear paquetes anidados. `Class` y `Enumeration` SHALL solicitar un nombre requerido y solo estaran disponibles cuando la seleccion actual sea un paquete existente del `currentDocument`; ese paquete SHALL ser respectivamente el `packageId` de `CreateClass` o `CreateEnumeration`.

Para cada intento de creacion enviado, el workspace SHALL generar como caller un ID no vacio y unico respecto de todos los IDs del `currentDocument` y de los IDs generados por ese mismo intento. SHALL incluirlo en el `value` cerrado y SHALL NOT pedir al bus que genere, infiera o reemplace el ID. El algoritmo concreto de generacion pertenece al design, pero un ID aceptado SHALL permanecer estable como identidad del elemento en proyecciones, seleccion, Undo y Redo.

#### Scenario: Creacion de un paquete raiz
- **GIVEN** un nombre de paquete no vacio y cualquier seleccion actual
- **WHEN** la persona activa `Package`
- **THEN** el workspace envia exactamente un `CreatePackage` con `parentPackageId: null`, nombre e ID provisto por el caller

#### Scenario: Creacion de una clase dentro del paquete seleccionado
- **GIVEN** un paquete existente como unica seleccion y un nombre de clase no vacio
- **WHEN** la persona activa `Class`
- **THEN** el workspace envia exactamente un `CreateClass` cuyo `packageId` es el ID del paquete seleccionado y cuyo `value` contiene solo ID y nombre

#### Scenario: Creacion de una enumeracion dentro del paquete seleccionado
- **GIVEN** un paquete existente como unica seleccion y un nombre de enumeracion no vacio
- **WHEN** la persona activa `Enumeration`
- **THEN** el workspace envia exactamente un `CreateEnumeration` cuyo `packageId` es el ID del paquete seleccionado y cuyo `value` contiene solo ID y nombre

#### Scenario: Falta el contexto requerido para un clasificador
- **GIVEN** que no hay seleccion o la seleccion actual no es un paquete existente
- **WHEN** la persona consulta las acciones `Class` y `Enumeration`
- **THEN** ambas acciones estan deshabilitadas, explican que requieren seleccionar un paquete y no envian ningun comando

#### Scenario: Identidad aceptada estable
- **GIVEN** una accion de creacion con un ID provisto por el workspace
- **WHEN** el bus acepta el comando y el elemento se reproyecta, se deshace y se rehace
- **THEN** todas las apariciones aceptadas del elemento conservan exactamente ese ID y ningun otro elemento recibe el mismo ID

### Requirement: Inspector limitado al nombre de clases y enumeraciones
El inspector SHALL mostrar el tipo, ID, nombre y contexto disponible del unico elemento seleccionado. Solo una clase o enumeracion seleccionada SHALL exponer su nombre como campo editable; confirmar el cambio SHALL enviar respectivamente `RenameClass` o `RenameEnumeration`. Un paquete seleccionado y cualquier otra informacion proyectada SHALL ser de solo lectura. Sin seleccion, el inspector SHALL mostrar un estado vacio explicito y SHALL NOT conservar valores de una seleccion anterior.

#### Scenario: Renombrado de una clase
- **GIVEN** una clase seleccionada y un nombre de reemplazo introducido en el inspector
- **WHEN** la persona confirma la edicion
- **THEN** el workspace envia un `RenameClass` con solo el ID de la clase y el nombre de reemplazo

#### Scenario: Renombrado de una enumeracion
- **GIVEN** una enumeracion seleccionada y un nombre de reemplazo introducido en el inspector
- **WHEN** la persona confirma la edicion
- **THEN** el workspace envia un `RenameEnumeration` con solo el ID de la enumeracion y el nombre de reemplazo

#### Scenario: Inspector sin destino editable
- **GIVEN** ningun elemento seleccionado o un paquete seleccionado
- **WHEN** se presenta el inspector
- **THEN** el inspector esta respectivamente vacio o muestra datos de solo lectura y no ofrece otra mutacion

### Requirement: Proyeccion autoritativa desde currentDocument y mutacion solo por el bus
Toda representacion UML o de layout confirmada SHALL derivarse de una nueva lectura de `UmlCommandBus.currentDocument`. Una accion aceptada, Undo o Redo SHALL reproyectar el documento completo confirmado; una accion rechazada SHALL conservar la proyeccion anterior. La UI SHALL mantener por separado solo estado transitorio como seleccion, valores de formulario, foco y feedback. SHALL NOT mutar objetos recibidos, mantener una copia semantica autoritativa, modificar directamente `CanonicalUmlModel`, `DiagramLayout` o perfil, reemplazar el bus para aplicar una edicion, ni acceder al executor, stacks, capacidad u otros internos privados.

#### Scenario: Edicion aceptada reproyectada
- **GIVEN** una accion visual cuyo comando es aceptado
- **WHEN** finaliza la llamada publica al bus
- **THEN** modelo, layout, revision, disponibilidad de historial y elementos visibles se obtienen del nuevo `currentDocument`

#### Scenario: Edicion rechazada sin estado optimista residual
- **GIVEN** una accion visual cuyo comando es rechazado
- **WHEN** se presenta el resultado
- **THEN** la proyeccion confirmada permanece identica al `currentDocument` previo y no queda una mutacion parcial u optimista

#### Scenario: Unica frontera publica de mutacion
- **GIVEN** cualquier creacion, renombrado o movimiento iniciado en el workspace
- **WHEN** la accion intenta cambiar semantica o layout
- **THEN** la accion usa exclusivamente `submit`, `undo` o `redo` de la instancia publica de `UmlCommandBus`

### Requirement: Proyeccion determinista de nodos, layout y relaciones
El diagrama SHALL proyectar como nodos los paquetes, clases y enumeraciones del `currentDocument`. Una clase SHALL mostrar su nombre y sus atributos y operaciones de solo lectura; una enumeracion SHALL mostrar su nombre y literales de solo lectura. Si existe una entrada de `DiagramLayout` para un nodo, sus coordenadas finitas `x/y` SHALL ser la posicion confirmada en el espacio del diagrama y SHALL permanecer independientes del tamano del viewport.

Si un elemento diagramable no tiene entrada de layout, SHALL seguir visible en una posicion fallback finita, diferenciada y determinista derivada solamente de su ID y del orden canonico. El mismo `currentDocument` SHALL producir las mismas posiciones fallback en reproyecciones y viewports diferentes, sin usar reloj, azar, seleccion ni mutar o completar `DiagramLayout`. El design podra fijar geometria, separaciones y transformaciones concretas sin cambiar estas garantias.

Cada asociacion SHALL visualizar sus dos clasificadores extremos, nombre si existe, multiplicidades y agregacion `none`, `shared` o `composite`. Cada generalizacion SHALL visualizar de forma distinguible la direccion desde el clasificador especifico hacia el general. Asociaciones y generalizaciones SHALL ser exclusivamente visuales en CU-2.3: no seran seleccionables, creadas, editadas, movidas ni eliminadas por este workspace.

#### Scenario: Posicion confirmada por layout
- **GIVEN** un elemento diagramable con una entrada de layout en `currentDocument`
- **WHEN** se proyecta el diagrama en cualquier viewport
- **THEN** el nodo usa las coordenadas confirmadas de esa entrada sin copiarlas al modelo UML ni reinterpretarlas como semantica

#### Scenario: Elemento sin layout
- **GIVEN** un paquete, clase o enumeracion sin entrada en `DiagramLayout`
- **WHEN** se proyecta repetidamente el mismo `currentDocument`
- **THEN** el elemento permanece visible en la misma posicion fallback y el documento no recibe una entrada de layout implicita

#### Scenario: Asociacion de solo lectura
- **GIVEN** una asociacion canonica cuyos extremos referencian clasificadores visibles
- **WHEN** se proyecta el diagrama
- **THEN** se ven ambos extremos, multiplicidades, agregaciones y nombre disponible sin ofrecer una accion que cambie la asociacion

#### Scenario: Generalizacion de solo lectura
- **GIVEN** una generalizacion canonica entre clasificadores visibles
- **WHEN** se proyecta el diagrama
- **THEN** se distingue su direccion especifico-a-general sin ofrecer una accion que cambie la generalizacion

### Requirement: Movimiento confirmado exclusivamente mediante MoveNode
Todo intento de cambiar una posicion SHALL calcular coordenadas finitas en el espacio del diagrama y enviar `MoveNode` con solo `elementId`, `x` y `y`. El nodo SHALL adoptar la posicion solicitada solo despues de una aceptacion y una nueva proyeccion de `currentDocument`. Para un Package, Class o Enumeration sin entrada de layout, el bus SHALL materializar esa entrada tras aceptar el comando; la UI SHALL NOT insertar una entrada por fuera del bus.

#### Scenario: Movimiento de un nodo con layout
- **GIVEN** un nodo seleccionado con entrada de layout existente
- **WHEN** una interaccion de puntero o su alternativa de teclado solicita otra posicion
- **THEN** el workspace envia `MoveNode` y solo una aceptacion mueve la proyeccion confirmada a las nuevas coordenadas

#### Scenario: Movimiento de un nodo fallback
- **GIVEN** un nodo seleccionado sin entrada de layout
- **WHEN** una interaccion intenta moverlo
- **THEN** el workspace envia `MoveNode` y, solo tras su aceptacion, reproyecta la entrada de layout materializada por el bus sin insertar layout directamente

### Requirement: Seleccion unica y transitoria
El workspace SHALL mantener cero o un ID de nodo seleccionado, fuera del `ProjectDocument`. Seleccionar otro nodo SHALL reemplazar la seleccion anterior; activar el fondo libre del diagrama SHALL limpiarla. Despues de cada reproyeccion, SHALL conservarse solo si el ID todavia identifica un nodo del `currentDocument`; de lo contrario SHALL limpiarse junto con el inspector.

#### Scenario: Reemplazo de seleccion
- **GIVEN** un nodo seleccionado
- **WHEN** la persona selecciona otro paquete, clase o enumeracion
- **THEN** solo el segundo nodo queda indicado como seleccionado y el inspector muestra solo ese elemento

#### Scenario: Fondo limpia la seleccion
- **GIVEN** cualquier nodo seleccionado
- **WHEN** la persona activa un area libre del fondo del diagrama
- **THEN** no queda ningun nodo seleccionado y el inspector muestra su estado vacio

#### Scenario: Undo elimina el destino seleccionado
- **GIVEN** un elemento creado y seleccionado
- **WHEN** Undo restaura un documento que no contiene su ID
- **THEN** la reproyeccion elimina el nodo y limpia seleccion e inspector sin escribir en el documento restaurado

### Requirement: Fallos tipados visibles y no destructivos
El workspace SHALL reservar una region visible y anunciada para el ultimo resultado fallido. Un `unsupported-command` SHALL mostrar su kind; un `precondition-failed` SHALL mostrar su kind y codigo publico; un `validation-failed` SHALL mostrar su kind y cada diagnostico con severity, code, mensaje y referencia de elemento cuando exista. SHALL usar texto comprensible junto con esos identificadores tecnicos, SHALL NOT sustituirlos por texto ad-hoc, y SHALL NOT mostrar stacks, objetos internos ni secretos. Una accion posterior aceptada SHALL limpiar el fallo anterior.

#### Scenario: Precondicion rechazada visible
- **GIVEN** un comando visual rechazado con `precondition-failed`
- **WHEN** el workspace recibe el resultado
- **THEN** muestra el codigo publico exacto, una explicacion comprensible y conserva documento, revision, seleccion e historial

#### Scenario: Diagnosticos de validacion visibles
- **GIVEN** un comando visual rechazado con `validation-failed`
- **WHEN** el workspace recibe sus diagnosticos
- **THEN** presenta cada severity, code y mensaje, permite identificar el elemento cuando `elementId` existe y no presenta el candidato como aceptado

#### Scenario: Fallo interno encapsulado
- **GIVEN** que el bus devuelve `VALIDATION_INTERNAL_ERROR`
- **WHEN** se presenta el fallo
- **THEN** la region anuncia el codigo y un mensaje seguro sin stack ni falsa confirmacion de exito

### Requirement: Undo y Redo reflejan exclusivamente el estado publico del bus
El workspace SHALL ofrecer controles visibles `Undo` y `Redo`. Su disponibilidad SHALL reflejar respectivamente `canUndo` y `canRedo`, sin inferir ni inspeccionar stacks. Un control disponible SHALL invocar la operacion publica correspondiente una sola vez y reproyectar el `currentDocument` restaurado; un control no disponible SHALL permanecer deshabilitado y no cambiar estado. Una edicion nueva aceptada despues de Undo SHALL reflejar la invalidacion de Redo decidida por el bus.

#### Scenario: Estado inicial sin historial
- **GIVEN** un bus recien creado sin comandos aceptados
- **WHEN** se presenta el workspace
- **THEN** `Undo` y `Redo` estan visibles y deshabilitados conforme a `canUndo: false` y `canRedo: false`

#### Scenario: Restauracion visible por Undo y Redo
- **GIVEN** una edicion aceptada y controles de historial disponibles
- **WHEN** la persona activa Undo y luego Redo
- **THEN** cada control invoca una vez al bus, reproyecta el snapshot restaurado y refleja revision, layout, seleccion valida y disponibilidad resultantes

#### Scenario: Nueva rama invalida Redo
- **GIVEN** que Undo dejo Redo disponible
- **WHEN** una nueva edicion es aceptada
- **THEN** la proyeccion muestra el nuevo `currentDocument` y `Redo` queda deshabilitado conforme a `canRedo: false`

### Requirement: Accesibilidad operable y adaptacion responsive minima
Las acciones de toolbox, inspector, Undo/Redo y seleccion SHALL ser operables con teclado, mostrar foco visible y tener nombre accesible. Cada nodo SHALL exponer tipo y nombre accesibles y podra seleccionarse con teclado; un nodo diagramable SHALL tener una alternativa de teclado al movimiento por puntero que use el mismo `MoveNode`. La region de fallos SHALL anunciar cambios sin mover el foco automaticamente.

Desde 320 CSS px de ancho, los controles SHALL permanecer visibles y operables, las regiones laterales SHALL reordenarse sin causar overflow horizontal en la pagina y el diagrama SHALL conservar una region propia navegable. El tamano, breakpoints, teclas, incremento de movimiento y mecanica de puntero concretos pertenecen al design.

#### Scenario: Flujo basico solo con teclado
- **GIVEN** un workspace con un paquete y un nodo con layout
- **WHEN** la persona navega sin puntero por toolbox, nodos, inspector e historial y solicita un movimiento
- **THEN** puede seleccionar, crear, renombrar, mover mediante `MoveNode`, deshacer y rehacer con foco visible y nombres accesibles

#### Scenario: Error anunciado sin secuestrar foco
- **GIVEN** el foco en el control que origina un comando rechazado
- **WHEN** aparece el feedback tipado
- **THEN** la region accesible anuncia el cambio y el foco permanece bajo control de la persona

#### Scenario: Viewport movil minimo
- **GIVEN** un viewport de 320 CSS px de ancho
- **WHEN** se muestra toolbox, diagrama, inspector, historial y feedback
- **THEN** todas las regiones siguen disponibles sin overflow horizontal de pagina y el diagrama puede navegarse dentro de su propia region

### Requirement: Alcance visual y de edicion cerrado para CU-2.3
Ademas de las tres creaciones, dos renombrados, `MoveNode`, Undo y Redo especificados, CU-2.3 SHALL NOT exponer otras mutaciones del catalogo. En particular SHALL NOT crear, editar o eliminar atributos, operaciones, parametros, literales, asociaciones, generalizaciones, paquetes anidados, perfil de generacion ni elementos existentes. Tampoco SHALL introducir auto-layout, guardado, autosave, reapertura, listado o CRUD de proyectos, colaboracion, realtime, XMI, generacion ni entradas de IA. Zoom, pan, ajuste a contenido, menus contextuales y dependencias graficas especializadas no forman parte del comportamiento requerido por esta capacidad minima.

#### Scenario: No aparecen editores fuera del alcance
- **GIVEN** cualquier seleccion o documento proyectado
- **WHEN** la persona revisa toolbox, inspector, diagrama y menus disponibles
- **THEN** no encuentra una ruta para mutar relaciones, miembros, perfil, paquetes anidados o eliminar elementos

#### Scenario: Ningun efecto externo del modelado local
- **GIVEN** cualquier secuencia de creacion, renombrado, movimiento, Undo y Redo
- **WHEN** se observa el sistema fuera de la instancia local del workspace
- **THEN** no se realiza persistencia, trafico de documento UML, colaboracion, importacion, generacion ni ejecucion de IA
