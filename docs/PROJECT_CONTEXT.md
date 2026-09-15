# Contexto de continuidad para nuevos chats y agentes

## CÃ³mo usar este archivo

Este documento acompaÃ±a al ZIP o repositorio del proyecto cuando se continÃºa el trabajo en otro chat. No sustituye la inspecciÃ³n del cÃ³digo ni de la documentaciÃ³n actual: orienta dÃ³nde mirar, quÃ© no asumir y cuÃ¡l es el proceso acordado.

Al comenzar una sesiÃ³n nueva:

1. leer `AGENTS.md`;
2. leer el documento de producto vigente;
3. leer `docs/STATUS.md`;
4. leer `docs/puds/use-cases/README.md`;
5. leer el documento del CU activo y cualquier ADR enlazado;
6. inspeccionar cÃ³digo, diff y pruebas antes de proponer cambios;
7. preguntar solo lo que no pueda resolverse con esas fuentes.

## Producto

| Dato aprobado | Valor |
|---|---|
| Nombre visible | Primer Parcial |
| Slug tÃ©cnico | `primer-parcial` |
| Directorio actual | `D:\project-planning` |
| Repositorio futuro | `DarksouleaterXD/primer-parcial` |
| Visibilidad futura | PÃºblica; no implica que el remoto estÃ© creado |
| Rama esperada de CU-0 | `feature/cu-0-inicializar-base` |
| TopologÃ­a / gestor | Monorepositorio con npm workspaces `apps/*` y `packages/*` |
| Entorno principal | Windows con PowerShell 7+, Node.js 24 y npm 11 |

La raÃ­z npm es privada para evitar publicaciÃ³n accidental de un paquete; esto es independiente de la visibilidad pÃºblica futura del repositorio. Las credenciales GitHub solo se necesitan al crear/publicar el remoto y no bloquean trabajo local.

Se construye una herramienta CASE colaborativa y offline-first para diseÃ±ar diagramas de clases UML, mantener un modelo canÃ³nico versionado y generar aplicaciones funcionales.

Entradas: ediciÃ³n manual, texto, voz, imagen y XMI. Todas convergen en `CanonicalUmlModel` despuÃ©s de adaptaciÃ³n y validaciÃ³n. Salidas: canvas, XMI, modelo relacional, backend Spring Boot, OpenAPI, Postman, Domain Manifest, frontend Astro/Preact y Android mediante PWA/Capacitor.

La aplicaciÃ³n principal usa Astro/Preact y NestJS/PostgreSQL. El backend generado siempre usa Java/Spring Boot; no debe confundirse con el backend NestJS de la herramienta. Ollama y `whisper.cpp` operan localmente.

Las fronteras de auditorÃ­a TypeORM/JPA, OpenAPI Nest/Spring, frontend generado fijo y confirmaciÃ³n destructiva obligatoria estÃ¡n aprobadas en [ADR-0001](decisions/ADR-0001-initial-technical-boundaries.md). El documento de producto se conserva intacto.

## PlanificaciÃ³n definitiva: 12 CUs en 3 ciclos

| Ciclo | Casos de uso | Entrega usable |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 base, CU-1 cuenta/sesiÃ³n, CU-2 modelado manual, CU-3 proyectos persistentes | Editor validado con historial y proyectos privados que se reabren |
| 2. ColaboraciÃ³n, interoperabilidad y generaciÃ³n | CU-4 LAN, CU-5 XMI, CU-6 backend generado, CU-7 web/Android generado | ColaboraciÃ³n, intercambio y aplicaciÃ³n generada ejecutable |
| 3. Inteligencia, visiÃ³n y cierre offline | CU-8 texto, CU-9 voz, CU-10 imÃ¡genes, CU-11 soluciÃ³n offline | Asistentes e imagen validados y demostraciÃ³n integral offline |

El [plan maestro](puds/use-cases/README.md) conserva capacidades, aceptaciÃ³n, pruebas y matriz 30â†’12. El [plan histÃ³rico](puds/use-cases/history/initial-30-use-cases.md) preserva el cuerpo anterior para auditorÃ­a, no define trabajo activo. MÃ¡ximo tres incrementos por CU. Modelo canÃ³nico, validador y bus se estabilizan dentro de CU-2 antes del canvas y de los CUs que los consumen.

## Acuerdo de trabajo con el usuario

