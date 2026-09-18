## 1. Compatibilidad de dominio / MoveNode

- [x] 1.1 Actualizar exclusivamente `packages/uml-domain` para que `MoveNode` materialice `{ elementId, x, y }` cuando un Package, Class o Enumeration existente no tenga nodo de layout, y conserve la sustitucion de coordenadas para un nodo existente; verificar que modelo semantico, perfil y entradas de layout no afectadas permanecen exactos.
- [x] 1.2 Mantener el envelope cerrado `{ kind: "MoveNode", elementId, x, y }`, su validacion runtime y el rechazo `TARGET_NOT_FOUND` para destinos inexistentes o no diagramables; verificar regresiones de payload malformado y de Attribute, Operation, Parameter, EnumerationLiteral, Association y Generalization.
- [x] 1.3 Verificar con pruebas focalizadas de `packages/uml-domain` que todo MoveNode aceptado ejecuta una sola validacion `edit`, avanza una revision, preserva timestamps y aplica el historial Undo/Redo existente; verificar que cada rechazo conserva documento, revision y ambas ramas de historial.

## 2. Workspace adapter/state

- [x] 2.1 Agregar la referencia de `@primer-parcial/uml-domain` a `apps/web` y un adaptador local tipado que delegue solo `currentDocument`, `canUndo`, `canRedo`, `submit`, `undo` y `redo` al unico `UmlCommandBus`; verificar typecheck y que no expone executor, stacks, capacidad ni copia autoritativa del documento.
- [x] 2.2 Reemplazar el placeholder autorizado por una isla Preact de workspace que, despues de la autorizacion existente, cree exactamente un `ProjectDocument` vacio y un `UmlCommandBus` por mount con `ownerId` de la cuenta; verificar con pruebas que los rerenders no los recrean, los IDs de prueba son deterministas y un remount pierde las ediciones intencionalmente.
- [x] 2.3 Mantener seleccion, contexto de paquete activo, formularios, preview de arrastre, foco y feedback como estado transitorio local; verificar que toda proyeccion confirmada se relee desde `currentDocument` tras un submit aceptado, Undo o Redo y que un rechazo conserva la proyeccion anterior.

## 3. Shell visual y nodos

- [x] 3.1 Implementar el shell responsive con franja de historial, toolbox, region SVG de diagrama, inspector y region de feedback visible; verificar a 320 CSS px que las regiones siguen operables sin overflow horizontal de pagina y el diagrama conserva su propia navegacion.
- [x] 3.2 Implementar una proyeccion pura de paquetes, clases y enumeraciones sobre SVG nativo, con atributos, operaciones y literales solo lectura; verificar la formula literal de fallback `origin = (80, 80)`, `cell = (240, 180)`, `columns = 3`, IDs lexicamente ordenados, precedencia de layout confirmado y ausencia de mutacion de documento o layout durante la proyeccion.
- [x] 3.3 Proyectar asociaciones y generalizaciones solo como relaciones SVG de lectura, incluyendo extremos, nombre disponible, multiplicidades, agregacion y direccion especifico-a-general; verificar que los extremos ausentes omiten solo esa relacion y que no existen controles para seleccionarlas, crearlas, editarlas, moverlas o eliminarlas.

## 4. Interacciones y edicion

- [x] 4.1 Implementar el toolbox cerrado con exactamente `Package`, `Class` y `Enumeration`, nombres requeridos e IDs unicos provistos por el caller; verificar los envelopes exactos de CreatePackage raiz, CreateClass y CreateEnumeration, que Class/Enumeration se deshabilitan y explican el contexto ausente, y que no hay paquetes anidados.
- [x] 4.2 Implementar seleccion unica transitoria e inspector derivado que muestre tipo, ID, nombre y contexto, permitiendo solo `RenameClass` y `RenameEnumeration`; verificar que Package y miembros permanecen de solo lectura, el fondo limpia seleccion y Undo limpia inspector/contexto cuando elimina el ID seleccionado.
- [x] 4.3 Implementar feedback tipado y no destructivo para `unsupported-command`, `precondition-failed`, `validation-failed` y `VALIDATION_INTERNAL_ERROR`; verificar kind, codigo publico, diagnosticos y referencias requeridos, retencion tras rechazo, limpieza solo tras exito/restauracion/dismiss, texto seguro y anuncio sin robo de foco.
- [x] 4.4 Implementar controles visibles Undo/Redo conectados una vez a la API publica del bus; verificar disponibilidad exclusiva mediante `canUndo`/`canRedo`, reproyeccion de snapshots, invalidacion de Redo tras una nueva edicion y ausencia de cambios al activar un control deshabilitado.

## 5. Relaciones, integracion y cierre

- [x] 5.1 Implementar arrastre por puntero con preview transitorio y una sola emision `MoveNode` al finalizar, mas alternativa de teclado con el mismo espacio SVG y coordenadas finitas; verificar que el movimiento de fallback materializa layout solo mediante el bus, un rechazo elimina el preview y ambas vias tienen paridad observable.
- [x] 5.2 Completar pruebas Vitest/Testing Library en `apps/web` para ciclo autorizado, toolbox, inspector, proyeccion, seleccion, feedback, historial, movimiento y accesibilidad; verificar nombres accesibles, foco visible, seleccion por teclado y region `aria-live`, preservando la regresion de autorizacion/logout existente.
- [x] 5.3 Ejecutar la verificacion manual de navegador para arrastre nativo, movimiento por teclado, restauracion Undo/Redo, relaciones exclusivamente visuales y shell responsive a 320 CSS px; verificar que cada resultado coincide con la proyeccion confirmada por el bus.
- [x] 5.4 Confirmar mediante revision de alcance y pruebas que no se incorpora persistence, DB storage, autosave, reopening, realtime/collaboration, XMI, generation, AI, React Flow/D3/ELK/Redux/Zustand, auto-layout avanzado, multiselection, copy/paste, advanced shortcuts, history persisted; verificar tambien que CU-2.1 y CU-2.2 permanecen protegidos y solo evoluciona MoveNode.
