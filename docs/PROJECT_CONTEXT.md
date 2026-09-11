# Contexto de continuidad para nuevos chats y agentes

## Cómo usar este archivo

Este documento acompaña al ZIP o repositorio del proyecto cuando se continúa el trabajo en otro chat. No sustituye la inspección del código ni de la documentación actual: orienta dónde mirar, qué no asumir y cuál es el proceso acordado.

Al comenzar una sesión nueva:

1. leer `AGENTS.md`;
2. leer el documento de producto vigente;
3. leer `docs/STATUS.md`;
4. leer `docs/puds/use-cases/README.md`;
5. leer el documento del CU activo y cualquier ADR enlazado;
6. inspeccionar código, diff y pruebas antes de proponer cambios;
7. preguntar solo lo que no pueda resolverse con esas fuentes.

## Producto

| Dato aprobado | Valor |
|---|---|
| Nombre visible | Primer Parcial |
| Slug técnico | `primer-parcial` |
| Directorio actual | `D:\project-planning` |
| Repositorio futuro | `DarksouleaterXD/primer-parcial` |
| Visibilidad futura | Pública; no implica que el remoto esté creado |
| Rama esperada de CU-0 | `feature/cu-0-inicializar-base` |
| Topología / gestor | Monorepositorio con npm workspaces `apps/*` y `packages/*` |
| Entorno principal | Windows con PowerShell 7+, Node.js 24 y npm 11 |

La raíz npm es privada para evitar publicación accidental de un paquete; esto es independiente de la visibilidad pública futura del repositorio. Las credenciales GitHub solo se necesitan al crear/publicar el remoto y no bloquean trabajo local.

Se construye una herramienta CASE colaborativa y offline-first para diseñar diagramas de clases UML, mantener un modelo canónico versionado y generar aplicaciones funcionales.

Entradas: edición manual, texto, voz, imagen y XMI. Todas convergen en `CanonicalUmlModel` después de adaptación y validación. Salidas: canvas, XMI, modelo relacional, backend Spring Boot, OpenAPI, Postman, Domain Manifest, frontend Astro/Preact y Android mediante PWA/Capacitor.

La aplicación principal usa Astro/Preact y NestJS/PostgreSQL. El backend generado siempre usa Java/Spring Boot; no debe confundirse con el backend NestJS de la herramienta. Ollama y `whisper.cpp` operan localmente.

Las fronteras de auditoría TypeORM/JPA, OpenAPI Nest/Spring, frontend generado fijo y confirmación destructiva obligatoria están aprobadas en [ADR-0001](decisions/ADR-0001-initial-technical-boundaries.md). El documento de producto se conserva intacto.

## Planificación definitiva: 12 CUs en 3 ciclos

| Ciclo | Casos de uso | Entrega usable |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 base, CU-1 cuenta/sesión, CU-2 modelado manual, CU-3 proyectos persistentes | Editor validado con historial y proyectos privados que se reabren |
| 2. Colaboración, interoperabilidad y generación | CU-4 LAN, CU-5 XMI, CU-6 backend generado, CU-7 web/Android generado | Colaboración, intercambio y aplicación generada ejecutable |
| 3. Inteligencia, visión y cierre offline | CU-8 texto, CU-9 voz, CU-10 imágenes, CU-11 solución offline | Asistentes e imagen validados y demostración integral offline |

El [plan maestro](puds/use-cases/README.md) conserva capacidades, aceptación, pruebas y matriz 30→12. El [plan histórico](puds/use-cases/history/initial-30-use-cases.md) preserva el cuerpo anterior para auditoría, no define trabajo activo. Máximo tres incrementos por CU. Modelo canónico, validador y bus se estabilizan dentro de CU-2 antes del canvas y de los CUs que los consumen.

## Acuerdo de trabajo con el usuario

El proyecto se implementa un caso de uso por vez y en orden lineal. El usuario no debe tener que conocer de antemano comandos, estructura de repositorio o pasos implícitos; cada entrega debe explicar exactamente qué ejecutar, dónde y qué resultado esperar.

Flujo de cada CU:

1. El usuario pide el plan de `CU-X`.
2. Se entrega un plan implementable que cubre código, pruebas, revisión manual y actualizaciones documentales. Si el CU es grande, se divide en máximo tres incrementos.
3. El usuario aprueba el plan y pide el prompt.
4. Se entrega un prompt autocontenido para el agente: estado verificado, alcance, exclusiones, decisiones de diseño, pasos ordenados, archivos probables, pruebas, documentación y definición de terminado.
5. El agente modifica el proyecto.
6. El usuario ejecuta tests y pruebas manuales. Puede pedir ajustes de interfaz, correcciones, regresiones o cambios pequeños.
7. Cada iteración de corrección también actualiza el documento del CU y cualquier documento que haya quedado desactualizado.
8. Se repite hasta cumplir aceptación.
9. Se cierra `CU-X-nombre.md`, se actualiza `docs/STATUS.md` y se proporcionan comandos concretos de commit y push.
10. Solo entonces se pasa al siguiente CU.

Si se corrige un CU anterior cuando el proyecto ya avanzó, el cambio se agrega al documento histórico de ese CU, al estado y a los documentos afectados. Se entrega un nuevo commit `fix(cu-X): ...` y se hace push del cambio nuevo; no se altera la evidencia histórica.

## Qué debe contener un plan

- estado inicial comprobado y dependencias;
- objetivo observable por el usuario;
- alcance y fuera de alcance;
- uno a tres incrementos;
- decisiones de dominio, arquitectura, contratos, datos y UI;
- orden exacto de implementación;
- estrategia de pruebas unitarias, integración, E2E y manuales;
- archivos de documentación que se crean o actualizan;
- riesgos, rollback y definición de terminado;
- comandos de preparación y verificación explicados para una persona principiante.