El proyecto se implementa un caso de uso por vez y en orden lineal. El usuario no debe tener que conocer de antemano comandos, estructura de repositorio o pasos implÃ­citos; cada entrega debe explicar exactamente quÃ© ejecutar, dÃ³nde y quÃ© resultado esperar.

Flujo de cada CU:

1. El usuario pide el plan de `CU-X`.
2. Se entrega un plan implementable que cubre cÃ³digo, pruebas, revisiÃ³n manual y actualizaciones documentales. Si el CU es grande, se divide en mÃ¡ximo tres incrementos.
3. El usuario aprueba el plan y pide el prompt.
4. Se entrega un prompt autocontenido para el agente: estado verificado, alcance, exclusiones, decisiones de diseÃ±o, pasos ordenados, archivos probables, pruebas, documentaciÃ³n y definiciÃ³n de terminado.
5. El agente modifica el proyecto.
6. El usuario ejecuta tests y pruebas manuales. Puede pedir ajustes de interfaz, correcciones, regresiones o cambios pequeÃ±os.
7. Cada iteraciÃ³n de correcciÃ³n tambiÃ©n actualiza el documento del CU y cualquier documento que haya quedado desactualizado.
8. Se repite hasta cumplir aceptaciÃ³n.
9. Se cierra `CU-X-nombre.md`, se actualiza `docs/STATUS.md` y se proporcionan comandos concretos de commit y push.
10. Solo entonces se pasa al siguiente CU.

Si se corrige un CU anterior cuando el proyecto ya avanzÃ³, el cambio se agrega al documento histÃ³rico de ese CU, al estado y a los documentos afectados. Se entrega un nuevo commit `fix(cu-X): ...` y se hace push del cambio nuevo; no se altera la evidencia histÃ³rica.

## QuÃ© debe contener un plan

- estado inicial comprobado y dependencias;
- objetivo observable por el usuario;
- alcance y fuera de alcance;
- uno a tres incrementos;
- decisiones de dominio, arquitectura, contratos, datos y UI;
- orden exacto de implementaciÃ³n;
- estrategia de pruebas unitarias, integraciÃ³n, E2E y manuales;
- archivos de documentaciÃ³n que se crean o actualizan;
- riesgos, rollback y definiciÃ³n de terminado;
- comandos de preparaciÃ³n y verificaciÃ³n explicados para una persona principiante.

El plan no modifica cÃ³digo. Cualquier decisiÃ³n nueva que cambie arquitectura o producto debe seÃ±alarse para aprobaciÃ³n.

## QuÃ© debe contener el prompt para el agente

- rol y resultado esperado;
- fuentes que debe leer primero;
- rama y CU/incremento exactos;
- hechos verificados del estado actual;
- restricciones globales de `AGENTS.md`;
- alcance funcional, reglas y errores;
- diseÃ±o tÃ©cnico ya decidido y lÃ­mites de libertad;
- pasos de trabajo pequeÃ±os y ordenados;
- pruebas obligatorias y comandos;
- pruebas manuales que el usuario realizarÃ¡;
- documentaciÃ³n exacta que debe actualizar;
- prohibiciones: no inventar contratos, no cambiar stack, no saltar pruebas, no declarar benchmarks no ejecutados;
- formato de reporte final: archivos, decisiones, pruebas, riesgos y prÃ³ximos pasos.

## Evidencia y documentaciÃ³n

La documentaciÃ³n final se usarÃ¡ para producir un documento Word acadÃ©mico. Por eso debe representar el 100 % de la implementaciÃ³n real, incluidos errores conocidos, limitaciones y decisiones. No debe contener resultados ficticios ni texto genÃ©rico que contradiga el cÃ³digo.

Cada CU genera `docs/puds/use-cases/CU-X-nombre.md`. Puede ademÃ¡s actualizar:

- documento de producto, solo si el usuario aprueba un cambio de producto;
- ADR, si se toma una decisiÃ³n tÃ©cnica duradera;
- documentaciÃ³n de arquitectura y contratos;
- modelo de datos y migraciones;
- guÃ­as de instalaciÃ³n, operaciÃ³n y pruebas;
- benchmark y comparaciÃ³n correspondiente;
- `docs/STATUS.md` siempre.

## Benchmarks

Las capacidades configurables de texto, visiÃ³n y voz se estabilizan con `docs/benchmarks/external-services.md`. Se conserva un dataset versionado y se mide exactitud, validez estructural, latencia y recursos. Los casos fÃ­sicos â€”fotografÃ­as, escritura manual, audio, micrÃ³fonos o ruidoâ€” incluyen una lista de pruebas manuales guiadas.

