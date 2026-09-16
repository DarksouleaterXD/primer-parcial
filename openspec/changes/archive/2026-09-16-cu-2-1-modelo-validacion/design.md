## Context

CU-0 y CU-1 ya estÃ¡n cerrados: existe un monorepo npm reproducible con Astro/Preact, NestJS/PostgreSQL, contratos compartidos y autenticaciÃ³n JWT. El producto y `AGENTS.md` fijan una frontera arquitectÃ³nica mÃ¡s importante para CU-2: el canvas nunca puede ser fuente de verdad, toda entrada futura debe converger en `CanonicalUmlModel`, el layout visual debe permanecer separado y todas las mutaciones posteriores pasarÃ¡n por `UmlCommandBus`.

El plan maestro divide CU-2 en tres incrementos. Este cambio cubre solo **CU-2.1 â€” Modelo y validaciÃ³n**. No crea canvas, Command Bus, Undo/Redo, persistencia de proyectos, realtime, XMI, generaciÃ³n ni IA.

## Goals / Non-Goals

**Goals:**

- Crear un dominio UML portable y serializable que no dependa de frameworks ni infraestructura.
- Definir `ProjectDocument`, `CanonicalUmlModel`, `DiagramLayout` y perfil de generaciÃ³n con IDs estables y esquema versionado.
- Cubrir el subconjunto UML 2.5.1 aprobado para clases, miembros, enums, paquetes y relaciones.
- Implementar validaciÃ³n determinista con diagnÃ³sticos estables y polÃ­ticas reutilizables.
- Dejar pruebas suficientes para que CU-2.2 y CU-2.3 consuman el dominio sin redefinirlo.

**Non-Goals:**

- No implementar `UmlCommandBus`, comandos, historial, Undo/Redo ni mutaciones de editor; pertenecen a CU-2.2.
- No instalar ni usar D3, ELK, Shoelace o Nanostores; pertenecen al workspace de CU-2.3.
- No crear rutas/pÃ¡ginas de editor, canvas, inspector ni toolbox.
- No persistir proyectos ni UML en PostgreSQL; CU-3 serÃ¡ responsable de ownership persistente, guardado y reapertura.
- No crear WebSocket/realtime, XMI, generadores, Ollama, voz, visiÃ³n ni offline integral.
- No modificar autenticaciÃ³n, health ni contratos HTTP existentes salvo una regresiÃ³n necesaria y documentada.

## Decisions

### Un paquete `@primer-parcial/uml-domain` contiene el dominio portable

Se aÃ±adirÃ¡ `packages/uml-domain` como workspace con TypeScript y pruebas unitarias. El paquete no importarÃ¡ Astro, Preact, NestJS, TypeORM, D3, ELK, WebSocket ni implementaciones de IA. Tampoco dependerÃ¡ de `@primer-parcial/contracts`, porque los DTO HTTP y el dominio UML tienen ciclos de vida distintos.

El paquete podrÃ¡ usar APIs estÃ¡ndar disponibles en Node 24 y navegadores modernos para UUID, o aceptar una fÃ¡brica de IDs inyectable en tests. No se aÃ±adirÃ¡ una librerÃ­a de UUID si `crypto.randomUUID()` cubre el requisito.

Se descarta ubicar el modelo dentro de `apps/web` porque convertirÃ­a la proyecciÃ³n visual en propietaria del dominio. TambiÃ©n se descarta ubicarlo en `apps/api` porque CU-2 funciona en memoria y el mismo modelo debe ser consumible por frontend, importadores y generadores futuros.

### `ProjectDocument` agrega semÃ¡ntica, layout y perfil sin mezclarlos

La forma propuesta es conceptualmente:

```text
ProjectDocument
â”œâ”€â”€ schemaVersion
â”œâ”€â”€ id
â”œâ”€â”€ name
â”œâ”€â”€ ownerId
â”œâ”€â”€ revision
â”œâ”€â”€ createdAt
â”œâ”€â”€ updatedAt
â”œâ”€â”€ uml: CanonicalUmlModel
â”œâ”€â”€ layout: DiagramLayout
â””â”€â”€ generationProfile
```

`schemaVersion` inicia en `1`. `revision` es entero no negativo e inicia en `0`; su incremento por comandos se implementarÃ¡ en CU-2.2. Timestamps se representan como strings ISO-8601 para serializaciÃ³n estable. `ownerId` identifica la cuenta autenticada creada en CU-1, pero CU-2.1 no consulta ni persiste usuarios.

`CanonicalUmlModel` usa arrays y objetos JSON simples para facilitar round-trip y diff; no expone `Map`, clases de D3 ni estructuras que requieran serializadores especiales. `DiagramLayout` guarda Ãºnicamente entradas por `elementId` con coordenadas `x/y` y queda preparado para ampliaciones compatibles. SelecciÃ³n, hover, viewport y handles son estado efÃ­mero de UI y no entran al documento canÃ³nico en este incremento.

