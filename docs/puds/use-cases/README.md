# Plan maestro PUDS — Primer Parcial

Planificación definitiva: **12 casos de uso en 3 ciclos**, con uno a tres incrementos por CU. Define cobertura futura; el avance real está en [STATUS](../../STATUS.md). Solo CU-0.1 está autorizado para esta entrega.

El proceso es dirigido por casos de uso, centrado en arquitectura, iterativo e incremental. Cada CU se prueba, documenta y cierra antes del siguiente; una excepción requiere aprobación trazable. La reagrupación no adelanta canvas, realtime, generación o IA respecto del modelo canónico, validador y Command Bus.

## Fuentes, actores y convenciones

- [Producto aprobado](../../product/product-05-astro-nestjs.md): visión estable.
- [ADR-0001](../../decisions/ADR-0001-initial-technical-boundaries.md): precisiones aprobadas que resuelven las contradicciones de la variante.
- [Plan anterior íntegro](history/initial-30-use-cases.md): registro histórico de los 30 IDs, conservado para auditar esta reorganización. Sus ciclos y documentos propuestos no son el plan vigente.
- [Benchmarks](../../benchmarks/external-services.md): puertas obligatorias con resultados todavía no ejecutados.

| Actor | Responsabilidad |
|---|---|
| Equipo de desarrollo | Preparar, verificar y documentar la solución |
| Visitante | Conocer el producto, registrarse e iniciar sesión |
| Modelador | Editar, validar, guardar, importar y generar desde UML |
| Propietario | Administrar sus proyectos y autorizar acceso MVP |
| Colaborador autorizado | Participar en una sesión realtime permitida |
| Usuario de aplicación generada | Operar CRUD y asistentes de texto/voz |
| Sistema anfitrión | Ejecutar API, PostgreSQL, generación, realtime, IA y STT local/LAN |
| Enterprise Architect | Intercambiar XMI 2.1 |
| Docente/evaluador | Reproducir la demostración y revisar evidencia |

Los nuevos IDs van de CU-0 a CU-11. No se renumera un CU cerrado: esta migración reorganiza planificación sin implementación. Cada documento individual vive en `docs/puds/use-cases/CU-X-nombre.md`. Los incrementos pertenecen al mismo objetivo, no son CUs ocultos.

Estados: `Pendiente`, `Planificado`, `En implementación`, `En validación`, `Bloqueado`, `Terminado`. Prueba automática puede ser unitaria, integración, contrato, compilación o E2E; prueba manual exige pasos y evidencia humana. Todos los CUs actualizan su documento, STATUS y fuentes afectadas.

## Mapa de entrega

| Ciclo | Fase PUDS predominante | Casos | Incremento usable al cerrar |
|---|---|---|---|
| 1. Editor UML con proyectos privados | Inicio / Elaboración / Construcción | CU-0 a CU-3 | Cuenta y editor manual con validación, Undo/Redo, ownership y proyectos que se guardan y reabren |
| 2. Colaboración, interoperabilidad y generación | Construcción | CU-4 a CU-7 | Dos clientes LAN, presencia, XMI y aplicación Spring + web/PWA/Android generada y ejecutable |
| 3. Inteligencia, visión y cierre offline | Construcción / Transición | CU-8 a CU-11 | Texto, voz e imagen validados y demostración integral preparada sin Internet |

# Ciclo 1 — Editor UML con proyectos privados

Objetivo: convertir la base ejecutable en una herramienta privada de diagramación y persistencia. Entrega usable: registro/login, editor CASE, diagnósticos, Undo/Redo y conservación real del modelo y layout entre sesiones.

## CU-0 — Inicializar la base ejecutable del proyecto

**Actor:** equipo de desarrollo. **Dependencias:** ninguna. **Origen:** anterior 0.
**Resultado:** monorepositorio reproducible con web Astro/Preact, API NestJS/PostgreSQL, health y comunicación real comprobada al cerrar el CU.

### Incrementos

1. **CU-0.1 — Repositorio, configuración y documentación inicial:** identidad Primer Parcial / `primer-parcial`, npm workspaces, Node 24, entorno Windows/PowerShell, Compose local, ADR, permisos OpenCode y planificación 12/3. Sin aplicaciones, dependencias ni lockfile.
2. **CU-0.2 — Aplicaciones y servicios conectados:** inicializar `apps/web` y `apps/api`, instalar dependencias y generar lockfile; TypeORM/PostgreSQL, health, contrato inicial `@nestjs/swagger`, URL/CORS por entorno y pantalla que consume el estado real de API.
3. **CU-0.3 — Calidad, reproducibilidad y cierre:** checks, smoke, CI, pruebas manuales, build por usuario/CI, guías de instalación/arranque, evidencia y cierre.

### Flujo, alternativas y errores

El desarrollador obtiene el repositorio local, verifica versiones, configura entorno y, desde CU-0.2, instala e inicia PostgreSQL, API y web. Consulta health y observa la comunicación desde navegador. Herramienta ausente requiere recuperación documentada; PostgreSQL caído se informa sin credenciales; URL/CORS incorrectos producen error recuperable, nunca un falso saludable. GitHub solo se requiere al crear/publicar el remoto.

