# Plan maestro PUDS â€” Primer Parcial

Planificacion definitiva: **12 casos de uso en 3 ciclos**, con uno a tres incrementos por CU. Define cobertura futura; el avance real esta en [STATUS](../../STATUS.md). CU-0 y CU-1 estan terminados y archivados; CU-2.1 conserva su evidencia vigente. CU-2.2 está implementado con 19/20 tareas y pendiente de verificación final; CU-2.3 no está iniciado.

El proceso es dirigido por casos de uso, centrado en arquitectura, iterativo e incremental. Cada CU se prueba, documenta y cierra antes del siguiente; una excepciÃ³n requiere aprobaciÃ³n trazable. La reagrupaciÃ³n no adelanta canvas, realtime, generaciÃ³n o IA respecto del modelo canÃ³nico, validador y Command Bus.

## Fuentes, actores y convenciones

- [Producto aprobado](../../product/product-05-astro-nestjs.md): visiÃ³n estable.
- [ADR-0001](../../decisions/ADR-0001-initial-technical-boundaries.md): precisiones aprobadas que resuelven las contradicciones de la variante.
- [Plan anterior Ã­ntegro](history/initial-30-use-cases.md): registro histÃ³rico de los 30 IDs, conservado para auditar esta reorganizaciÃ³n. Sus ciclos y documentos propuestos no son el plan vigente.
- [Benchmarks](../../benchmarks/external-services.md): puertas obligatorias con resultados todavÃ­a no ejecutados.

| Actor | Responsabilidad |
|---|---|
| Equipo de desarrollo | Preparar, verificar y documentar la soluciÃ³n |
| Visitante | Conocer el producto, registrarse e iniciar sesiÃ³n |
| Modelador | Editar, validar, guardar, importar y generar desde UML |
| Propietario | Administrar sus proyectos y autorizar acceso MVP |
| Colaborador autorizado | Participar en una sesiÃ³n realtime permitida |
| Usuario de aplicaciÃ³n generada | Operar CRUD y asistentes de texto/voz |
| Sistema anfitriÃ³n | Ejecutar API, PostgreSQL, generaciÃ³n, realtime, IA y STT local/LAN |
| Enterprise Architect | Intercambiar XMI 2.1 |
| Docente/evaluador | Reproducir la demostraciÃ³n y revisar evidencia |

Los nuevos IDs van de CU-0 a CU-11. No se renumera un CU cerrado: esta migraciÃ³n reorganiza planificaciÃ³n sin implementaciÃ³n. Cada documento individual vive en `docs/puds/use-cases/CU-X-nombre.md`. Los incrementos pertenecen al mismo objetivo, no son CUs ocultos.

Estados: `Pendiente`, `Planificado`, `En implementaciÃ³n`, `En validaciÃ³n`, `Bloqueado`, `Terminado`. Prueba automÃ¡tica puede ser unitaria, integraciÃ³n, contrato, compilaciÃ³n o E2E; prueba manual exige pasos y evidencia humana. Todos los CUs actualizan su documento, STATUS y fuentes afectadas.

## Mapa de entrega

| Ciclo | Fase PUDS predominante | Casos | Incremento usable al cerrar |
|---|---|---|---|
| 1. Editor UML con proyectos privados | Inicio / ElaboraciÃ³n / ConstrucciÃ³n | CU-0 a CU-3 | Cuenta y editor manual con validaciÃ³n, Undo/Redo, ownership y proyectos que se guardan y reabren |
| 2. ColaboraciÃ³n, interoperabilidad y generaciÃ³n | ConstrucciÃ³n | CU-4 a CU-7 | Dos clientes LAN, presencia, XMI y aplicaciÃ³n Spring + web/PWA/Android generada y ejecutable |
| 3. Inteligencia, visiÃ³n y cierre offline | ConstrucciÃ³n / TransiciÃ³n | CU-8 a CU-11 | Texto, voz e imagen validados y demostraciÃ³n integral preparada sin Internet |

# Ciclo 1 â€” Editor UML con proyectos privados

Objetivo: convertir la base ejecutable en una herramienta privada de diagramaciÃ³n y persistencia. Entrega usable: registro/login, editor CASE, diagnÃ³sticos, Undo/Redo y conservaciÃ³n real del modelo y layout entre sesiones.

## CU-0 â€” Inicializar la base ejecutable del proyecto

**Actor:** equipo de desarrollo. **Dependencias:** ninguna. **Origen:** anterior 0.
**Resultado:** monorepositorio reproducible con web Astro/Preact, API NestJS/PostgreSQL, health y comunicaciÃ³n real comprobada al cerrar el CU.

### Incrementos

1. **CU-0.1 â€” Repositorio, configuraciÃ³n y documentaciÃ³n inicial:** identidad Primer Parcial / `primer-parcial`, npm workspaces, Node 24, entorno Windows/PowerShell, Compose local, ADR, permisos OpenCode y planificaciÃ³n 12/3. Sin aplicaciones, dependencias ni lockfile.
2. **CU-0.2 â€” Aplicaciones y servicios conectados:** inicializar `apps/web` y `apps/api`, instalar dependencias y generar lockfile; TypeORM/PostgreSQL, health, contrato inicial `@nestjs/swagger`, URL/CORS por entorno y pantalla que consume el estado real de API.
3. **CU-0.3 â€” Calidad, reproducibilidad y cierre:** checks, smoke, CI, pruebas manuales, build por usuario/CI, guÃ­as de instalaciÃ³n/arranque, evidencia y cierre.

### Flujo, alternativas y errores

El desarrollador obtiene el repositorio local, verifica versiones, configura entorno y, desde CU-0.2, instala e inicia PostgreSQL, API y web. Consulta health y observa la comunicaciÃ³n desde navegador. Herramienta ausente requiere recuperaciÃ³n documentada; PostgreSQL caÃ­do se informa sin credenciales; URL/CORS incorrectos producen error recuperable, nunca un falso saludable. GitHub solo se requiere al crear/publicar el remoto.

