# CU-2 â€” Modelar diagramas UML manualmente

## Estado y trazabilidad

- **Estado del CU: Planificado; implementaciÃ³n no iniciada.**
- Dependencias: CU-0 terminado y CU-1 terminado/archivado.
- Actor principal: modelador autenticado.
- Origen histÃ³rico: CUs anteriores 1â€“5, reagrupados en el plan 12/3.
- Incremento activo: **CU-2.1 â€” Modelo y validaciÃ³n**.
- Cambio OpenSpec activo: `cu-2-1-modelo-validacion`.
- CU-2.2 â€” Comandos e historial: pendiente.
- CU-2.3 â€” Workspace visual: pendiente.

La existencia de proposal/spec/design/tasks para CU-2.1 constituye planificaciÃ³n y no autorizaciÃ³n de implementaciÃ³n. El cÃ³digo comienza solo despuÃ©s de aprobaciÃ³n explÃ­cita.

## Objetivo y resultado usable

CU-2 debe convertir la sesiÃ³n autenticada de CU-1 en un editor manual de diagramas de clases basado en una Ãºnica fuente de verdad. Al cerrar el CU completo existirÃ¡n modelo canÃ³nico, validaciÃ³n, Command Bus, historial Undo/Redo y workspace D3/SVG en memoria. La persistencia y reapertura real de proyectos pertenece a CU-3.

CU-2.1 entrega Ãºnicamente el fundamento de dominio: documento canÃ³nico versionado, serializaciÃ³n, separaciÃ³n semÃ¡ntica/layout, perfil de generaciÃ³n y validaciÃ³n determinista.

## Decisiones obligatorias heredadas

- `CanonicalUmlModel` es la Ãºnica fuente de verdad semÃ¡ntica.
- `DiagramLayout` almacena solo datos visuales referenciados por ID.
- Canvas, SVG, D3 y ELK no se persisten como dominio.
- Toda mutaciÃ³n del UML pasarÃ¡ por `UmlCommandBus` desde CU-2.2.
- UML se basa en el subconjunto UML 2.5.1 aprobado.
- Metadatos de generaciÃ³n permanecen separados del UML puro.
- NingÃºn incremento de CU-2 introduce persistencia TypeORM de proyectos, realtime, XMI, generaciÃ³n o IA.
- Acciones destructivas del editor deberÃ¡n requerir confirmaciÃ³n cuando se implementen en el workspace.

## Incrementos

| Incremento | Alcance | Estado |
|---|---|---|
| CU-2.1 | `ProjectDocument`, `CanonicalUmlModel`, `DiagramLayout`, perfil, serializaciÃ³n, IDs, fixtures y validador | Planificado |
| CU-2.2 | `UmlCommandBus`, executor, comandos manuales, revisiÃ³n local, historial mÃ¡ximo 100, Undo/Redo | Pendiente |
| CU-2.3 | Shell CASE, toolbox/inspector, D3+SVG, ELK, zoom/pan/selecciÃ³n/movimiento/relaciones, diagnÃ³sticos navegables | Pendiente |

## CU-2.1 â€” Modelo y validaciÃ³n

### Alcance funcional

El documento en memoria contiene:
- UUID y versiÃ³n de esquema;
- nombre y propietario de sesiÃ³n;
- revisiÃ³n local;
- timestamps;
- modelo UML;
- layout;
- perfil de generaciÃ³n.

El modelo UML soporta:
- paquetes;
- clases;
- atributos/propiedades;
- operaciones y parÃ¡metros;
- visibilidad;
- tipos primitivos y referencias a clasificadores;
- enumeraciones;
- asociaciones con dos extremos;
- agregaciÃ³n y composiciÃ³n mediante semÃ¡ntica del extremo;
- multiplicidades;
- generalizaciÃ³n.

El perfil de generaciÃ³n soporta, separado del UML:
- `entity`;
- `auditable`;
- `readOnly`;
- `searchable`;
- `crud`;
- `required`;
- `unique`;
- `sortable`;
- `defaultSort`.