### Aceptación y pruebas

- CU-0.1: JSON/Markdown coherentes, 12 CUs/3 ciclos, trazabilidad completa, benchmarks remapeados, Compose validado sin motor, diff limpio y ausencia de secretos, lockfile y aplicaciones prematuras.
- Cierre CU-0: clonado limpio reproducible, versiones compatibles con Node 24/NestJS 11, health estable y distinción vida/dependencias cuando se implemente readiness; estado web real, contrato principal publicado y actualizado con nuevas rutas.
- Unitarias/smoke, lint, tipos, build y CI verdes al cierre; navegador con URL/resultado documentados. Build pendiente de CU-0.3, no aplicable a CU-0.1.

**Documentación:** [CU-0-inicializar-base.md](CU-0-inicializar-base.md), README raíz, arquitectura, desarrollo, entorno, ADR y STATUS. Auth, UML y CRUD quedan fuera de CU-0.

## CU-1 — Gestionar cuenta y sesión

**Actor:** visitante. **Dependencia:** CU-0. **Origen:** anterior 6.
**Resultado:** landing, registro, login, JWT, logout y rutas protegidas.

### Incrementos

1. Persistencia/migración de usuario, auditoría TypeORM, bcrypt, Passport/JWT, validación Zod y errores seguros.
2. Landing y pantallas de autenticación CASE, manejo de sesión, rutas protegidas y accesibilidad responsive.

### Flujo, alternativas y errores

El visitante registra credenciales válidas, inicia sesión y accede al área privada; puede cerrar sesión. El área de proyectos se integra funcionalmente en CU-3. Duplicados, credenciales incorrectas, payload inválido y token vencido reciben respuestas uniformes sin enumeración sensible.

### Aceptación y pruebas

- Contraseñas nunca almacenadas ni registradas en texto plano; secretos por entorno.
- Unitarias/integración y E2E de registro, login, logout, expiración y acceso anónimo.
- Revisión manual accesible/responsive e identidad visual de landing y paneles de auth.

**Documentación:** futuro `CU-1-cuenta-sesion.md`, modelo de amenazas mínimo, esquema/migraciones de usuario y guía de variables.

## CU-2 — Modelar diagramas UML manualmente

**Actor:** modelador; validador compartido con todos los adaptadores. **Dependencia:** CU-1; fundamento ejecutable CU-0. **Origen:** anteriores 1–5.
**Resultado:** documento canónico serializable y editor manual en memoria, sin persistencia ni colaboración aún.

### Incrementos

1. **Modelo y validación:** `CanonicalUmlModel`, `ProjectDocument`, `DiagramLayout`, fábricas, IDs, UUID/metadatos/revisión/timestamps y serialización versionada. UML 2.5.1: clases, atributos/propiedades, operaciones, visibilidad, tipos, enums, paquetes, asociaciones/agregación/composición/generalización, extremos y multiplicidades. Perfil de generación separado de UML: `entity`, `auditable`, `readOnly`, `searchable`, `crud`, `required`, `unique`, `sortable`, `defaultSort`. Motor único y diagnóstico con severity, code, mensaje, path lógico y elemento; reglas/políticas de edición, guardado, importación y generación.
2. **Comandos e historial:** contratos desacoplados del transporte, `UmlCommandBus`/executor para clases, atributos, enums, relaciones, multiplicidades, herencia, movimiento y metadatos. Intenciones atómicas identificables; historial configurable de 100 operaciones, estrategia snapshot o compensación y costo documentados.
3. **Workspace:** shell CASE, grid, nodos custom D3/SVG, zoom/pan/selección/ajuste a contenido, auto-layout ELK; toolbox e inspector de clases, atributos, operaciones, enums y perfil. Relaciones UML, multiplicidades, handles, `MoveNode`, diagnósticos navegables, menús contextuales y Undo/Redo visible.

### Flujo, alternativas y errores

Se crea documento vacío, se valida y serializa. La UI/adaptador emite comandos; el bus valida forma/precondiciones, executor calcula resultado y validador acepta o devuelve error tipado sin mutación parcial. El canvas proyecta el documento aceptado; nunca se persisten objetos gráficos como dominio. La consola técnica enfoca elementos con diagnóstico.

IDs duplicados, referencias rotas, colisiones, elementos inexistentes o mezcla visual/semántica se rechazan. Fallo interno del validador no equivale a validez. Advertencias no bloquean por defecto; errores bloquean por contexto. Undo/Redo restaura semántica, layout y revisión local definida; una nueva edición invalida redo, comandos rechazados y presencia no ingresan al historial, exceso de capacidad descarta historia según política.

### Aceptación y pruebas

