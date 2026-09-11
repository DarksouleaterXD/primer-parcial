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

Se construye una herramienta CASE colaborativa y offline-first para diseñar diagramas de clases UML, mantener un modelo canónico versionado y generar aplicaciones funcionales.

Entradas: edición manual, texto, voz, imagen y XMI. Todas convergen en `CanonicalUmlModel` después de adaptación y validación. Salidas: canvas, XMI, modelo relacional, backend Spring Boot, OpenAPI, Postman, Domain Manifest, frontend Astro/Preact y Android mediante PWA/Capacitor.

La aplicación principal usa Astro/Preact y NestJS/PostgreSQL. El backend generado siempre usa Java/Spring Boot; no debe confundirse con el backend NestJS de la herramienta. Ollama y `whisper.cpp` operan localmente.

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

Antes de ejecutar CU-0 se deben confirmar los datos externos que no aparecen en el producto: cuenta u organización de GitHub, nombre definitivo del proyecto/repositorio y disponibilidad local de Git, Node, gestor de paquetes, Docker y credenciales de GitHub. La recomendación actual es monorepo; si el usuario requiere repositorios separados, se decide antes de crear repos.

## Recordatorio para el asistente

- Hablar en español claro.
- No asumir que el usuario sabe dónde ejecutar un comando o cómo interpretar su salida.
- Explicar primero el resultado y luego los pasos.
- Inspeccionar antes de diagnosticar o editar.
- Mantener el orden de CUs salvo bloqueo documentado.
- No implementar el siguiente CU por adelantado.
- No hacer acciones externas, commits o push sin autorización explícita.
