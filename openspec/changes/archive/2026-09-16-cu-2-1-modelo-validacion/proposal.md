## Why

CU-0 dejÃ³ una base ejecutable reproducible y CU-1 dejÃ³ una sesiÃ³n autenticada mÃ­nima. El siguiente fundamento tÃ©cnico obligatorio del producto es estabilizar el documento UML canÃ³nico antes de introducir canvas, persistencia de proyectos, colaboraciÃ³n, XMI, generaciÃ³n o asistentes. CU-2.1 crea ese nÃºcleo semÃ¡ntico y su validaciÃ³n en memoria para que todas las entradas y salidas posteriores compartan la misma fuente de verdad.

Este cambio corresponde exclusivamente a **CU-2.1 â€” Modelo y validaciÃ³n** del plan maestro. La implementaciÃ³n no estÃ¡ autorizada por la mera existencia de estos artefactos; requiere aprobaciÃ³n explÃ­cita posterior.

## What Changes

- Crear un paquete de dominio compartido e independiente de Astro, Preact, NestJS, TypeORM, D3, ELK, WebSocket e IA para alojar `CanonicalUmlModel`, `ProjectDocument`, `DiagramLayout`, perfil de generaciÃ³n, fÃ¡bricas, serializaciÃ³n y validaciÃ³n.
- Definir un `ProjectDocument` versionado y serializable con UUID, nombre, propietario autenticado, revisiÃ³n local, timestamps, modelo UML, layout y perfil de generaciÃ³n separado.
- Separar estrictamente semÃ¡ntica UML de layout: posiciones visuales se referencian por IDs estables y no forman parte de las entidades UML.
- Soportar el subconjunto aprobado de UML 2.5.1 para CU-2.1: paquetes, clases, atributos/propiedades, operaciones y parÃ¡metros, visibilidad, tipos, enumeraciones, asociaciones con extremos y multiplicidades, agregaciÃ³n/composiciÃ³n y generalizaciÃ³n.
- Definir tipos de datos y referencias de tipo explÃ­citas, multiplicidades cerradas y relaciones referenciales verificables.
- Mantener los metadatos de generaciÃ³n fuera del UML puro: `entity`, `auditable`, `readOnly`, `searchable`, `crud`, `required`, `unique`, `sortable` y `defaultSort`.
- Implementar un Ãºnico motor determinista de validaciÃ³n con diagnÃ³sticos estables: `severity`, `code`, mensaje, `path` lÃ³gico y `elementId` opcional.
- Definir polÃ­ticas de validaciÃ³n reutilizables para ediciÃ³n, guardado, importaciÃ³n y generaciÃ³n sin implementar todavÃ­a esos consumidores.
- Probar round-trip de serializaciÃ³n, invariantes, IDs, referencias, multiplicidades, generalizaciÃ³n, paquetes, layout y perfil.
- Actualizar la documentaciÃ³n de CU-2, STATUS, contexto de continuidad y configuraciÃ³n OpenSpec para reflejar que CU-1 estÃ¡ archivado y CU-2.1 queda planificado.

## Capabilities

### New Capabilities

- `uml-domain-validation`: Documento UML canÃ³nico versionado, serializable, separado del layout y del perfil de generaciÃ³n, con validaciÃ³n determinista y diagnÃ³sticos estables.

### Modified Capabilities

- Ninguna. Cuenta/sesiÃ³n, health y base ejecutable conservan su comportamiento.

## Impact

- Nuevo paquete compartido propuesto: `packages/uml-domain`.
- Sin cambios de base de datos, API HTTP, migraciones, canvas o rutas web en CU-2.1.
- Pruebas unitarias del nuevo dominio y actualizaciÃ³n de scripts raÃ­z solo si el nuevo workspace requiere ser incluido por los scripts existentes.
- DocumentaciÃ³n: `docs/puds/use-cases/CU-2-modelado-uml-manual.md`, `docs/STATUS.md`, `docs/PROJECT_CONTEXT.md`, plan maestro y `openspec/config.yaml`.
- CU-2.2 consumirÃ¡ este dominio mediante `UmlCommandBus`; CU-2.3 proyectarÃ¡ el documento al workspace D3/SVG. Esos incrementos permanecen fuera de este cambio.