Se descarta persistir dimensiones calculadas por D3/ELK como semÃ¡ntica. Si CU-2.3 necesita dimensiones visuales estables, deberÃ¡ actualizar el cambio correspondiente antes de aÃ±adirlas.

### IDs son identidad; nombres nunca resuelven referencias

Todo paquete, clasificador, miembro y relaciÃ³n tiene un ID estable. Las referencias usan IDs explÃ­citos. Los nombres son editables y pueden repetirse en espacios permitidos sin romper relaciones. Las fÃ¡bricas generan UUID y permiten inyectar IDs/clock en tests para fixtures deterministas.

Los elementos UML principales son:
- `UmlPackage`, con `parentPackageId` opcional;
- `UmlClass`, con `packageId` opcional, atributos y operaciones;
- `UmlEnumeration`, con `packageId` opcional y literales;
- atributos/propiedades con visibilidad, tipo y multiplicidad;
- operaciones con visibilidad, parÃ¡metros y tipo de retorno opcional;
- asociaciones con dos extremos;
- generalizaciones entre clasificadores compatibles.

Los tipos se expresan con una uniÃ³n cerrada: primitivo soportado o referencia a clasificador por ID. El conjunto primitivo inicial se limita a valores necesarios y portables (`string`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `uuid`) y podrÃ¡ ampliarse mediante un cambio aprobado si un CU posterior demuestra necesidad.

### AsociaciÃ³n modela agregaciÃ³n y composiciÃ³n en sus extremos

No se crean tres estructuras incompatibles para asociaciÃ³n/agregaciÃ³n/composiciÃ³n. Una asociaciÃ³n tiene exactamente dos extremos y cada extremo puede declarar `aggregation: none | shared | composite`, rol opcional y multiplicidad. AsÃ­ se preserva la semÃ¡ntica UML de extremo y CU-2.3 puede renderizar diamante vacÃ­o/lleno sin alterar el dominio.

El validador rechaza extremos que no apunten a clasificadores existentes, asociaciones que no tengan exactamente dos extremos y configuraciones estructuralmente imposibles. La polÃ­tica inicial tambiÃ©n rechaza mÃ¡s de un extremo `composite` en la misma asociaciÃ³n para mantener una representaciÃ³n inequÃ­voca en el subconjunto del producto.

GeneralizaciÃ³n se representa por separado con `specificId` y `generalId`. Se rechazan autorreferencias y ciclos.

### El perfil de generaciÃ³n es un agregado paralelo

Los metadatos `entity`, `auditable`, `readOnly`, `searchable` y `crud` se asocian a clases por ID. `required`, `unique` y `sortable` se asocian a atributos por ID. `defaultSort` identifica clase, atributo y direcciÃ³n. NingÃºn flag se guarda dentro de `UmlClass` o `UmlAttribute`.

CU-2.1 valida Ãºnicamente forma y referencias del perfil. No traduce todavÃ­a esos metadatos a SQL, REST, UI o reglas de persistencia; esa transformaciÃ³n pertenece a CU-6/CU-7.

### La serializaciÃ³n es explÃ­cita y versionada

El paquete expondrÃ¡ funciones equivalentes a `serializeProjectDocument` y `parseProjectDocument`. La salida serÃ¡ JSON UTF-8 estable a nivel de estructura, sin depender del orden accidental de objetos internos. El parser verifica forma mÃ­nima, versiÃ³n y luego ejecuta el validador; una versiÃ³n desconocida devuelve un error tipado `DOCUMENT_VERSION_UNSUPPORTED`.

No se introduce un sistema de migraciones de documentos en CU-2.1. Cuando exista una segunda versiÃ³n, el cambio que la introduzca deberÃ¡ aÃ±adir migraciÃ³n explÃ­cita y fixtures de compatibilidad.

### Un solo validador produce diagnÃ³sticos; las polÃ­ticas deciden bloqueo

El motor recibe un `ProjectDocument` y devuelve una colecciÃ³n determinista de diagnÃ³sticos ordenados por `path` y `code`. Cada diagnÃ³stico incluye:
- `severity: error | warning`;
- `code`;
- mensaje pÃºblico tÃ©cnico;
- `path` lÃ³gico reproducible;
- `elementId` cuando corresponda.

CÃ³digos mÃ­nimos:
- `DOCUMENT_VERSION_UNSUPPORTED`;
- `UML_ID_DUPLICATE`;
- `UML_NAME_REQUIRED`;
- `UML_REFERENCE_MISSING`;
- `UML_MULTIPLICITY_INVALID`;
- `UML_PACKAGE_CYCLE`;
- `UML_GENERALIZATION_CYCLE`;
- `LAYOUT_REFERENCE_MISSING`;
- `PROFILE_REFERENCE_MISSING`.