### AceptaciÃ³n y pruebas

- CU-0.1: JSON/Markdown coherentes, 12 CUs/3 ciclos, trazabilidad completa, benchmarks remapeados, Compose validado sin motor, diff limpio y ausencia de secretos, lockfile y aplicaciones prematuras.
- Cierre CU-0: clonado limpio reproducible, versiones compatibles con Node 24/NestJS 11, health estable y distinciÃ³n vida/dependencias cuando se implemente readiness; estado web real, contrato principal publicado y actualizado con nuevas rutas.
- Unitarias/smoke, lint, tipos, build y CI verdes al cierre; navegador con URL/resultado documentados. Build pendiente de CU-0.3, no aplicable a CU-0.1.

**DocumentaciÃ³n:** [CU-0-inicializar-base.md](CU-0-inicializar-base.md), README raÃ­z, arquitectura, desarrollo, entorno, ADR y STATUS. Auth, UML y CRUD quedan fuera de CU-0.

## CU-1 â€” Gestionar cuenta y sesiÃ³n

**Actor:** visitante. **Dependencia:** CU-0. **Origen:** anterior 6.
**Resultado:** landing, registro, login, JWT, logout y rutas protegidas.

### Incrementos

1. Persistencia/migraciÃ³n de usuario, auditorÃ­a TypeORM, bcrypt, Passport/JWT, validaciÃ³n Zod y errores seguros.
2. Landing y pantallas de autenticaciÃ³n CASE, manejo de sesiÃ³n, rutas protegidas y accesibilidad responsive.

### Flujo, alternativas y errores

El visitante registra credenciales vÃ¡lidas, inicia sesiÃ³n y accede al Ã¡rea privada; puede cerrar sesiÃ³n. El Ã¡rea de proyectos se integra funcionalmente en CU-3. Duplicados, credenciales incorrectas, payload invÃ¡lido y token vencido reciben respuestas uniformes sin enumeraciÃ³n sensible.

### AceptaciÃ³n y pruebas

- ContraseÃ±as nunca almacenadas ni registradas en texto plano; secretos por entorno.
- Unitarias/integraciÃ³n y E2E de registro, login, logout, expiraciÃ³n y acceso anÃ³nimo.
- RevisiÃ³n manual accesible/responsive e identidad visual de landing y paneles de auth.

**DocumentaciÃ³n:** [CU-1-cuenta-sesion.md](CU-1-cuenta-sesion.md), modelo de amenazas mÃ­nimo, esquema/migraciones de usuario y guÃ­a de variables. CU-1 estÃ¡ terminado y archivado.

## CU-2 â€” Modelar diagramas UML manualmente

**Actor:** modelador; validador compartido con todos los adaptadores. **Dependencia:** CU-1; fundamento ejecutable CU-0. **Origen:** anteriores 1â€“5.
**Resultado:** documento canÃ³nico serializable y editor manual en memoria, sin persistencia ni colaboraciÃ³n aÃºn.

### Incrementos

1. **Modelo y validaciÃ³n:** `CanonicalUmlModel`, `ProjectDocument`, `DiagramLayout`, fÃ¡bricas, IDs, UUID/metadatos/revisiÃ³n/timestamps y serializaciÃ³n versionada. UML 2.5.1: clases, atributos/propiedades, operaciones, visibilidad, tipos, enums, paquetes, asociaciones/agregaciÃ³n/composiciÃ³n/generalizaciÃ³n, extremos y multiplicidades. Perfil de generaciÃ³n separado de UML: `entity`, `auditable`, `readOnly`, `searchable`, `crud`, `required`, `unique`, `sortable`, `defaultSort`. Motor Ãºnico y diagnÃ³stico con severity, code, mensaje, path lÃ³gico y elemento; reglas/polÃ­ticas de ediciÃ³n, guardado, importaciÃ³n y generaciÃ³n.
2. **Comandos e historial:** contratos desacoplados del transporte, `UmlCommandBus`/executor para clases, atributos, enums, relaciones, multiplicidades, herencia, movimiento y metadatos. Implementado con snapshots privados y límite exacto de 100; la verificación final permanece pendiente.
3. **Workspace:** shell CASE, grid, nodos custom D3/SVG, zoom/pan/selecciÃ³n/ajuste a contenido, auto-layout ELK; toolbox e inspector de clases, atributos, operaciones, enums y perfil. Relaciones UML, multiplicidades, handles, `MoveNode`, diagnÃ³sticos navegables, menÃºs contextuales y Undo/Redo visible.

### Flujo, alternativas y errores

Se crea documento vacÃ­o, se valida y serializa. La UI/adaptador emite comandos; el bus valida forma/precondiciones, executor calcula resultado y validador acepta o devuelve error tipado sin mutaciÃ³n parcial. El canvas proyecta el documento aceptado; nunca se persisten objetos grÃ¡ficos como dominio. La consola tÃ©cnica enfoca elementos con diagnÃ³stico.

IDs duplicados, referencias rotas, colisiones, elementos inexistentes o mezcla visual/semÃ¡ntica se rechazan. Fallo interno del validador no equivale a validez. Advertencias no bloquean por defecto; errores bloquean por contexto. Undo/Redo restaura semÃ¡ntica, layout y revisiÃ³n local definida; una nueva ediciÃ³n invalida redo, comandos rechazados y presencia no ingresan al historial, exceso de capacidad descarta historia segÃºn polÃ­tica.

### AceptaciÃ³n y pruebas

- Dominio sin dependencias UI/NestJS/TypeORM/IA; round-trip preserva semÃ¡ntica/layout. Fixtures de todo el subconjunto y perfil; invariantes, IDs, multiplicidad y versionado.
- Mismo validador para consumidores, cÃ³digos estables y tabla de reglas positivas/negativas; navegaciÃ³n por elemento.
- Ninguna mutaciÃ³n pÃºblica evita el bus; pruebas de Ã©xito, precondiciÃ³n, colisiÃ³n, inexistente, referencia rota y atomicidad. Contratos reutilizables en realtime/IA.
- Historial vacÃ­o, 100+, secuencias mixtas, fallo y restauraciÃ³n exacta probados.
- Identidad CASE clara y responsive segÃºn producto; etiquetas, multiplicidades y relaciones legibles. Unit/component de adaptadores/inspector; Playwright de diagramaciÃ³n, validaciÃ³n y Undo/Redo. Manual de accesibilidad, tablet y mÃ³vil de revisiÃ³n.