- Dominio sin dependencias UI/NestJS/TypeORM/IA; round-trip preserva semántica/layout. Fixtures de todo el subconjunto y perfil; invariantes, IDs, multiplicidad y versionado.
- Mismo validador para consumidores, códigos estables y tabla de reglas positivas/negativas; navegación por elemento.
- Ninguna mutación pública evita el bus; pruebas de éxito, precondición, colisión, inexistente, referencia rota y atomicidad. Contratos reutilizables en realtime/IA.
- Historial vacío, 100+, secuencias mixtas, fallo y restauración exacta probados.
- Identidad CASE clara y responsive según producto; etiquetas, multiplicidades y relaciones legibles. Unit/component de adaptadores/inspector; Playwright de diagramación, validación y Undo/Redo. Manual de accesibilidad, tablet y móvil de revisión.

**Documentación:** futuro `CU-2-modelado-uml-manual.md`, dominio/formato, perfil, catálogo de diagnósticos y comandos, estrategia de historial, guía UI y capturas autorizadas; deuda visual explícita sin falsear aceptación funcional.

## CU-3 — Gestionar proyectos UML persistentes

**Actor:** propietario. **Dependencias:** CU-1 y CU-2. **Origen:** anteriores 7–8.
**Resultado:** crear/listar/abrir/renombrar/eliminar proyectos privados; guardar/reabrir semántica y layout con revisión optimista.

### Incrementos

1. Administración y ownership: UUID, `ownerId`, metadatos/timestamps, migraciones TypeORM y política de borrado.
2. Repositorio TypeORM, transacción de `ProjectDocument` versionado, validación de guardado, carga y autosave/manual según plan aprobado; conflicto y recuperación UI.

### Flujo, alternativas y errores

El propietario ve solo sus proyectos, crea/abre/edita y guarda con `baseRevision`; servidor valida y persiste nueva revisión. ID ajeno/inexistente no filtra existencia. Eliminar exige confirmación y política de recuperación/irreversibilidad. Base obsoleta rechaza guardado y permite recargar documento autoritativo sin sobrescritura silenciosa.

### Aceptación y pruebas

- Autorización filtrada en toda consulta backend; integración/E2E con dos usuarios comprueba aislamiento.
- Round-trip PostgreSQL real conserva modelo/layout; validación bloquea cuando corresponde.
- Concurrencia, rollback, versión de formato y documento corrupto cubiertos. E2E cerrar navegador/reabrir/comprobar diagrama y revisión manual del flujo.

**Documentación:** futuro `CU-3-proyectos-persistentes.md`, esquema/migraciones, contratos/transacciones, borrado, autosave y recuperación.

# Ciclo 2 — Colaboración, interoperabilidad y generación

Objetivo: extender la herramienta privada a sesiones LAN autorizadas, intercambio UML y generación determinista. Entrega usable: dos clientes colaborando, presencia, XMI compatible y artefacto completo backend/web/PWA/Android reproducible.

## CU-4 — Colaborar en proyectos UML por LAN

**Actores:** propietario, colaborador autorizado, participantes, anfitrión y clientes LAN. **Dependencia:** CU-3 y fundamentos de CU-2. **Origen:** anteriores 9–11.
**Resultado:** edición incremental autoritativa, presencia efímera y recuperación de red.

### Incrementos

1. Gateway NestJS `ws`, cliente WebSocket nativo, autenticación/unión al proyecto y protocolo versionado; una operación por intención con `baseRevision`, bus/validador, persistencia inmediata y broadcast. Rechazo obsoleto, idempotencia y recuperación autoritativa.
2. Lista de sesiones, selección, cursor/etiqueta, elemento en edición, última actividad y log compacto; frecuencia limitada, throttling y expiración por timeout/desconexión.
3. Operación LAN: host/puertos/firewall/origen autorizados, reconexión, política de cambios no enviados y recuperación tras caída/reinicio del anfitrión.

### Flujo, alternativas y errores

Cliente autenticado recibe documento/revisión inicial, envía operación, recibe aceptación/nueva revisión; otros reciben la operación aceptada. No se transmite todo el documento en cada edición. Operación obsoleta, duplicada o no autorizada no causa mutación indebida. Ante divergencia se resincroniza; presencia excesiva se limita y nunca se guarda como proyecto. La UI informa caída, conserva pendientes según política y evita duplicación al reconectar.

### Aceptación y pruebas

- Servidor como única autoridad; coherencia persistencia/broadcast ante fallos; integración/E2E de orden, conflicto, duplicado y reconexión con dos clientes.
- Presencia no afecta dominio, historial ni revisión; tests de expiración, throttling, desconexión y múltiples pestañas, E2E visual.
- Sin Internet tras preparación; cortes de red, reinicio y dos dispositivos reales cuando disponibles, configuración segura documentada. PostgreSQL permanece en loopback: LAN expone servicios autorizados, no la BD.
- MVP validable con sesiones autorizadas del propietario. Membresías/invitaciones avanzadas (roles, expiración, tokens controlados) siguen como evolución, sin prometer acceso no autorizado ni CRDT completo.

**Documentación:** futuro `CU-4-colaboracion-lan.md`, protocolo/secuencias, conflicto/idempotencia, presencia/frecuencia, guía anfitrión/cliente y matriz de fallos.

## CU-5 — Importar y exportar diagramas XMI

