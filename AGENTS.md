# AGENTS.md

## Propósito

Este archivo contiene únicamente reglas y decisiones que se aplican a todo el proyecto. El alcance y el estado de un caso de uso pertenecen a `docs/puds/use-cases/`; el avance real pertenece a `docs/STATUS.md`; las decisiones excepcionales deben registrarse en un ADR.

## Fuentes de verdad y precedencia

Ante una contradicción se aplica este orden:

1. El documento de producto aprobado define visión, alcance y decisiones de negocio.
2. Un ADR aprobado define una decisión técnica posterior y explica por qué cambia o precisa lo anterior.
3. El documento del caso de uso activo define su alcance, aceptación e implementación.
4. Los contratos, migraciones y pruebas ejecutables representan el comportamiento implementado.
5. `docs/STATUS.md` registra qué está realmente terminado, parcial, bloqueado o pendiente.

Nunca se reescribe silenciosamente la historia. Una desviación necesita quedar documentada y trazable.

## Arquitectura invariable

- `CanonicalUmlModel` es la única fuente de verdad semántica del UML.
- `DiagramLayout` guarda solo posiciones y estado visual. El canvas y los objetos internos de D3, SVG o ELK nunca son dominio persistido.
- Toda entrada —edición manual, texto, voz, imagen o XMI— se adapta al modelo canónico y pasa por el mismo validador.
- Toda mutación del UML pasa por `UmlCommandBus`; ninguna interfaz, asistente, importador o canal WebSocket modifica el documento directamente.
- Toda salida —canvas, XMI, modelo relacional, generadores y manifiestos— parte del modelo canónico validado.
- El servidor es autoritativo en colaboración. Las mutaciones usan revisión optimista y la presencia es efímera; la presencia no incrementa la revisión.
- El mapeo UML a modelo relacional es determinista. Un modelo de IA no decide reglas de persistencia en tiempo de ejecución.
- La IA solo emite estructuras cerradas y validables. No genera ni ejecuta SQL, código, URLs o nombres de operaciones arbitrarios.
- Las credenciales, secretos, tokens y datos sensibles nunca se incluyen en el repositorio, ejemplos, fixtures, prompts, capturas o logs.

## Stack general aprobado

- Aplicación principal web: Astro, TypeScript, islas Preact, Shoelace, D3 con SVG, ELK.js, Nanostores y WebSocket nativo.
- Backend principal: Node.js 24 LTS, NestJS 11 sobre Express, TypeORM, PostgreSQL, Passport, JWT, bcrypt, Zod y `nestjs-zod`.
- Realtime: NestJS WebSocket Gateway con adaptador `ws`.
- XML: XMI 2.1, `saxes` y `xmlbuilder2`, con Enterprise Architect como objetivo de interoperabilidad.
- Generación: plantillas Eta. Se evita la concatenación manual extensa de código fuente.
- Backend generado: Java 21 LTS, Spring Boot 4.x, Gradle, Spring Web MVC, Spring Data JPA, Hibernate, Jakarta Validation, Jackson, `springdoc-openapi` y PostgreSQL.
- Frontend generado: Astro y Preact. Android: PWA estática más Capacitor.
- IA local: Ollama. Baselines aprobados: Qwen3.5 0.8B para texto y Gemma 3 4B para visión.
- Voz local: `whisper.cpp`.

`@nestjs/swagger` documenta la API de la aplicación principal. La API del backend Spring generado se documenta con `springdoc-openapi`. Ambas producen OpenAPI 3.1 cuando la herramienta lo permita; cualquier limitación comprobada se documenta y prueba sin sustituir silenciosamente el stack.

La auditoría se adapta al contexto: usuarios, proyectos y documentos de la herramienta principal usan columnas TypeORM; el metadato de generación `auditable` produce `createdAt`/`updatedAt` equivalentes mediante Spring Data JPA en el backend generado. Una variante no debe importar el ORM de la otra.

## Organización del código

La topología recomendada para CU-0 es un monorepositorio: `apps/web`, `apps/api`, paquetes compartidos y `docs`. Esto permite que modelo, contratos, documentación y cambios front/back evolucionen en un commit atómico. Si antes de CU-0 se aprueban repositorios separados, se debe registrar un ADR y definir dónde viven la documentación y los contratos compartidos.

- El dominio no depende de Astro, NestJS, D3, WebSocket, Ollama, TypeORM ni plantillas.
- Los adaptadores dependen del dominio; el dominio no depende de adaptadores.
- Los contratos compartidos deben ser tipados, versionables y no importar implementaciones de frontend o backend.
- Las migraciones de base de datos son explícitas y versionadas. No se usa sincronización destructiva del esquema en producción.
- Los archivos generados no se editan manualmente como solución permanente; se corrige el modelo, la regla o la plantilla que los produce.

## Flujo obligatorio por caso de uso