**DocumentaciÃ³n:** [CU-2-modelado-uml-manual.md](CU-2-modelado-uml-manual.md), dominio/formato, perfil, catÃ¡logo de diagnÃ³sticos y comandos, estrategia de historial, guÃ­a UI y capturas autorizadas; deuda visual explÃ­cita sin falsear aceptaciÃ³n funcional.

## CU-3 â€” Gestionar proyectos UML persistentes

**Actor:** propietario. **Dependencias:** CU-1 y CU-2. **Origen:** anteriores 7â€“8.
**Resultado:** crear/listar/abrir/renombrar/eliminar proyectos privados; guardar/reabrir semÃ¡ntica y layout con revisiÃ³n optimista.

### Incrementos

1. AdministraciÃ³n y ownership: UUID, `ownerId`, metadatos/timestamps, migraciones TypeORM y polÃ­tica de borrado.
2. Repositorio TypeORM, transacciÃ³n de `ProjectDocument` versionado, validaciÃ³n de guardado, carga y autosave/manual segÃºn plan aprobado; conflicto y recuperaciÃ³n UI.

### Flujo, alternativas y errores

El propietario ve solo sus proyectos, crea/abre/edita y guarda con `baseRevision`; servidor valida y persiste nueva revisiÃ³n. ID ajeno/inexistente no filtra existencia. Eliminar exige confirmaciÃ³n y polÃ­tica de recuperaciÃ³n/irreversibilidad. Base obsoleta rechaza guardado y permite recargar documento autoritativo sin sobrescritura silenciosa.

### AceptaciÃ³n y pruebas

- AutorizaciÃ³n filtrada en toda consulta backend; integraciÃ³n/E2E con dos usuarios comprueba aislamiento.
- Round-trip PostgreSQL real conserva modelo/layout; validaciÃ³n bloquea cuando corresponde.
- Concurrencia, rollback, versiÃ³n de formato y documento corrupto cubiertos. E2E cerrar navegador/reabrir/comprobar diagrama y revisiÃ³n manual del flujo.

**DocumentaciÃ³n:** futuro `CU-3-proyectos-persistentes.md`, esquema/migraciones, contratos/transacciones, borrado, autosave y recuperaciÃ³n.

# Ciclo 2 â€” ColaboraciÃ³n, interoperabilidad y generaciÃ³n

Objetivo: extender la herramienta privada a sesiones LAN autorizadas, intercambio UML y generaciÃ³n determinista. Entrega usable: dos clientes colaborando, presencia, XMI compatible y artefacto completo backend/web/PWA/Android reproducible.

## CU-4 â€” Colaborar en proyectos UML por LAN

**Actores:** propietario, colaborador autorizado, participantes, anfitriÃ³n y clientes LAN. **Dependencia:** CU-3 y fundamentos de CU-2. **Origen:** anteriores 9â€“11.
**Resultado:** ediciÃ³n incremental autoritativa, presencia efÃ­mera y recuperaciÃ³n de red.

### Incrementos

1. Gateway NestJS `ws`, cliente WebSocket nativo, autenticaciÃ³n/uniÃ³n al proyecto y protocolo versionado; una operaciÃ³n por intenciÃ³n con `baseRevision`, bus/validador, persistencia inmediata y broadcast. Rechazo obsoleto, idempotencia y recuperaciÃ³n autoritativa.
2. Lista de sesiones, selecciÃ³n, cursor/etiqueta, elemento en ediciÃ³n, Ãºltima actividad y log compacto; frecuencia limitada, throttling y expiraciÃ³n por timeout/desconexiÃ³n.
3. OperaciÃ³n LAN: host/puertos/firewall/origen autorizados, reconexiÃ³n, polÃ­tica de cambios no enviados y recuperaciÃ³n tras caÃ­da/reinicio del anfitriÃ³n.

### Flujo, alternativas y errores

Cliente autenticado recibe documento/revisiÃ³n inicial, envÃ­a operaciÃ³n, recibe aceptaciÃ³n/nueva revisiÃ³n; otros reciben la operaciÃ³n aceptada. No se transmite todo el documento en cada ediciÃ³n. OperaciÃ³n obsoleta, duplicada o no autorizada no causa mutaciÃ³n indebida. Ante divergencia se resincroniza; presencia excesiva se limita y nunca se guarda como proyecto. La UI informa caÃ­da, conserva pendientes segÃºn polÃ­tica y evita duplicaciÃ³n al reconectar.

### AceptaciÃ³n y pruebas

- Servidor como Ãºnica autoridad; coherencia persistencia/broadcast ante fallos; integraciÃ³n/E2E de orden, conflicto, duplicado y reconexiÃ³n con dos clientes.
- Presencia no afecta dominio, historial ni revisiÃ³n; tests de expiraciÃ³n, throttling, desconexiÃ³n y mÃºltiples pestaÃ±as, E2E visual.
- Sin Internet tras preparaciÃ³n; cortes de red, reinicio y dos dispositivos reales cuando disponibles, configuraciÃ³n segura documentada. PostgreSQL permanece en loopback: LAN expone servicios autorizados, no la BD.
- MVP validable con sesiones autorizadas del propietario. MembresÃ­as/invitaciones avanzadas (roles, expiraciÃ³n, tokens controlados) siguen como evoluciÃ³n, sin prometer acceso no autorizado ni CRDT completo.

**DocumentaciÃ³n:** futuro `CU-4-colaboracion-lan.md`, protocolo/secuencias, conflicto/idempotencia, presencia/frecuencia, guÃ­a anfitriÃ³n/cliente y matriz de fallos.

