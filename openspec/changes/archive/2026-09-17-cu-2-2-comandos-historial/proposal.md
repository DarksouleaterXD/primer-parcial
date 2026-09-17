## Why

CU-2.1 estabilizo el documento UML canonico, layout, perfil, serializacion y
validacion, pero aun no existe una ruta controlada para editarlo ni recuperar
ediciones locales. CU-2.2 incorpora comandos cerrados y un historial local sin
debilitar las referencias explicitas ni permitir eliminaciones en cascada.

## What Changes

- Corregir los envelopes de Create/Add: todo ownership o contexto es obligatorio
  y externo a `value`; `CreatePackage` usa `parentPackageId: string | null`
  (`null` para raiz), y `CreateClass` y `CreateEnumeration` usan
  `packageId: string`. Sus valores contienen solo campos intrinsecos e ID.

- Incorporar `UmlCommand` y `UmlCommandBus` como unica ruta publica de mutacion
  local, con el catalogo cerrado preexistente de exactamente 27 comandos.
- Definir payloads completos y tipados para cada creacion y actualizacion, con
  IDs provistos por quien llama, propietarios esperados y codigos publicos de
  precondicion; no habra patches genericos, parciales ni basados en rutas.
- Aplicar eliminaciones solo por rechazo: ninguna elimina dependientes ni limpia
  automaticamente layout o perfil.
- Implementar el bus base del bloque 3 con estado privado limitado a
  `currentDocument`: cada envio aceptado valida el candidato con la politica
  `edit`, incrementa una sola revision y reemplaza atomica y exclusivamente el
  documento actual.
- Ampliar solo en el bloque 4 el estado privado a
  `currentDocument`, `undoStack` y `redoStack`, con transacciones atomicas de
  snapshots completos, capacidad exacta de 100 y Undo/Redo locales. La
  superficie publica final del bus sera exclusivamente `readonly
  currentDocument`, `readonly canUndo`, `readonly canRedo`, `submit(command:
  unknown): UmlCommandResult`, `undo(): UmlHistoryResult` y `redo():
  UmlHistoryResult`; los stacks, la tupla y la capacidad permanecen privados.
- Mantener fuera de alcance canvas, UI, D3/SVG/ELK, persistencia, PostgreSQL,
  red, realtime, XMI, generacion, IA y cualquier efecto externo.

## Capabilities

The payload decision is normative: every `Create*` and `Add*` uses the closed
nested envelope `{kind, <parent/context IDs>, value: CompleteValue}`. Context
is required externally, including `CreatePackage.parentPackageId: string | null`
(`null` only for a root package), `CreateClass.packageId: string`, and
`CreateEnumeration.packageId: string`; their values contain only intrinsic
fields and the stable caller-supplied ID. No ownership is duplicated in `value`.
Legacy embedded context, absent external context, flat, extra, or unknown shapes
are rejected at runtime. The executor combines envelope context only internally.
There are no `Partial`, spreads, maps, paths, or executor-generated IDs,
timestamps, or random values. `DUPLICATE_NAME` has only the exact scopes defined
by the capability; generalization duplicate structure continues to use its
existing appropriate code, not a name namespace.

### New Capabilities
- `uml-command-history`: limite local de comandos UML cerrados y atomicos sobre
  `ProjectDocument`, seguido por historial reversible en memoria en el bloque
  4. Sus resultados publicos de navegacion son exactamente `UmlHistoryResult =
  {kind:'restored'; operation:'undo'|'redo'; document:ProjectDocument} |
  {kind:'unavailable'; operation:'undo'|'redo'}`; nunca son `null`,
  `undefined`, una excepcion ni una alternativa de resultado.

### Modified Capabilities
- Ninguna.

## Impact

- Afecta solo el futuro paquete portable `@primer-parcial/uml-domain` y sus
  pruebas mediante contratos de comandos, bus e historial sobre `ProjectDocument`.
- Conserva como fuentes semanticas `CanonicalUmlModel`, `DiagramLayout`, perfil
  de generacion, tipos, serializacion y validador determinista de CU-2.1. Los
  controles tempranos no los sustituyen y el candidato sigue validandose una
  sola vez con la politica `edit`.
- No agrega APIs, base de datos, dependencias, UI ni cambios documentales fuera
  del cierre real del CU. Se sustenta en los documentos del CU-2, arquitectura,
  ADR-0001 y estado del proyecto.