### ValidaciÃ³n

El motor Ãºnico produce diagnÃ³sticos con:
- `severity`;
- `code`;
- mensaje;
- `path` lÃ³gico;
- `elementId` opcional.

Reglas mÃ­nimas de CU-2.1:
- IDs Ãºnicos;
- nombres requeridos no vacÃ­os;
- referencias existentes y compatibles;
- multiplicidad vÃ¡lida;
- ausencia de ciclos de paquete y generalizaciÃ³n;
- referencias de layout existentes;
- referencias del perfil existentes y compatibles;
- versiÃ³n de documento soportada.

Las polÃ­ticas `edit`, `save`, `import` y `generate` comparten reglas y cÃ³digos. CU-2.1 solo define/valida esas polÃ­ticas; no implementa guardado, XMI ni generaciÃ³n.

## Flujos esperados de CU-2.1

1. La sesiÃ³n autenticada suministra `ownerId` al crear un documento nuevo.
2. La fÃ¡brica crea documento versiÃ³n 1, revisiÃ³n 0, timestamps y colecciones vacÃ­as.
3. Fixtures o consumidores de dominio agregan estructuras UML vÃ¡lidas en pruebas.
4. El validador recorre documento, layout y perfil y devuelve diagnÃ³sticos deterministas.
5. La serializaciÃ³n y deserializaciÃ³n preservan el documento vÃ¡lido.
6. Una versiÃ³n no soportada, ID duplicado, referencia rota, ciclo o multiplicidad invÃ¡lida produce error tipado y nunca un falso vÃ¡lido.

CU-2.1 no expone todavÃ­a estas acciones como editor visual; las mutaciones pÃºblicas se diseÃ±an en CU-2.2.

## Fuera de alcance de CU-2.1

- Command Bus y comandos de ediciÃ³n.
- Undo/Redo e historial.
- Canvas, D3, SVG, ELK, Shoelace y Nanostores.
- Toolbox, inspector, menÃºs contextuales y rutas del editor.
- Guardado o reapertura en PostgreSQL.
- CRUD/ownership persistente de proyectos.
- WebSocket, colaboraciÃ³n y presencia.
- XMI.
- UML â†’ relacional y generaciÃ³n de cÃ³digo.
- IA, lenguaje natural, voz e imagen.
- Offline integral.

## Pruebas requeridas para cerrar CU-2.1

- Unitarias del documento, modelo, perfil, serializaciÃ³n y validador.
- Fixtures positivos y negativos de todo el subconjunto incorporado.
- Round-trip completo de semÃ¡ntica/layout/perfil.
- IDs duplicados, nombres, referencias, multiplicidad y ciclos.
- PolÃ­ticas de validaciÃ³n y orden estable de diagnÃ³sticos.
- `npm run lint`.
- `npm run typecheck`.
- `npm run test`.
- `npm run build`.
- ReproducciÃ³n limpia si cambia el workspace/lockfile o la receta reproducible.
- `openspec validate cu-2-1-modelo-validacion --strict`.
- `git diff --check`.
- RegresiÃ³n de CU-0/CU-1 sin cambiar sus contratos.

No se requiere E2E de navegador en CU-2.1 porque todavÃ­a no existe UI UML; el E2E manual de diagramaciÃ³n corresponde al cierre de CU-2.3.

## DocumentaciÃ³n a mantener

- este documento;
- `docs/STATUS.md`;
- `docs/PROJECT_CONTEXT.md`;
- arquitectura/desarrollo si cambia un contrato o comando pÃºblico;
- OpenSpec del incremento;
- plan maestro si cambia alcance aprobado, nunca para ocultar una desviaciÃ³n.

## Comandos finales de commit y push

Pendientes hasta implementar, verificar y cerrar CU-2.1. El parche de planificaciÃ³n no ejecuta `git add`, `git commit` ni `git push`.