## CU-5 â€” Importar y exportar diagramas XMI

**Actores:** modelador y Enterprise Architect. **Dependencia:** CU-4 en orden de entrega; modelo/validador/bus de CU-2. **Origen:** anterior 27.
**Resultado:** intercambio XMI 2.1 del subconjunto UML soportado.

### Incrementos

1. Parser streaming `saxes`, modelo intermedio y lÃ­mites XML.
2. AdaptaciÃ³n/validaciÃ³n a canÃ³nico, preview y reporte de elementos no soportados; aplicaciÃ³n confirmada por Command Bus.
3. ExportaciÃ³n `xmlbuilder2`, round-trip semÃ¡ntico y verificaciÃ³n real con Enterprise Architect.

### Flujo, alternativas y errores

Se importa sin ejecutar entidades externas; se adapta, valida y muestra preview/diagnÃ³sticos antes de confirmar. Desconocidos se informan, no se inventan. ExportaciÃ³n parte del modelo canÃ³nico vÃ¡lido.

### AceptaciÃ³n y pruebas

- Subconjunto/limitaciones explÃ­citos; protecciÃ³n XXE, archivos enormes y referencias rotas.
- Fixtures import/export y round-trip semÃ¡ntico normalizado; manual ida/vuelta con versiÃ³n documentada de EA.

**DocumentaciÃ³n:** futuro `CU-5-interoperabilidad-xmi.md`, matriz de compatibilidad y procedimiento EA.

## CU-6 â€” Generar el backend desde UML

**Actores:** modelador, consumidor de API, usuario tÃ©cnico, generador/asistente como consumidores del manifiesto. **Dependencia:** CU-5 en orden; modelo validado de CU-2. **Origen:** anteriores 12â€“16.
**Resultado:** `RelationalModel` determinista y backend Spring compilable con CRUD, OpenAPI, Postman y Domain Manifest.

### Incrementos

1. **Mapeo y esqueleto:** preview de tablas, columnas, PK/FK, constraints/unique, Ã­ndices y relaciones. Clases/atributos/tipos/enums/IDs/nulabilidad; 1:1, 1:N, N:M, composiciÃ³n, herencia y nombres deterministas. Eta genera Java 21/Spring Boot 4.x/Gradle en directorio seguro, con build, configuraciÃ³n y paquetes.
2. **Persistencia y API:** entidades JPA/enums/repositorios, migraciÃ³n/configuraciÃ³n/constraints; servicios, DTOs/mappers, errores, Jakarta Validation/Jackson y controladores Spring Web MVC. Create/read/update/delete/list, pagination/sorting/filtering/search/count y navegaciÃ³n de relaciones por metadatos; `auditable` usa Spring Data JPA para `createdAt`/`updatedAt`.
3. **Contratos y metadatos:** `springdoc-openapi`, schemas/parÃ¡metros/errores y exportaciÃ³n OpenAPI 3.1 cuando sea compatible; Postman derivado determinÃ­sticamente con variables/tests bÃ¡sicos. Domain Manifest tipado/versionado: entidades, atributos/tipos, aliases, campos search/sort, relaciones, validaciones, capacidades CRUD, operaciones permitidas y mapeo lÃ³gico para ejecutor.

### Flujo, alternativas y errores

Modelo vÃ¡lido â†’ mapper/vista previa â†’ plantillas â†’ proyecto â†’ ejecuciÃ³n PostgreSQL/API â†’ OpenAPI â†’ Postman/manifiesto. AmbigÃ¼edad exige completar metadatos; IA nunca decide persistencia. Ruta insegura, conflicto de archivo o plantilla fallida aborta sin falso artefacto exitoso. Entrada invÃ¡lida, duplicado, referencia ausente o filtro no permitido produce error coherente. Manifiesto inconsistente se rechaza; capacidad no declarada no estÃ¡ permitida.

### AceptaciÃ³n y pruebas

- Mismo modelo/configuraciÃ³n da salida equivalente; reglas/precedencias y fixtures por cardinalidad. Colisiones de nombres, ciclos, IDs faltantes y tipos no soportados probados.
- Eta/helpers/entradas separados, sin concatenaciÃ³n extensa; protecciÃ³n path traversal. CompilaciÃ³n Java 21/Gradle, smoke context y tests reales del artefacto; PostgreSQL real para todas las cardinalidades.
- RegeneraciÃ³n idempotente segÃºn polÃ­tica sin pisar personalizaciones silenciosamente; se corrigen mapper/plantillas, no archivos producidos.
- OpenAPI vÃ¡lido para su versiÃ³n y cobertura runtime completa; limitaciÃ³n 3.1 comprobada se documenta/prueba. Postman importable con variables, sin hosts fijos ni secretos; contract tests runtime â†” OpenAPI â†” colecciÃ³n. Swagger Nest reservado a API principal.
- Manifiesto â†” UML â†” API trazables, sin campos internos expuestos; fixtures de aliases/permisos CRUD/search/sort/relaciones. RevisiÃ³n manual de preview, artefactos y colecciÃ³n.

**DocumentaciÃ³n:** futuro `CU-6-backend-generado.md`, especificaciÃ³n UMLâ†’relacional, estructura/toolchain Spring, capacidades/errores/regeneraciÃ³n, guÃ­a OpenAPI/Postman y esquema/versionado/derivaciÃ³n del manifiesto.

## CU-7 â€” Generar y ejecutar el frontend web y Android

**Actores:** modelador, usuario tÃ©cnico, usuario de aplicaciÃ³n generada y anfitriÃ³n. **Dependencia:** CU-6. **Origen:** anteriores 17â€“20.
**Resultado:** aplicaciÃ³n generada Astro/Preact con CRUD real, PWA/Capacitor Android y paquete exportable coherente.

### Incrementos