Los modelos fijados en el producto son baselines, no resultados garantizados. Comparar otro modelo no autoriza reemplazar el baseline. Un reemplazo necesita evidencia reproducible, aprobaciÃ³n y actualizaciÃ³n documental explÃ­cita.

## Primer paso acordado

El primer caso es `CU-0 â€” Inicializar la base ejecutable del proyecto`. Al terminar debe existir la estructura de repositorio aprobada, el frontend Astro y el backend NestJS ejecutÃ¡ndose, un health check simple, una comprobaciÃ³n real de comunicaciÃ³n web â†’ API, configuraciÃ³n local reproducible, pruebas bÃ¡sicas verdes y documentaciÃ³n de arranque.

El plan de CU-0 estÃ¡ aprobado con tres incrementos:

1. **CU-0.1 â€” Repositorio, configuraciÃ³n y documentaciÃ³n inicial:** terminado. ConfiguraciÃ³n raÃ­z, Compose y permisos OpenCode, plan 12/3, ADR, guÃ­as y validaciÃ³n estÃ¡tica.
2. **CU-0.2 â€” Aplicaciones y servicios conectados:** terminado y validado. Incluye Astro/NestJS, lockfile, PostgreSQL/TypeORM para readiness, health, OpenAPI principal, comunicaciÃ³n webâ†’API y build manual correcto.
3. **CU-0.3 â€” Calidad, reproducibilidad y cierre:** terminado y verificado el 2026-09-13. Incluye reproducciÃ³n limpia, checks locales, E2E/manuales y GitHub Actions `Verify base executable` #3 correcto con Node `v24.11.1` y npm `11.6.2`.

ConfiguraciÃ³n local aprobada: PostgreSQL `18.6-alpine` con volumen nombrado, healthcheck y publicaciÃ³n exclusiva en `127.0.0.1:5432`. CU-0.2 comprobÃ³ Docker Engine `29.7.2`, Compose `v5.5.1`, la base healthy y la recuperaciÃ³n controlada del servicio sin borrar el volumen.

CU-1 quedÃ³ terminado y archivado el 2026-09-14. CU-2 comienza por CU-2.1 para estabilizar `ProjectDocument`, `CanonicalUmlModel`, `DiagramLayout`, perfil de generaciÃ³n, serializaciÃ³n y validaciÃ³n antes de Command Bus o canvas.

## Continuar en futuras sesiones

1. Leer completos AGENTS, este contexto, STATUS, producto, plan maestro y benchmarks; despuÃ©s el documento de CU que se active y ADR-0001.
2. Comprobar `git status --short --branch` y `git branch --show-current`. Confirmar que la rama corresponde al CU o incremento aprobado antes de modificar cÃ³digo e inspeccionar cambios existentes como posible trabajo del usuario.
3. Consultar evidencia del CU y estado: CU-0 y CU-1 estÃ¡n terminados y archivados. CU-1 dejÃ³ registro/login/JWT/logout local con reproducciÃ³n limpia y CI real correctos.
4. CU-2 estÃ¡ activo solo en planificaciÃ³n. El incremento vigente es CU-2.1 â€” Modelo y validaciÃ³n (`cu-2-1-modelo-validacion`); no implementar CU-2.2/CU-2.3 ni CU-3 por adelantado.
5. Antes de implementar CU-2.1, revisar la rama Git segÃºn `AGENTS.md`, obtener aprobaciÃ³n explÃ­cita de proposal/spec/design/tasks y luego aplicar Ãºnicamente tareas pendientes.
6. `opencode.json` puede contener preferencias locales del usuario y no debe sobrescribirse por automatizaciÃ³n de CU-2 salvo solicitud explÃ­cita. Commit/push y acciones GitHub siguen siendo acciones del usuario.

Las comprobaciones iniciales estÃ¡n en [desarrollo](development/README.md); resultados y pendientes en [STATUS](STATUS.md) y el documento del CU, no en supuestos heredados de otro chat.

## Recordatorio para el asistente

- Hablar en espaÃ±ol claro.
- No asumir que el usuario sabe dÃ³nde ejecutar un comando o cÃ³mo interpretar su salida.
- Explicar primero el resultado y luego los pasos.
- Inspeccionar antes de diagnosticar o editar.
- Mantener el orden de CUs salvo bloqueo documentado.
- No implementar el siguiente CU por adelantado.
- No hacer acciones externas, commits o push sin autorizaciÃ³n explÃ­cita.