1. Preparar y aprobar un plan del CU antes de modificar código.
2. Si el CU es grande, dividirlo en uno, dos o tres incrementos como máximo. Cada incremento debe quedar integrado y comprobable.
3. Crear un prompt autocontenido para el agente implementador: contexto, alcance, exclusiones, decisiones, pasos, pruebas y documentación.
4. Implementar solo el CU o incremento aprobado.
5. Ejecutar pruebas automáticas y pruebas manuales indicadas en el plan.
6. Iterar correcciones. Cada iteración modifica también la documentación afectada.
7. Cerrar el CU solo con criterios de aceptación satisfechos, build verde, documentación fiel y estado actualizado.
8. Terminar el documento `CU-X-nombre.md` con los comandos concretos de commit y push.

Una corrección posterior de un CU cerrado se documenta en ese CU, en el estado real y en los documentos afectados. Se crea un nuevo commit, por ejemplo `fix(cu-X): ...`; nunca se presenta como parte del commit histórico original.

## Documentación obligatoria

Cada CU terminado debe dejar `docs/puds/use-cases/CU-X-nombre.md` con:

- objetivo, actores, precondiciones y alcance real;
- decisiones de análisis y diseño;
- incrementos implementados;
- flujos principal, alternativos y errores;
- contratos, datos, migraciones y archivos relevantes;
- pruebas automáticas ejecutadas y sus resultados;
- pruebas manuales y evidencia;
- documentación creada o actualizada;
- desviaciones, deuda técnica y trabajo fuera de alcance;
- comandos de ejecución y verificación;
- comandos finales de commit y push.

No se marca una capacidad como implementada si solo existe un mock, una prueba omitida o una simulación no declarada. La documentación final debe describir el sistema real, no la intención original.

## Calidad y pruebas

- Backend principal: Jest, `@nestjs/testing` y Supertest.
- Frontend: Vitest y `@testing-library/preact`.
- E2E: Playwright.
- Generadores: snapshots o fixtures estables, validación estructural, compilación real y pruebas contra artefactos producidos.
- Los errores relevantes deben ser tipados y observables, sin filtrar secretos.
- Cada bug reproducible añade una prueba de regresión cuando sea técnica y razonablemente automatizable.
- Los tests no dependen de Internet. Servicios pesados locales se aíslan mediante contratos para pruebas unitarias, pero el cierre del CU correspondiente exige además una prueba real documentada.

## Benchmarks y servicios configurables

- Ningún prompt, modelo o conjunto importante de parámetros se cambia solo por impresión subjetiva.
- Primero se guarda el baseline; luego se cambia una variable principal por experimento y se repite el mismo dataset.
- Se registran versión, hardware, configuración, dataset, exactitud, fallos, latencia y recursos.
- Los resultados nunca se inventan. Un benchmark no ejecutado permanece marcado como pendiente.
- Cambiar un baseline fijado por el producto exige comparación reproducible, aprobación y actualización del documento de producto o un ADR, según el alcance de la decisión.
- Los casos con audio, fotografías, escritura manual, ruido o diagramas ambiguos incluyen evaluación manual y conservan solo material autorizado y no sensible.

## Git

- Una rama por CU o incremento aprobado: `feature/cu-X-slug` o `fix/cu-X-slug`.
- Commits pequeños y trazables: `feat(cu-X): ...`, `fix(cu-X): ...`, `test(cu-X): ...`, `docs(cu-X): ...`.
- Antes de commit: revisar `git diff`, no incluir secretos y ejecutar los checks del CU.
- No reescribir historia compartida ni usar comandos destructivos para ocultar errores.
- No hacer push hasta que el usuario lo solicite o ejecute los comandos entregados.

## Límites de implementación

- No inventar lógica empresarial que no pueda derivarse del UML y de metadatos declarativos.
- No ampliar el subconjunto UML, XMI, asistente o generador dentro de un CU sin actualizar antes alcance y aceptación.
- Invitaciones y membresías multiusuario avanzadas permanecen fuera del MVP mientras el producto no las promueva explícitamente; la colaboración MVP puede validarse con sesiones autorizadas del propietario.
- La funcionalidad esencial debe poder ejecutarse sin Internet una vez instalados dependencias y modelos locales.
## OpenSpec change gate

- Todo cambio de código, configuración o dependencias requiere un cambio OpenSpec activo.
- Crear proposal.md, specs, design.md y tasks.md constituye planificación, no autorización para implementar.
- El agente nunca debe ejecutar o iniciar `/opsx-apply` automáticamente.
- La implementación solamente comienza cuando el usuario autoriza explícitamente el cambio después de revisar todos sus artefactos.
- Durante apply solamente se implementan tareas explícitas y pendientes de tasks.md.
- Si aparece una necesidad no documentada, el agente debe detenerse y proponer `/opsx-update`.
- No se permite anticipar trabajo de otro incremento o caso de uso.
- El agente no ejecutará git add, commit, push ni creación de repositorios remotos.
