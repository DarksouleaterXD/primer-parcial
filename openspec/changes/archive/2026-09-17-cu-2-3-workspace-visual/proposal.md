## Why

CU-2.1 y CU-2.2 ya cerraron y archivaron el documento UML validado, el limite
de mutacion mediante `UmlCommandBus` y el historial local, pero la ruta
autenticada `/workspace` todavia muestra el placeholder de CU-1 y no permite
modelar ni observar un diagrama. CU-2.3 debe convertir esas capacidades cerradas
en un workspace visual minimo y comprobable, enteramente en memoria, donde el
usuario pueda editar a traves del bus, ver el resultado aceptado y recuperar
ediciones con Undo/Redo sin abrir prematuramente persistencia o colaboracion.

El cambio sera exitoso cuando el modelador autenticado pueda trabajar con un
`ProjectDocument` local, observar una proyeccion visual coherente de su modelo y
layout, ejecutar las operaciones visuales que finalmente definan las specs y el
design solo mediante `UmlCommandBus`, y recibir estados de seleccion,
diagnosticos y errores comprensibles sin mutacion parcial ni rutas alternativas.

## What Changes

- Reemplazar el placeholder autenticado por un shell CASE responsive con el
  workspace visual minimo: superficie de diagrama, controles de edicion
  acordados, inspeccion del elemento seleccionado, Undo/Redo visible y una zona
  accesible para diagnosticos y errores.
- Crear y mantener durante la sesion de la isla Preact un `ProjectDocument` y su
  `UmlCommandBus`; toda edicion semantica, de perfil o de posicion se enviara al
  bus y la UI se reproyectara exclusivamente desde `currentDocument` aceptado.
- Proyectar `CanonicalUmlModel` en elementos visuales y `DiagramLayout` en
  posiciones sin introducir semantica en SVG, componentes, seleccion ni estado
  transitorio de UI. Los objetos de renderizado nunca se convierten en dominio.
- Integrar movimiento mediante el comando existente `MoveNode` y exponer la
  disponibilidad y los resultados existentes de Undo/Redo, preservando la
  atomicidad, revision e historial definidos por `uml-command-history`.
- Preferir para este alcance minimo Preact, HTML, CSS y SVG, ya presentes o
  nativos del stack web. D3, ELK.js, Nanostores, Shoelace u otra dependencia
  pesada solo se incorporaran si el design demuestra una necesidad concreta,
  una frontera clara y una ventaja verificable frente a la alternativa nativa;
  su presencia en el stack aprobado no autoriza agregarlas por defecto.
- Mantener el documento y todo estado del workspace solo en memoria. Recargar,
  cerrar la pestana o terminar la sesion puede descartar el trabajo de CU-2.3;
  guardar, listar y reabrir proyectos corresponde a CU-3.
- Representar un Modelo UML sin titulo editable. El shell puede mostrar solamente
  la etiqueta estatica `Modelo UML`; esa etiqueta no pertenece a metadata del
  modelo, no se edita ni persiste, y no crea comandos, revision ni entradas de
  Undo/Redo. Para satisfacer exclusivamente la precondicion estructural heredada
  de `createProjectDocument`, la inicializacion puede pasar
  `primer-parcial-workspace` como `ProjectDocument.name` interno transitorio. Ese
  valor no se renderiza, edita, expone como feature o titulo, modifica mediante
  comandos, participa de la UX ni agrega persistencia. CU-2.3 no incorpora un
  campo de dominio ni un `UmlCommand` para titulo o nombre, y no muestra
  `Sin titulo`/`Untitled`, nombres autogenerados, inputs ni placeholders editables
  de proyecto o modelo.
- Exigir que specs y design cierren, antes de cualquier implementacion, el
  alcance exacto de toolbox e inspector; si la creacion de relaciones se incluye
  o si inicialmente solo se visualizan; quien genera los IDs de comandos UI;
  sistema y transformacion de coordenadas; tratamiento de elementos sin layout;
  reglas de seleccion y clic en fondo; presentacion visible de precondiciones,
  validacion y fallos internos; y la API exacta del adaptador UI hacia
  `UmlCommandBus`. Este proposal no decide esas alternativas.
- Sustentar el alcance en `docs/puds/use-cases/CU-2-modelado-uml-manual.md`,
  `docs/puds/use-cases/README.md`, `docs/PROJECT_CONTEXT.md`, `docs/STATUS.md`,
  `docs/architecture/README.md`, y en las capacidades canonicas cerradas de
  CU-2.1 y CU-2.2.
- Excluir persistencia/autosave, CRUD de proyectos, TypeORM/PostgreSQL para UML,
  HTTP del documento, WebSocket/realtime/presencia, XMI, generacion, IA, texto,
  voz, imagen y cualquier cambio al catalogo o semantica del dominio y bus ya
  cerrados, salvo la evolucion acotada y compatible del comportamiento de
  materializacion de layout de `MoveNode` definida por este cambio. Las acciones
  destructivas que entren en el alcance final deberan respetar confirmacion, pero
  su flujo exacto pertenece a specs/design. Esta decision de titulo no amplia el
  Block 2: las tareas 2.2 y 2.3 pueden continuar sin cambios.

## Capabilities

### New Capabilities
- `uml-visual-workspace`: workspace CASE autenticado y en memoria que proyecta
  el `ProjectDocument`, adapta interacciones visuales al `UmlCommandBus`, muestra
  seleccion, historial y resultados visibles, y mantiene separado el estado UI
  transitorio del modelo canonico y del layout. Su delta se creara exactamente
  en `openspec/changes/cu-2-3-workspace-visual/specs/uml-visual-workspace/spec.md`.

### Modified Capabilities
- `uml-command-history`: `MoveNode` conserva su catalogo, payload cerrado,
  validacion runtime, executor, revision, timestamps, validacion `edit`, historial
  y API publica; para un Package, Class o Enumeration existente sin nodo de layout,
  el bus materializa exactamente `{elementId, x, y}`. Los demas destinos siguen
  rechazando con `TARGET_NOT_FOUND`. El delta vive en
  `openspec/changes/cu-2-3-workspace-visual/specs/uml-command-history/spec.md`.

## Impact

- El impacto previsto se concentra en `apps/web`: la ruta protegida actual, una
  isla Preact de workspace, sus adaptadores/componentes, estilos y pruebas. La
  aplicacion web debera consumir `@primer-parcial/uml-domain`, que hoy no figura
  en sus dependencias ni se usa desde su codigo fuente.
- `packages/uml-domain` permanece como dependencia portable y no debe importar
  UI. Sus contratos cerrados de CU-2.1/CU-2.2 son precondiciones, no superficies
  a redisenar en este incremento.
- No se preve impacto en API, contratos HTTP, base de datos, migraciones ni
  servicios externos. La autenticacion de CU-1 sigue siendo la puerta de entrada
  al workspace, no un mecanismo de persistencia UML.
- Existe una incompatibilidad documental a resolver fuera de este artefacto:
  OpenSpec contiene CU-2.1 y CU-2.2 archivados y sus specs canonicas, mientras
  que las fuentes de continuidad y estado aun registran verify/sync/archive
  pendientes y describen CU-2.3 como bloqueado. Este proposal toma los archivos
  archivados y las specs canonicas como dependencia cerrada, pero no modifica ni
  oculta la documentacion desactualizada.
- El plan maestro nombra D3/SVG y ELK para CU-2.3, mientras la web actual no
  incluye esas dependencias. Specs/design deberan reconciliar el resultado
  observable exigido con la preferencia por primitivas web y justificar
  expresamente cualquier incorporacion; no se decide en el proposal.