1. **Frontend y CRUD:** Eta genera esqueleto, cliente tipado cuando corresponda, configuraciÃ³n, navegaciÃ³n, listados/detalle/formularios por metadatos. CRUD con validaciones/confirmaciones, bÃºsqueda/filtros/sorting/paginaciÃ³n/count, select/autocomplete N:1 y listas/navegaciÃ³n 1:N.
2. **PWA y Android:** manifest/assets/service worker/polÃ­tica de cachÃ©, Astro estÃ¡tico; Capacitor, endpoint seguro y build Android reproducible.
3. **ExportaciÃ³n y ejecuciÃ³n:** backend, frontend, Android, OpenAPI, Postman y manifiesto empaquetados, README generado, checksums/metadatos de revisiÃ³n del modelo/generador/plantillas y smoke offline preparado.

### Flujo, alternativas y errores

Se genera desde contratos/manifiesto, se configura endpoint y PostgreSQL, se inicia artefacto y se opera CRUD. Inferencia: Stringâ†’input, Integer/Long/Decimalâ†’number, Booleanâ†’checkbox/switch, Dateâ†’date picker, DateTimeâ†’datetime picker, Enumâ†’select, Textâ†’textarea, N:1â†’select/autocomplete, 1:Nâ†’tabla relacionada. Tipo no soportado produce diagnÃ³stico. Loading/vacÃ­o/error/validaciÃ³n son visibles; borrado confirma; fallo de compilaciÃ³n/incompatibilidad se vincula a modelo/plantilla e impide declarar Ã©xito.

### AceptaciÃ³n y pruebas

- GeneraciÃ³n determinista, build real limpio desde directorio vacÃ­o; component tests y snapshots/fixtures semÃ¡nticos estables.
- E2E contra backend/PostgreSQL generados, relaciones consistentes; manual responsive y flujo completo en al menos dos dominios fixture.
- PWA instala/actualiza sin HTML/API obsoletos peligrosos; build Android real y smoke en emulador/dispositivo cuando disponible; funciones dependientes del anfitriÃ³n LAN explÃ­citas.
- Paquete trazable y smoke CRUD con red externa desconectada tras descargar dependencias; sin lÃ³gica empresarial inventada.

**DocumentaciÃ³n:** futuro `CU-7-frontend-web-android.md`, matriz tipoâ†’control, guÃ­a usuario/limitaciones, instalaciÃ³n PWA/Android/emulador/dispositivo, README generado y matriz de artefactos.

# Ciclo 3 â€” Inteligencia, visiÃ³n y cierre offline

Objetivo: aÃ±adir entradas probabilÃ­sticas sobre contratos y ejecutores deterministas ya estables. Entrega usable: operaciÃ³n textual y por voz en ambos contextos, imagenâ†’UML revisable y demostraciÃ³n integral sin Internet una vez preparados modelos/dependencias.

## CU-8 â€” Operar mediante lenguaje natural

**Actores:** modelador y usuario de aplicaciÃ³n generada. **Dependencia:** CU-7, bus/editor de CU-2 y API/manifiesto de CU-6. **Origen:** anteriores 21â€“24. **Puertas de cierre:** B-TXT-APP y B-TXT-UML.
**Resultado:** texto propone planes cerrados, legibles, validables y ejecutables en contexto; nunca HTTP/SQL/mutaciÃ³n directa desde texto.

### Incrementos

1. **Lenguaje/ejecuciÃ³n:** `AssistantCommand` versionado, pequeÃ±o/tipado, `LIST`, `GET`, `SEARCH`, `CREATE`, `UPDATE`, `DELETE`, `COUNT`; parser/validator, allow-lists de operaciÃ³n/entidad/campo, tipos/relaciones y confirmaciÃ³n destructiva. Executor determinista con cliente permitido y planes de mÃ¡ximo tres pasos, validaciÃ³n entre pasos.
2. **Texto en aplicaciÃ³n generada:** adaptador Ollama/Qwen3.5 0.8B, contexto limitado, prompt/config versionados, salida estructurada, timeout/cancelaciÃ³n; dataset/evaluador/baseline B-TXT-APP, iteraciÃ³n de una variable y comparaciÃ³n. Consola muestra solicitud, plan, confirmaciÃ³n, ejecuciÃ³n/resultado e historial.
3. **Texto en CASE:** intenciÃ³n UML cerrada, resolver de nombres/referencias y adaptaciÃ³n a `UmlCommand` existente; consola/preview/confirmaciÃ³n, ambigÃ¼edad, dataset/evaluador y comparaciÃ³n B-TXT-UML.

### Flujo, alternativas y errores

Texto â†’ propuesta â†’ validaciÃ³n â†’ aclaraciÃ³n/rechazo o plan â†’ confirmaciÃ³n cuando corresponde â†’ executor permitido / bus UML â†’ resultado. UML confirma antes de mutar; acciones destructivas de ambos asistentes siempre confirman. CancelaciÃ³n previa no muta. Historial visible no autoriza repeticiÃ³n automÃ¡tica. Modelo ausente, caÃ­do, timeout o respuesta invÃ¡lida dejan estado estable con recuperaciÃ³n; referencia arbitraria se rechaza. Expresiones recientes/Ãºltimos se resuelven con metadatos de auditorÃ­a, no reglas inventadas.

### AceptaciÃ³n y pruebas

- Contrato independiente de frases/URLs; cero SQL/cÃ³digo/URL arbitrarios ejecutables. Pruebas exhaustivas de allow-list, tipos, relaciones, confirmaciÃ³n, planes y fallo intermedio; auditorÃ­a sin contenido sensible.
- Ambas puertas con dataset, ejecuciÃ³n y resultados reales; unitarias con adaptador declarado simulado y smoke real Ollama. InyecciÃ³n de prompt, inexistentes, ambigÃ¼edad y servicio caÃ­do probados.
- Nunca se oculta plan mutador; E2E textoâ†’planâ†’confirmaciÃ³nâ†’APIâ†’resultado y textoâ†’planâ†’confirmaciÃ³nâ†’busâ†’canvas; rechazo/cancelaciÃ³n no mutan. IA no toca canvas/documento. Manual guiado de las consolas.