Las polÃ­ticas `edit`, `save`, `import` y `generate` reutilizan esos mismos diagnÃ³sticos. En CU-2.1 solo se prueba la selecciÃ³n de polÃ­tica y su decisiÃ³n de bloqueo; no se implementan los consumidores futuros. Un error interno del motor se representa como fallo de validaciÃ³n y nunca como â€œvÃ¡lidoâ€.

Se descarta duplicar validadores por UI/API/importador porque permitirÃ­a divergencias de semÃ¡ntica.

### Las pruebas fijan fixtures antes de que exista el canvas

Se crearÃ¡n fixtures deterministas que cubran:
- documento vacÃ­o;
- clases, atributos, operaciones y parÃ¡metros;
- enum y paquete;
- asociaciÃ³n simple, shared y composite;
- generalizaciÃ³n;
- multiplicidades `1`, `0..1`, `1..*`, `0..*`;
- perfil de generaciÃ³n;
- layout.

Las pruebas verifican round-trip, referencias, duplicados, nombres, multiplicidades, ciclos, referencias de layout/perfil y polÃ­ticas. Ninguna prueba requiere PostgreSQL, API, navegador o Internet. Los checks raÃ­z deben seguir incluyendo regresiÃ³n de CU-0/CU-1.

## Risks / Trade-offs

- [El subconjunto UML puede quedar demasiado rÃ­gido] â†’ Se usa un esquema versionado y uniones cerradas; ampliar exige cambio explÃ­cito en vez de aceptar formas ambiguas.
- [Arrays pueden requerir bÃºsquedas lineales] â†’ El tamaÃ±o del MVP es pequeÃ±o y la serializaciÃ³n simple pesa mÃ¡s en CU-2.1; CU-2.2 puede construir Ã­ndices efÃ­meros sin cambiar el documento.
- [El perfil de generaciÃ³n podrÃ­a divergir del UML] â†’ Referencias por ID y validaciÃ³n comÃºn detectan huÃ©rfanos; no se duplica semÃ¡ntica dentro del perfil.
- [El layout puede acumular entradas huÃ©rfanas] â†’ El validador las reporta y CU-2.2 deberÃ¡ definir la limpieza atÃ³mica al eliminar elementos.
- [Definir polÃ­ticas futuras podrÃ­a parecer implementaciÃ³n anticipada] â†’ Solo se fijan nombres y comportamiento de bloqueo requeridos expresamente por el plan de CU-2; no se crean importadores, persistencia ni generadores.
- [Owner existe antes de CU-3] â†’ Es metadato del documento en memoria ligado a la sesiÃ³n CU-1; ownership persistente y autorizaciÃ³n de proyectos siguen fuera de alcance.

## Migration Plan

1. AÃ±adir el workspace `packages/uml-domain` sin dependencias de infraestructura.
2. Implementar contratos, fÃ¡bricas y fixtures con `schemaVersion: 1`.
3. Implementar serializaciÃ³n/parser y motor de validaciÃ³n con diagnÃ³sticos deterministas.
4. Integrar los scripts raÃ­z si el patrÃ³n de workspaces existente no recoge automÃ¡ticamente el nuevo paquete.
5. Ejecutar tests del paquete, lint, typecheck, tests raÃ­z y build; no requiere migraciÃ³n PostgreSQL.
6. Actualizar documentaciÃ³n con evidencia real y solo entonces cerrar CU-2.1.

No existe migraciÃ³n de datos ni rollback de base de datos en este incremento. El rollback consiste en revertir el paquete y la documentaciÃ³n en un cambio posterior; no se tocan usuarios, tablas ni volÃºmenes.
### El parser valida recursivamente el contrato cerrado en runtime

La verificacion final de CU-2.1 detecto que el chequeo minimo del parser no garantizaba el contrato cerrado definido por el spec. La remediacion incorpora una inspeccion runtime recursiva antes de devolver un `ProjectDocument`: discriminantes, enums, UUID, timestamps ISO, primitivas, multiplicidades estructurales, asociaciones de dos extremos, coordenadas finitas, flags booleanos, direccion de sort y propiedades permitidas.

El mismo chequeo se ejecuta al inicio del validador. Una forma runtime invalida produce `DOCUMENT_STRUCTURE_INVALID` con `severity`, `path` y `elementId` cuando aplica, y bloquea incluso la politica `edit`. Tras superar la forma cerrada, el parser ejecuta la validacion semantica y no devuelve documentos con errores bloqueantes.

Esta correccion no cambia el subconjunto UML ni introduce dependencias nuevas; implementa de forma completa los requisitos ya aprobados de contratos cerrados y parsing sin documentos parciales.