**Actores:** modelador y Enterprise Architect. **Dependencia:** CU-4 en orden de entrega; modelo/validador/bus de CU-2. **Origen:** anterior 27.
**Resultado:** intercambio XMI 2.1 del subconjunto UML soportado.

### Incrementos

1. Parser streaming `saxes`, modelo intermedio y límites XML.
2. Adaptación/validación a canónico, preview y reporte de elementos no soportados; aplicación confirmada por Command Bus.
3. Exportación `xmlbuilder2`, round-trip semántico y verificación real con Enterprise Architect.

### Flujo, alternativas y errores

Se importa sin ejecutar entidades externas; se adapta, valida y muestra preview/diagnósticos antes de confirmar. Desconocidos se informan, no se inventan. Exportación parte del modelo canónico válido.

### Aceptación y pruebas

- Subconjunto/limitaciones explícitos; protección XXE, archivos enormes y referencias rotas.
- Fixtures import/export y round-trip semántico normalizado; manual ida/vuelta con versión documentada de EA.

**Documentación:** futuro `CU-5-interoperabilidad-xmi.md`, matriz de compatibilidad y procedimiento EA.

## CU-6 — Generar el backend desde UML

**Actores:** modelador, consumidor de API, usuario técnico, generador/asistente como consumidores del manifiesto. **Dependencia:** CU-5 en orden; modelo validado de CU-2. **Origen:** anteriores 12–16.
**Resultado:** `RelationalModel` determinista y backend Spring compilable con CRUD, OpenAPI, Postman y Domain Manifest.

### Incrementos

1. **Mapeo y esqueleto:** preview de tablas, columnas, PK/FK, constraints/unique, índices y relaciones. Clases/atributos/tipos/enums/IDs/nulabilidad; 1:1, 1:N, N:M, composición, herencia y nombres deterministas. Eta genera Java 21/Spring Boot 4.x/Gradle en directorio seguro, con build, configuración y paquetes.
2. **Persistencia y API:** entidades JPA/enums/repositorios, migración/configuración/constraints; servicios, DTOs/mappers, errores, Jakarta Validation/Jackson y controladores Spring Web MVC. Create/read/update/delete/list, pagination/sorting/filtering/search/count y navegación de relaciones por metadatos; `auditable` usa Spring Data JPA para `createdAt`/`updatedAt`.
3. **Contratos y metadatos:** `springdoc-openapi`, schemas/parámetros/errores y exportación OpenAPI 3.1 cuando sea compatible; Postman derivado determinísticamente con variables/tests básicos. Domain Manifest tipado/versionado: entidades, atributos/tipos, aliases, campos search/sort, relaciones, validaciones, capacidades CRUD, operaciones permitidas y mapeo lógico para ejecutor.

### Flujo, alternativas y errores

Modelo válido → mapper/vista previa → plantillas → proyecto → ejecución PostgreSQL/API → OpenAPI → Postman/manifiesto. Ambigüedad exige completar metadatos; IA nunca decide persistencia. Ruta insegura, conflicto de archivo o plantilla fallida aborta sin falso artefacto exitoso. Entrada inválida, duplicado, referencia ausente o filtro no permitido produce error coherente. Manifiesto inconsistente se rechaza; capacidad no declarada no está permitida.

### Aceptación y pruebas

- Mismo modelo/configuración da salida equivalente; reglas/precedencias y fixtures por cardinalidad. Colisiones de nombres, ciclos, IDs faltantes y tipos no soportados probados.
- Eta/helpers/entradas separados, sin concatenación extensa; protección path traversal. Compilación Java 21/Gradle, smoke context y tests reales del artefacto; PostgreSQL real para todas las cardinalidades.
- Regeneración idempotente según política sin pisar personalizaciones silenciosamente; se corrigen mapper/plantillas, no archivos producidos.
- OpenAPI válido para su versión y cobertura runtime completa; limitación 3.1 comprobada se documenta/prueba. Postman importable con variables, sin hosts fijos ni secretos; contract tests runtime ↔ OpenAPI ↔ colección. Swagger Nest reservado a API principal.
- Manifiesto ↔ UML ↔ API trazables, sin campos internos expuestos; fixtures de aliases/permisos CRUD/search/sort/relaciones. Revisión manual de preview, artefactos y colección.

**Documentación:** futuro `CU-6-backend-generado.md`, especificación UML→relacional, estructura/toolchain Spring, capacidades/errores/regeneración, guía OpenAPI/Postman y esquema/versionado/derivación del manifiesto.

## CU-7 — Generar y ejecutar el frontend web y Android

**Actores:** modelador, usuario técnico, usuario de aplicación generada y anfitrión. **Dependencia:** CU-6. **Origen:** anteriores 17–20.
**Resultado:** aplicación generada Astro/Preact con CRUD real, PWA/Capacitor Android y paquete exportable coherente.

### Incrementos