**DocumentaciÃ³n:** futuro `CU-8-lenguaje-natural.md`, esquema/semÃ¡ntica/seguridad, guÃ­as de asistentes/modelos, catÃ¡logo UML, prompts/config y benchmarks.

## CU-9 â€” Operar mediante comandos de voz

**Actores:** modelador y usuario de aplicaciÃ³n generada; anfitriÃ³n ejecuta STT por defecto. **Dependencia:** CU-8. **Origen:** anteriores 25â€“26. **Puerta:** B-STT.
**Resultado:** audio breve â†’ texto corregible â†’ los mismos planes/validadores/confirmaciones del canal texto.

### Incrementos

1. Captura/permisos/lÃ­mites/cancelaciÃ³n, adaptador anfitriÃ³n `whisper.cpp`, selecciÃ³n de modelo/parÃ¡metros mediante B-STT, estados/error/timeout y guÃ­a de micrÃ³fonos.
2. Vozâ†’`UmlCommand` en CASE con revisiÃ³n de transcripciÃ³n, plan, validaciÃ³n y confirmaciÃ³n.
3. Vozâ†’`AssistantCommand` en aplicaciÃ³n generada, integraciÃ³n y comprobaciÃ³n offline de ambos contextos.

### Flujo, alternativas y errores

Se graba, transcribe, revisa/corrige y envÃ­a al canal texto del contexto correcto; se revisa/confirma plan y ejecuta. Audio vacÃ­o/largo/invÃ¡lido, permiso denegado, timeout o servicio caÃ­do no mutan. Comandos breves, no reuniones largas, diarizaciÃ³n, transcripciÃ³n profesional ni ruido extremo como objetivo inicial.

### AceptaciÃ³n y pruebas

- B-STT completa en hardware objetivo o limitaciÃ³n explÃ­cita aprobada; smoke real offline y unit/integration con fixtures de audio autorizados.
- Mismos validador, plan y confirmaciÃ³n que texto; E2E Ã©xito, transcripciÃ³n errÃ³nea corregible, cancelaciÃ³n, destructiva y servicio ausente.
- Manual con micrÃ³fono real y edge cases de benchmark; consentimiento/privacidad de audio documentados.

**DocumentaciÃ³n:** futuro `CU-9-comandos-voz.md`, instalaciÃ³n/STT, benchmark, privacidad/micrÃ³fonos y guÃ­as de ambos asistentes.

## CU-10 â€” Crear diagramas UML desde imÃ¡genes

**Actor:** modelador. **Dependencia:** CU-9 en entrega y modelo/validador/bus de CU-2 estables. **Origen:** anterior 28. **Puerta:** B-VLM.
**Resultado:** Sharp + Gemma 3 4B/Ollama proponen modelo estructurado revisable y aplicable mediante comandos.

### Incrementos

1. Carga segura y Sharp, variantes controladas de preprocesamiento.
2. Adaptador Ollama/Gemma, prompt versionado, esquema, normalizaciÃ³n y preview de diferencias/diagnÃ³sticos/incertidumbres; carga del modelo bajo demanda.
3. Dataset B-VLM, comparaciÃ³n, revisiÃ³n/correcciÃ³n y aplicaciÃ³n confirmada por Command Bus.

### Flujo, alternativas y errores

Imagen autorizada â†’ validaciÃ³n de archivo â†’ preprocesamiento â†’ propuesta â†’ normalizaciÃ³n/validador â†’ revisiÃ³n/correcciÃ³n/confirmaciÃ³n â†’ comandos. Se reconocen clases, atributos, relaciones, multiplicidades y herencia; salida invÃ¡lida nunca se aplica. Incertidumbres no se inventan silenciosamente.

### AceptaciÃ³n y pruebas

- B-VLM completa con mÃ©tricas por clases, atributos y relaciones.
- Archivo malicioso, imagen no UML, baja calidad, timeout y modelo ausente probados.
- Manual con foto, pizarra, captura digital y ambiguos; conservar solo material autorizado/no sensible.

**DocumentaciÃ³n:** futuro `CU-10-imagenes-uml.md`, benchmark, prompts/preprocesamiento, lÃ­mites y privacidad de imÃ¡genes.

## CU-11 â€” Preparar y verificar la soluciÃ³n completa offline

**Actores:** equipo, docente/evaluador y anfitriÃ³n. **Dependencias:** CU-0 a CU-10. **Origen:** anterior 29. **Puerta:** B-OFFLINE.
**Resultado:** release candidata y demostraciÃ³n reproducibles sin Internet despuÃ©s de preparaciÃ³n.

### Incrementos

1. InstalaciÃ³n limpia/preparada, empaquetado de dependencias/modelos permitidos y suite B-OFFLINE.
2. Flujo integral: UML/clases relacionadas, validaciÃ³n, guardado/reapertura desde otro cliente, colaboraciÃ³n/presencia, relacional, generaciÃ³n backend/OpenAPI/Postman/manifiesto/frontend/Android, compilaciÃ³n, CRUD, texto/voz equivalentes, XMI e imagen; repeticiÃ³n offline.
3. CorrecciÃ³n de regresiones, documentaciÃ³n final, mÃ©tricas, deuda/notas de release y candidata.

### Flujo, alternativas y errores

Evaluador sigue receta en equipo limpio/preparado, desconecta Internet y ejecuta guion; cada fallo registra paso/evidencia/recuperaciÃ³n, sin omitirlo para declarar Ã©xito. Reinicio del anfitriÃ³n y repeticiÃ³n del arranque verifican autonomÃ­a local.

### AceptaciÃ³n y pruebas

- B-OFFLINE al 100 % de flujos esenciales; excepciÃ³n explÃ­cita impide declarar MVP completo.
- Suites automÃ¡ticas verdes y artefactos compilables; dos clientes LAN y dispositivo/emulador Android cuando disponible.
- Manual integral, recursos/latencias reales y documentaciÃ³n fiel apta para Word acadÃ©mico sin reconstruir decisiones de memoria. No imponer dominio de ejemplo fijo a estudiantes.