El plan no modifica código. Cualquier decisión nueva que cambie arquitectura o producto debe señalarse para aprobación.

## Qué debe contener el prompt para el agente

- rol y resultado esperado;
- fuentes que debe leer primero;
- rama y CU/incremento exactos;
- hechos verificados del estado actual;
- restricciones globales de `AGENTS.md`;
- alcance funcional, reglas y errores;
- diseño técnico ya decidido y límites de libertad;
- pasos de trabajo pequeños y ordenados;
- pruebas obligatorias y comandos;
- pruebas manuales que el usuario realizará;
- documentación exacta que debe actualizar;
- prohibiciones: no inventar contratos, no cambiar stack, no saltar pruebas, no declarar benchmarks no ejecutados;
- formato de reporte final: archivos, decisiones, pruebas, riesgos y próximos pasos.

## Evidencia y documentación

La documentación final se usará para producir un documento Word académico. Por eso debe representar el 100 % de la implementación real, incluidos errores conocidos, limitaciones y decisiones. No debe contener resultados ficticios ni texto genérico que contradiga el código.

Cada CU genera `docs/puds/use-cases/CU-X-nombre.md`. Puede además actualizar:

- documento de producto, solo si el usuario aprueba un cambio de producto;
- ADR, si se toma una decisión técnica duradera;
- documentación de arquitectura y contratos;
- modelo de datos y migraciones;
- guías de instalación, operación y pruebas;
- benchmark y comparación correspondiente;
- `docs/STATUS.md` siempre.

## Benchmarks

Las capacidades configurables de texto, visión y voz se estabilizan con `docs/benchmarks/external-services.md`. Se conserva un dataset versionado y se mide exactitud, validez estructural, latencia y recursos. Los casos físicos —fotografías, escritura manual, audio, micrófonos o ruido— incluyen una lista de pruebas manuales guiadas.

Los modelos fijados en el producto son baselines, no resultados garantizados. Comparar otro modelo no autoriza reemplazar el baseline. Un reemplazo necesita evidencia reproducible, aprobación y actualización documental explícita.

## Primer paso acordado

El primer caso es `CU-0 — Inicializar la base ejecutable del proyecto`. Al terminar debe existir la estructura de repositorio aprobada, el frontend Astro y el backend NestJS ejecutándose, un health check simple, una comprobación real de comunicación web → API, configuración local reproducible, pruebas básicas verdes y documentación de arranque.

El plan de CU-0 está aprobado con tres incrementos:

1. **CU-0.1 — Repositorio, configuración y documentación inicial:** único incremento autorizado en esta sesión. Configuración raíz, Compose y permisos OpenCode, plan 12/3, ADR, guías y validación estática. Código de aplicaciones no iniciado.
2. **CU-0.2 — Aplicaciones y servicios conectados:** futura inicialización Astro/NestJS, instalación/lockfile, PostgreSQL/TypeORM, health, OpenAPI principal y comunicación web→API. Requiere autorización específica posterior y resolver el motor Docker.
3. **CU-0.3 — Calidad, reproducibilidad y cierre:** checks/tests/CI, manuales y evidencia de build proporcionada por usuario/CI; cierre documental completo y comandos finales de commit/push.

Configuración local aprobada: PostgreSQL `18.6-alpine` con volumen nombrado, healthcheck y publicación exclusiva en `127.0.0.1:5432`. Docker CLI está disponible, pero el motor no está operativo según diagnóstico previo/estado informado; CU-0.1 solo valida Compose sin iniciar contenedores. Revalidar ocupación de 5432 antes de CU-0.2: un diagnóstico previo detectó un servicio, no comprobado de nuevo aquí. No detenerlo ni cambiar su configuración sin identificarlo y acordarlo.

## Continuar en futuras sesiones

1. Leer completos AGENTS, este contexto, STATUS, producto, plan maestro y benchmarks; después el [CU-0 activo](puds/use-cases/CU-0-inicializar-base.md) y ADR-0001.
2. Comprobar `git status --short --branch` y `git branch --show-current`. Si no está en `feature/cu-0-inicializar-base`, detenerse y reportarlo. Inspeccionar cambios existentes como posible trabajo del usuario.
3. Consultar evidencia del CU y estado: configuración no equivale a aplicación ejecutable. No asumir dependencias instaladas, pruebas realizadas, remoto publicado ni build verde.
4. Solicitar/recibir el prompt aprobado de CU-0.2 antes de implementarlo. Mientras tanto no instalar, crear lockfile/apps/paquetes futuros, iniciar contenedores ni implementar health/TypeORM/OpenAPI.
5. Revalidar entorno para el siguiente incremento, sin asumir que el motor o puerto ya se resolvieron. Completar sus pruebas reales y actualizar documentos en cada corrección.
6. Mantener `opencode.json` apuntando al documento del CU activo cuando cambie el CU. Reiniciar OpenCode para cargar cambios de configuración; no habilitar auto-aprobación. Commit/push y acciones GitHub requieren solicitud explícita y ajuste consciente de la política que actualmente los deniega.

Las comprobaciones iniciales están en [desarrollo](development/README.md); resultados y pendientes en [STATUS](STATUS.md) y el documento del CU, no en supuestos heredados de otro chat.

## Recordatorio para el asistente

- Hablar en español claro.
- No asumir que el usuario sabe dónde ejecutar un comando o cómo interpretar su salida.
- Explicar primero el resultado y luego los pasos.
- Inspeccionar antes de diagnosticar o editar.
- Mantener el orden de CUs salvo bloqueo documentado.
- No implementar el siguiente CU por adelantado.
- No hacer acciones externas, commits o push sin autorización explícita.