1. **Frontend y CRUD:** Eta genera esqueleto, cliente tipado cuando corresponda, configuración, navegación, listados/detalle/formularios por metadatos. CRUD con validaciones/confirmaciones, búsqueda/filtros/sorting/paginación/count, select/autocomplete N:1 y listas/navegación 1:N.
2. **PWA y Android:** manifest/assets/service worker/política de caché, Astro estático; Capacitor, endpoint seguro y build Android reproducible.
3. **Exportación y ejecución:** backend, frontend, Android, OpenAPI, Postman y manifiesto empaquetados, README generado, checksums/metadatos de revisión del modelo/generador/plantillas y smoke offline preparado.

### Flujo, alternativas y errores

Se genera desde contratos/manifiesto, se configura endpoint y PostgreSQL, se inicia artefacto y se opera CRUD. Inferencia: String→input, Integer/Long/Decimal→number, Boolean→checkbox/switch, Date→date picker, DateTime→datetime picker, Enum→select, Text→textarea, N:1→select/autocomplete, 1:N→tabla relacionada. Tipo no soportado produce diagnóstico. Loading/vacío/error/validación son visibles; borrado confirma; fallo de compilación/incompatibilidad se vincula a modelo/plantilla e impide declarar éxito.

### Aceptación y pruebas

- Generación determinista, build real limpio desde directorio vacío; component tests y snapshots/fixtures semánticos estables.
- E2E contra backend/PostgreSQL generados, relaciones consistentes; manual responsive y flujo completo en al menos dos dominios fixture.
- PWA instala/actualiza sin HTML/API obsoletos peligrosos; build Android real y smoke en emulador/dispositivo cuando disponible; funciones dependientes del anfitrión LAN explícitas.
- Paquete trazable y smoke CRUD con red externa desconectada tras descargar dependencias; sin lógica empresarial inventada.

**Documentación:** futuro `CU-7-frontend-web-android.md`, matriz tipo→control, guía usuario/limitaciones, instalación PWA/Android/emulador/dispositivo, README generado y matriz de artefactos.

# Ciclo 3 — Inteligencia, visión y cierre offline

Objetivo: añadir entradas probabilísticas sobre contratos y ejecutores deterministas ya estables. Entrega usable: operación textual y por voz en ambos contextos, imagen→UML revisable y demostración integral sin Internet una vez preparados modelos/dependencias.

## CU-8 — Operar mediante lenguaje natural

**Actores:** modelador y usuario de aplicación generada. **Dependencia:** CU-7, bus/editor de CU-2 y API/manifiesto de CU-6. **Origen:** anteriores 21–24. **Puertas de cierre:** B-TXT-APP y B-TXT-UML.
**Resultado:** texto propone planes cerrados, legibles, validables y ejecutables en contexto; nunca HTTP/SQL/mutación directa desde texto.

### Incrementos

1. **Lenguaje/ejecución:** `AssistantCommand` versionado, pequeño/tipado, `LIST`, `GET`, `SEARCH`, `CREATE`, `UPDATE`, `DELETE`, `COUNT`; parser/validator, allow-lists de operación/entidad/campo, tipos/relaciones y confirmación destructiva. Executor determinista con cliente permitido y planes de máximo tres pasos, validación entre pasos.
2. **Texto en aplicación generada:** adaptador Ollama/Qwen3.5 0.8B, contexto limitado, prompt/config versionados, salida estructurada, timeout/cancelación; dataset/evaluador/baseline B-TXT-APP, iteración de una variable y comparación. Consola muestra solicitud, plan, confirmación, ejecución/resultado e historial.
3. **Texto en CASE:** intención UML cerrada, resolver de nombres/referencias y adaptación a `UmlCommand` existente; consola/preview/confirmación, ambigüedad, dataset/evaluador y comparación B-TXT-UML.

### Flujo, alternativas y errores

Texto → propuesta → validación → aclaración/rechazo o plan → confirmación cuando corresponde → executor permitido / bus UML → resultado. UML confirma antes de mutar; acciones destructivas de ambos asistentes siempre confirman. Cancelación previa no muta. Historial visible no autoriza repetición automática. Modelo ausente, caído, timeout o respuesta inválida dejan estado estable con recuperación; referencia arbitraria se rechaza. Expresiones recientes/últimos se resuelven con metadatos de auditoría, no reglas inventadas.

### Aceptación y pruebas

- Contrato independiente de frases/URLs; cero SQL/código/URL arbitrarios ejecutables. Pruebas exhaustivas de allow-list, tipos, relaciones, confirmación, planes y fallo intermedio; auditoría sin contenido sensible.
- Ambas puertas con dataset, ejecución y resultados reales; unitarias con adaptador declarado simulado y smoke real Ollama. Inyección de prompt, inexistentes, ambigüedad y servicio caído probados.
- Nunca se oculta plan mutador; E2E texto→plan→confirmación→API→resultado y texto→plan→confirmación→bus→canvas; rechazo/cancelación no mutan. IA no toca canvas/documento. Manual guiado de las consolas.

**Documentación:** futuro `CU-8-lenguaje-natural.md`, esquema/semántica/seguridad, guías de asistentes/modelos, catálogo UML, prompts/config y benchmarks.