**DocumentaciÃ³n:** futuro `CU-11-solucion-offline.md`, STATUS, instalaciÃ³n/usuario/demo, benchmarks, matriz productoâ†’CUâ†’pruebaâ†’evidencia, deuda y release.

## Matriz histÃ³rica â€” 30 IDs anteriores â†’ 12 CUs vigentes

Cada fila conserva un alcance identificable dentro de los incrementos, aceptaciÃ³n, pruebas y documentaciÃ³n anteriores. El [registro Ã­ntegro](history/initial-30-use-cases.md) permite contrastar los flujos y criterios originales sin pÃ©rdida de informaciÃ³n; sus nombres de archivos son propuestas histÃ³ricas, ahora absorbidas por el documento del CU nuevo.

| ID anterior | Capacidad histÃ³rica | CU nuevo | Incremento / trazabilidad |
|---|---|---|---|
| 0 | Base ejecutable | CU-0 | CU-0.1 a CU-0.3 |
| 1 | Documento UML canÃ³nico | CU-2 | CU-2.1, dominio/formato/perfil |
| 2 | ValidaciÃ³n UML | CU-2 | CU-2.1, catÃ¡logo de diagnÃ³sticos |
| 3 | EdiciÃ³n por comandos | CU-2 | CU-2.2, catÃ¡logo/atomicidad |
| 4 | Undo/Redo | CU-2 | CU-2.2, historial/lÃ­mites |
| 5 | Workspace visual | CU-2 | CU-2.3, UI/Playwright/manual |
| 6 | Registro/sesiÃ³n | CU-1 | CU-1.1â€“CU-1.2, auth/landing |
| 7 | Proyectos propios | CU-3 | CU-3.1, ownership/migraciones |
| 8 | Persistencia versionada | CU-3 | CU-3.2, transacciones/recuperaciÃ³n |
| 9 | ColaboraciÃ³n realtime | CU-4 | CU-4.1 y CU-4.3, protocolo/conflictos |
| 10 | Presencia | CU-4 | CU-4.2, frecuencia/expiraciÃ³n |
| 11 | OperaciÃ³n LAN | CU-4 | CU-4.3, anfitriÃ³n/clientes/fallos |
| 12 | Mapeo relacional | CU-6 | CU-6.1, reglas/fixtures |
| 13 | Esqueleto Spring | CU-6 | CU-6.1, Eta/toolchain/compilaciÃ³n |
| 14 | Persistencia/API CRUD generada | CU-6 | CU-6.2, JPA/auditorÃ­a/relaciones |
| 15 | OpenAPI/Postman | CU-6 | CU-6.3, contratos/colecciÃ³n |
| 16 | Domain Manifest | CU-6 | CU-6.3, esquema/derivaciÃ³n |
| 17 | Frontend Astro/Preact | CU-7 | CU-7.1, inferencia/UI |
| 18 | CRUD web generado | CU-7 | CU-7.1, E2E/dos dominios |
| 19 | PWA/Android | CU-7 | CU-7.2, cachÃ©/Capacitor |
| 20 | Exportar/ejecutar aplicaciÃ³n | CU-7 | CU-7.3, paquete/checksums/offline |
| 21 | AssistantCommand/executor | CU-8 | CU-8.1, seguridad/planes |
| 22 | Texto para app generada | CU-8 | CU-8.2, B-TXT-APP |
| 23 | UI asistente generado | CU-8 | CU-8.2, confirmaciÃ³n/E2E |
| 24 | Textoâ†’UML | CU-8 | CU-8.3, B-TXT-UML |
| 25 | Speech-to-Text | CU-9 | CU-9.1, B-STT |
| 26 | OperaciÃ³n por voz | CU-9 | CU-9.2â€“CU-9.3, ambos contextos |
| 27 | XMI 2.1 | CU-5 | CU-5.1â€“CU-5.3, EA/round-trip |
| 28 | Imagenâ†’UML | CU-10 | CU-10.1â€“CU-10.3, B-VLM |
| 29 | DemostraciÃ³n offline | CU-11 | CU-11.1â€“CU-11.3, B-OFFLINE |

## Dependencias crÃ­ticas y cobertura de producto

| Capacidad | Fundamento obligatorio / CU responsable |
|---|---|
| Landing, cuenta y sesiÃ³n | CU-0 â†’ CU-1 |
| UML 2.5.1, perfil y documento/layout | CU-2.1; conservaciÃ³n real CU-3 |
| Canvas D3/SVG y ELK, identidad CASE/responsive | Modelo + validador + bus + historial de CU-2 antes de CU-2.3 |
| Persistencia y ownership | Auth CU-1 + modelo versionado/validador CU-2 â†’ CU-3 |
| Realtime y presencia | Bus + persistencia + revisiÃ³n optimista â†’ CU-4 |
| XMI/EA | Modelo, validaciÃ³n y bus â†’ CU-5 |
| GeneraciÃ³n y auditorÃ­a declarativa | Modelo vÃ¡lido + mapper determinista â†’ CU-6; JPA separada de TypeORM |
| OpenAPI/Postman/manifiesto | CU-6; contrato principal en CU-0.2 |
| CRUD ampliado y relaciones | CU-6 backend + CU-7 frontend |
| Frontend/PWA/Android/exportaciÃ³n | API/OpenAPI + Domain Manifest â†’ CU-7 |
| Lenguaje cerrado/planes/seguridad | Manifiesto/comandos cerrados + executor â†’ CU-8 |
| Texto Ollama/Qwen | CU-8; B-TXT-APP y B-TXT-UML |
| Voz whisper.cpp | Texto seguro cerrado â†’ CU-9; B-STT |
| Imagen Sharp/Gemma | Modelo/validador/bus estables â†’ CU-10; B-VLM |
| Local/LAN/offline | CU-4, CU-7 y cierre integral CU-11; B-OFFLINE |
| Testing y demostraciÃ³n | Todos los CUs; consolidaciÃ³n CU-11 |