## CU-9 — Operar mediante comandos de voz

**Actores:** modelador y usuario de aplicación generada; anfitrión ejecuta STT por defecto. **Dependencia:** CU-8. **Origen:** anteriores 25–26. **Puerta:** B-STT.
**Resultado:** audio breve → texto corregible → los mismos planes/validadores/confirmaciones del canal texto.

### Incrementos

1. Captura/permisos/límites/cancelación, adaptador anfitrión `whisper.cpp`, selección de modelo/parámetros mediante B-STT, estados/error/timeout y guía de micrófonos.
2. Voz→`UmlCommand` en CASE con revisión de transcripción, plan, validación y confirmación.
3. Voz→`AssistantCommand` en aplicación generada, integración y comprobación offline de ambos contextos.

### Flujo, alternativas y errores

Se graba, transcribe, revisa/corrige y envía al canal texto del contexto correcto; se revisa/confirma plan y ejecuta. Audio vacío/largo/inválido, permiso denegado, timeout o servicio caído no mutan. Comandos breves, no reuniones largas, diarización, transcripción profesional ni ruido extremo como objetivo inicial.

### Aceptación y pruebas

- B-STT completa en hardware objetivo o limitación explícita aprobada; smoke real offline y unit/integration con fixtures de audio autorizados.
- Mismos validador, plan y confirmación que texto; E2E éxito, transcripción errónea corregible, cancelación, destructiva y servicio ausente.
- Manual con micrófono real y edge cases de benchmark; consentimiento/privacidad de audio documentados.

**Documentación:** futuro `CU-9-comandos-voz.md`, instalación/STT, benchmark, privacidad/micrófonos y guías de ambos asistentes.

## CU-10 — Crear diagramas UML desde imágenes

**Actor:** modelador. **Dependencia:** CU-9 en entrega y modelo/validador/bus de CU-2 estables. **Origen:** anterior 28. **Puerta:** B-VLM.
**Resultado:** Sharp + Gemma 3 4B/Ollama proponen modelo estructurado revisable y aplicable mediante comandos.

### Incrementos

1. Carga segura y Sharp, variantes controladas de preprocesamiento.
2. Adaptador Ollama/Gemma, prompt versionado, esquema, normalización y preview de diferencias/diagnósticos/incertidumbres; carga del modelo bajo demanda.
3. Dataset B-VLM, comparación, revisión/corrección y aplicación confirmada por Command Bus.

### Flujo, alternativas y errores

Imagen autorizada → validación de archivo → preprocesamiento → propuesta → normalización/validador → revisión/corrección/confirmación → comandos. Se reconocen clases, atributos, relaciones, multiplicidades y herencia; salida inválida nunca se aplica. Incertidumbres no se inventan silenciosamente.

### Aceptación y pruebas

- B-VLM completa con métricas por clases, atributos y relaciones.
- Archivo malicioso, imagen no UML, baja calidad, timeout y modelo ausente probados.
- Manual con foto, pizarra, captura digital y ambiguos; conservar solo material autorizado/no sensible.

**Documentación:** futuro `CU-10-imagenes-uml.md`, benchmark, prompts/preprocesamiento, límites y privacidad de imágenes.

## CU-11 — Preparar y verificar la solución completa offline

**Actores:** equipo, docente/evaluador y anfitrión. **Dependencias:** CU-0 a CU-10. **Origen:** anterior 29. **Puerta:** B-OFFLINE.
**Resultado:** release candidata y demostración reproducibles sin Internet después de preparación.

### Incrementos

1. Instalación limpia/preparada, empaquetado de dependencias/modelos permitidos y suite B-OFFLINE.
2. Flujo integral: UML/clases relacionadas, validación, guardado/reapertura desde otro cliente, colaboración/presencia, relacional, generación backend/OpenAPI/Postman/manifiesto/frontend/Android, compilación, CRUD, texto/voz equivalentes, XMI e imagen; repetición offline.
3. Corrección de regresiones, documentación final, métricas, deuda/notas de release y candidata.

### Flujo, alternativas y errores

Evaluador sigue receta en equipo limpio/preparado, desconecta Internet y ejecuta guion; cada fallo registra paso/evidencia/recuperación, sin omitirlo para declarar éxito. Reinicio del anfitrión y repetición del arranque verifican autonomía local.

### Aceptación y pruebas

- B-OFFLINE al 100 % de flujos esenciales; excepción explícita impide declarar MVP completo.
- Suites automáticas verdes y artefactos compilables; dos clientes LAN y dispositivo/emulador Android cuando disponible.
- Manual integral, recursos/latencias reales y documentación fiel apta para Word académico sin reconstruir decisiones de memoria. No imponer dominio de ejemplo fijo a estudiantes.

**Documentación:** futuro `CU-11-solucion-offline.md`, STATUS, instalación/usuario/demo, benchmarks, matriz producto→CU→prueba→evidencia, deuda y release.

## Matriz histórica — 30 IDs anteriores → 12 CUs vigentes

Cada fila conserva un alcance identificable dentro de los incrementos, aceptación, pruebas y documentación anteriores. El [registro íntegro](history/initial-30-use-cases.md) permite contrastar los flujos y criterios originales sin pérdida de información; sus nombres de archivos son propuestas históricas, ahora absorbidas por el documento del CU nuevo.

| ID anterior | Capacidad histórica | CU nuevo | Incremento / trazabilidad |
|---|---|---|---|
| 0 | Base ejecutable | CU-0 | CU-0.1 a CU-0.3 |
| 1 | Documento UML canónico | CU-2 | CU-2.1, dominio/formato/perfil |
| 2 | Validación UML | CU-2 | CU-2.1, catálogo de diagnósticos |
| 3 | Edición por comandos | CU-2 | CU-2.2, catálogo/atomicidad |
| 4 | Undo/Redo | CU-2 | CU-2.2, historial/límites |
| 5 | Workspace visual | CU-2 | CU-2.3, UI/Playwright/manual |
| 6 | Registro/sesión | CU-1 | CU-1.1–CU-1.2, auth/landing |
| 7 | Proyectos propios | CU-3 | CU-3.1, ownership/migraciones |
| 8 | Persistencia versionada | CU-3 | CU-3.2, transacciones/recuperación |
| 9 | Colaboración realtime | CU-4 | CU-4.1 y CU-4.3, protocolo/conflictos |
| 10 | Presencia | CU-4 | CU-4.2, frecuencia/expiración |
| 11 | Operación LAN | CU-4 | CU-4.3, anfitrión/clientes/fallos |
| 12 | Mapeo relacional | CU-6 | CU-6.1, reglas/fixtures |
| 13 | Esqueleto Spring | CU-6 | CU-6.1, Eta/toolchain/compilación |
| 14 | Persistencia/API CRUD generada | CU-6 | CU-6.2, JPA/auditoría/relaciones |
| 15 | OpenAPI/Postman | CU-6 | CU-6.3, contratos/colección |
| 16 | Domain Manifest | CU-6 | CU-6.3, esquema/derivación |
| 17 | Frontend Astro/Preact | CU-7 | CU-7.1, inferencia/UI |
| 18 | CRUD web generado | CU-7 | CU-7.1, E2E/dos dominios |
| 19 | PWA/Android | CU-7 | CU-7.2, caché/Capacitor |
| 20 | Exportar/ejecutar aplicación | CU-7 | CU-7.3, paquete/checksums/offline |
| 21 | AssistantCommand/executor | CU-8 | CU-8.1, seguridad/planes |
| 22 | Texto para app generada | CU-8 | CU-8.2, B-TXT-APP |
| 23 | UI asistente generado | CU-8 | CU-8.2, confirmación/E2E |
| 24 | Texto→UML | CU-8 | CU-8.3, B-TXT-UML |
| 25 | Speech-to-Text | CU-9 | CU-9.1, B-STT |
| 26 | Operación por voz | CU-9 | CU-9.2–CU-9.3, ambos contextos |
| 27 | XMI 2.1 | CU-5 | CU-5.1–CU-5.3, EA/round-trip |
| 28 | Imagen→UML | CU-10 | CU-10.1–CU-10.3, B-VLM |
| 29 | Demostración offline | CU-11 | CU-11.1–CU-11.3, B-OFFLINE |

## Dependencias críticas y cobertura de producto

| Capacidad | Fundamento obligatorio / CU responsable |
|---|---|
| Landing, cuenta y sesión | CU-0 → CU-1 |
| UML 2.5.1, perfil y documento/layout | CU-2.1; conservación real CU-3 |
| Canvas D3/SVG y ELK, identidad CASE/responsive | Modelo + validador + bus + historial de CU-2 antes de CU-2.3 |
| Persistencia y ownership | Auth CU-1 + modelo versionado/validador CU-2 → CU-3 |
| Realtime y presencia | Bus + persistencia + revisión optimista → CU-4 |
| XMI/EA | Modelo, validación y bus → CU-5 |
| Generación y auditoría declarativa | Modelo válido + mapper determinista → CU-6; JPA separada de TypeORM |
| OpenAPI/Postman/manifiesto | CU-6; contrato principal en CU-0.2 |
| CRUD ampliado y relaciones | CU-6 backend + CU-7 frontend |
| Frontend/PWA/Android/exportación | API/OpenAPI + Domain Manifest → CU-7 |
| Lenguaje cerrado/planes/seguridad | Manifiesto/comandos cerrados + executor → CU-8 |
| Texto Ollama/Qwen | CU-8; B-TXT-APP y B-TXT-UML |
| Voz whisper.cpp | Texto seguro cerrado → CU-9; B-STT |
| Imagen Sharp/Gemma | Modelo/validador/bus estables → CU-10; B-VLM |
| Local/LAN/offline | CU-4, CU-7 y cierre integral CU-11; B-OFFLINE |
| Testing y demostración | Todos los CUs; consolidación CU-11 |

## Receta — plan → aprobación → prompt → implementación → pruebas → corrección → cierre