## Receta â€” plan â†’ aprobaciÃ³n â†’ prompt â†’ implementaciÃ³n â†’ pruebas â†’ correcciÃ³n â†’ cierre

1. **Plan:** inspeccionar AGENTS, producto, ADR, estado, CU, cÃ³digo y diff. Explicar resultado usable, precondiciones, alcance/exclusiones, riesgos/rollback, decisiones fijadas y nuevas. Proponer uno a tres incrementos, orden tÃ©cnico y archivos probables; detallar dominio, contratos, datos, UI, seguridad/errores segÃºn corresponda. Definir pruebas automÃ¡ticas/manuales, resultados esperados, documentaciÃ³n y cierre, sin implementar.
2. **AprobaciÃ³n:** usuario aprueba plan/decisiones e incremento. Una contradicciÃ³n material no resuelta exige detenerse y consultarla.
3. **Prompt:** autocontenido, con rol/resultado, fuentes exactas, rama/CU/incremento, estado comprobado, restricciones/stack, pasos, flujos/errores, pruebas/comandos, documentaciÃ³n y reporte. No inventar contratos ni ampliar alcance silenciosamente.
4. **ImplementaciÃ³n:** solo incremento aprobado, adaptadores hacia dominio, cambios pequeÃ±os integrados. No acciones externas ni Git de escritura sin autorizaciÃ³n explÃ­cita.
5. **Pruebas:** ejecutar las del plan, reportar salida real; el usuario realiza manuales y aporta evidencia. Mocks declarados no sustituyen pruebas reales obligatorias. Benchmarks conservan baseline/dataset y cambian una variable por experimento.
6. **CorrecciÃ³n:** diagnosticar, corregir, aÃ±adir regresiÃ³n automatizable y actualizar documento del CU/STATUS/fuentes afectadas en cada iteraciÃ³n. Repetir hasta cumplir aceptaciÃ³n.
7. **Cierre:** comprobar incrementos integrados, aceptaciÃ³n/manuales, lint/tipos/pruebas/build verdes cuando hay cÃ³digo, benchmarks/ADR obligatorios resueltos, secretos ausentes, documentaciÃ³n fiel y deuda explÃ­cita. El agente no ejecuta builds: aporta evidencia usuario/CI. CU-0.1 solo verifica configuraciÃ³n; la evidencia manual de build se registrÃ³ en CU-0.2. Actualizar STATUS y entregar comandos finales concretos de commit/push. Solo despuÃ©s pasar al siguiente CU.

CorrecciÃ³n de un CU ya cerrado: registrar nueva iteraciÃ³n en ese CU y estado, nuevo commit `fix(cu-X): ...`, sin alterar evidencia ni commit histÃ³rico. Nunca se considera implementado un mock, simulaciÃ³n no declarada o prueba omitida.

## Plantilla de documento individual `CU-X-nombre.md`

```markdown
# CU-X â€” Nombre

## Estado y trazabilidad
## Objetivo y resultado usable
## Actores, precondiciones y dependencias
## Alcance real y fuera de alcance
## Decisiones de anÃ¡lisis y diseÃ±o aprobadas
## Incrementos (uno a tres; estado y aceptaciÃ³n por incremento)
## Flujo principal
## Flujos alternativos y errores
## Contratos, datos y migraciones
## Archivos relevantes
## Riesgos del entorno, desviaciones, deuda y recuperaciÃ³n
## Criterios de aceptaciÃ³n
## Pruebas automÃ¡ticas previstas y ejecutadas (comando, resultado real)
## Pruebas manuales y evidencia (pasos, fecha, resultado)
## Benchmarks y decisiones, si aplica
## DocumentaciÃ³n creada o actualizada
## CÃ³mo ejecutar y verificar
## Historial de iteraciones y correcciones
## Commit y push
```

## DocumentaciÃ³n transversal y decisiones de inicio

Crear solo cuando el CU la necesita: arquitectura/ADR, UML/perfil/diagnÃ³sticos/comandos, HTTP/WebSocket/errores, datos/migraciones, relacional/generadores, OpenAPI/Postman/manifiesto, instalaciÃ³n local/LAN/offline, manual/demo, seguridad/privacidad/amenazas y benchmarks/datasets/corridas. Trazar producto â†’ CU â†’ prueba â†’ evidencia para el Word acadÃ©mico; distinguir intenciÃ³n de implementaciÃ³n.

Decisiones externas resueltas: Primer Parcial, slug `primer-parcial`, futuro repositorio pÃºblico `DarksouleaterXD/primer-parcial`, monorepositorio npm workspaces, Windows/PowerShell, Node 24 y PostgreSQL `18.6-alpine` por Compose loopback. Credenciales GitHub no bloquean local. CI concreta y su ejecuciÃ³n se completan en CU-0.3; Docker no operativo es riesgo de CU-0.2. Ver [contexto de continuidad](../../PROJECT_CONTEXT.md).

## Regla de commit y push al final de cada CU

El documento individual termina con comandos PowerShell concretos, archivos reales revisados y rama `feature/cu-X-slug` o `fix/cu-X-slug`. Usar commits convencionales pequeÃ±os y trazables (`feat`, `fix`, `test`, `docs` con scope `cu-X`), sin atribuciÃ³n IA y por unidad entregable con pruebas/docs correspondientes. Nunca `git add .` sin revisar; nunca push sin solicitud del usuario.

Secuencia a concretar **al cerrar el CU**: `git status`, `git diff --check`, `git diff`, `git log --oneline -10`, checks del CU, `git add <archivos-reales>`, `git commit -m "feat(cu-X): descripcion concreta"`, `git push -u origin feature/cu-X-slug`. En correcciones: mensaje `fix(cu-X): ...` y push de un commit nuevo. Los marcadores de esta receta deben reemplazarse antes de entregar comandos ejecutables. En CU-0.1 la secciÃ³n final de CU-0 queda pendiente; no se ejecuta Git de escritura.