1. **Plan:** inspeccionar AGENTS, producto, ADR, estado, CU, código y diff. Explicar resultado usable, precondiciones, alcance/exclusiones, riesgos/rollback, decisiones fijadas y nuevas. Proponer uno a tres incrementos, orden técnico y archivos probables; detallar dominio, contratos, datos, UI, seguridad/errores según corresponda. Definir pruebas automáticas/manuales, resultados esperados, documentación y cierre, sin implementar.
2. **Aprobación:** usuario aprueba plan/decisiones e incremento. Una contradicción material no resuelta exige detenerse y consultarla.
3. **Prompt:** autocontenido, con rol/resultado, fuentes exactas, rama/CU/incremento, estado comprobado, restricciones/stack, pasos, flujos/errores, pruebas/comandos, documentación y reporte. No inventar contratos ni ampliar alcance silenciosamente.
4. **Implementación:** solo incremento aprobado, adaptadores hacia dominio, cambios pequeños integrados. No acciones externas ni Git de escritura sin autorización explícita.
5. **Pruebas:** ejecutar las del plan, reportar salida real; el usuario realiza manuales y aporta evidencia. Mocks declarados no sustituyen pruebas reales obligatorias. Benchmarks conservan baseline/dataset y cambian una variable por experimento.
6. **Corrección:** diagnosticar, corregir, añadir regresión automatizable y actualizar documento del CU/STATUS/fuentes afectadas en cada iteración. Repetir hasta cumplir aceptación.
7. **Cierre:** comprobar incrementos integrados, aceptación/manuales, lint/tipos/pruebas/build verdes cuando hay código, benchmarks/ADR obligatorios resueltos, secretos ausentes, documentación fiel y deuda explícita. El agente no ejecuta builds: aporta evidencia usuario/CI. CU-0.1 solo verifica configuración; la evidencia manual de build se registró en CU-0.2. Actualizar STATUS y entregar comandos finales concretos de commit/push. Solo después pasar al siguiente CU.

Corrección de un CU ya cerrado: registrar nueva iteración en ese CU y estado, nuevo commit `fix(cu-X): ...`, sin alterar evidencia ni commit histórico. Nunca se considera implementado un mock, simulación no declarada o prueba omitida.

## Plantilla de documento individual `CU-X-nombre.md`

```markdown
# CU-X — Nombre

## Estado y trazabilidad
## Objetivo y resultado usable
## Actores, precondiciones y dependencias
## Alcance real y fuera de alcance
## Decisiones de análisis y diseño aprobadas
## Incrementos (uno a tres; estado y aceptación por incremento)
## Flujo principal
## Flujos alternativos y errores
## Contratos, datos y migraciones
## Archivos relevantes
## Riesgos del entorno, desviaciones, deuda y recuperación
## Criterios de aceptación
## Pruebas automáticas previstas y ejecutadas (comando, resultado real)
## Pruebas manuales y evidencia (pasos, fecha, resultado)
## Benchmarks y decisiones, si aplica
## Documentación creada o actualizada
## Cómo ejecutar y verificar
## Historial de iteraciones y correcciones
## Commit y push
```

## Documentación transversal y decisiones de inicio

Crear solo cuando el CU la necesita: arquitectura/ADR, UML/perfil/diagnósticos/comandos, HTTP/WebSocket/errores, datos/migraciones, relacional/generadores, OpenAPI/Postman/manifiesto, instalación local/LAN/offline, manual/demo, seguridad/privacidad/amenazas y benchmarks/datasets/corridas. Trazar producto → CU → prueba → evidencia para el Word académico; distinguir intención de implementación.

Decisiones externas resueltas: Primer Parcial, slug `primer-parcial`, futuro repositorio público `DarksouleaterXD/primer-parcial`, monorepositorio npm workspaces, Windows/PowerShell, Node 24 y PostgreSQL `18.6-alpine` por Compose loopback. Credenciales GitHub no bloquean local. CI concreta y su ejecución se completan en CU-0.3; Docker no operativo es riesgo de CU-0.2. Ver [contexto de continuidad](../../PROJECT_CONTEXT.md).

## Regla de commit y push al final de cada CU

El documento individual termina con comandos PowerShell concretos, archivos reales revisados y rama `feature/cu-X-slug` o `fix/cu-X-slug`. Usar commits convencionales pequeños y trazables (`feat`, `fix`, `test`, `docs` con scope `cu-X`), sin atribución IA y por unidad entregable con pruebas/docs correspondientes. Nunca `git add .` sin revisar; nunca push sin solicitud del usuario.

Secuencia a concretar **al cerrar el CU**: `git status`, `git diff --check`, `git diff`, `git log --oneline -10`, checks del CU, `git add <archivos-reales>`, `git commit -m "feat(cu-X): descripcion concreta"`, `git push -u origin feature/cu-X-slug`. En correcciones: mensaje `fix(cu-X): ...` y push de un commit nuevo. Los marcadores de esta receta deben reemplazarse antes de entregar comandos ejecutables. En CU-0.1 la sección final de CU-0 queda pendiente; no se ejecuta Git de escritura.
