# CU-2 — Modelar diagramas UML manualmente

## Estado y trazabilidad

- **Estado del CU: En implementación.**
- Dependencias: CU-0 terminado y CU-1 terminado/archivado.
- Actor principal: modelador autenticado.
- Origen histórico: CUs anteriores 1–5, reagrupados en el plan 12/3.
- Incremento activo: **CU-2.1 - Modelo y validacion**, bloqueo critico de parser remediado localmente; nueva reproduccion limpia pendiente antes de verify/sync/archive.
- Cambio OpenSpec activo: `cu-2-1-modelo-validacion`.
- CU-2.2 — Comandos e historial: pendiente.
- CU-2.3 — Workspace visual: pendiente.

CU-2.1 fue aprobado explícitamente antes de implementar. El código aplicado se limita al dominio UML, serialización, perfil y validación definidos por OpenSpec; la integración y el cierre siguen pendientes de evidencia real.

## Objetivo y resultado usable

CU-2 debe convertir la sesión autenticada de CU-1 en un editor manual de diagramas de clases basado en una única fuente de verdad. Al cerrar el CU completo existirán modelo canónico, validación, Command Bus, historial Undo/Redo y workspace D3/SVG en memoria. La persistencia y reapertura real de proyectos pertenece a CU-3.

CU-2.1 entrega únicamente el fundamento de dominio: documento canónico versionado, serialización, separación semántica/layout, perfil de generación y validación determinista.

## Decisiones obligatorias heredadas

- `CanonicalUmlModel` es la única fuente de verdad semántica.
- `DiagramLayout` almacena solo datos visuales referenciados por ID.
- Canvas, SVG, D3 y ELK no se persisten como dominio.
- Toda mutación del UML pasará por `UmlCommandBus` desde CU-2.2.
- UML se basa en el subconjunto UML 2.5.1 aprobado.
- Metadatos de generación permanecen separados del UML puro.
- Ningún incremento de CU-2 introduce persistencia TypeORM de proyectos, realtime, XMI, generación o IA.
- Acciones destructivas del editor deberán requerir confirmación cuando se implementen en el workspace.

## Incrementos

| Incremento | Alcance | Estado |
|---|---|---|
| CU-2.1 | `ProjectDocument`, `CanonicalUmlModel`, `DiagramLayout`, perfil, serializacion, IDs, fixtures y validador | Remediacion runtime aplicada; nueva reproduccion limpia pendiente |
| CU-2.2 | `UmlCommandBus`, executor, comandos manuales, revisión local, historial máximo 100, Undo/Redo | Pendiente |
| CU-2.3 | Shell CASE, toolbox/inspector, D3+SVG, ELK, zoom/pan/selección/movimiento/relaciones, diagnósticos navegables | Pendiente |

## CU-2.1 — Modelo y validación

### Alcance funcional

El documento en memoria contiene:
- UUID y versión de esquema;
- nombre y propietario de sesión;
- revisión local;
- timestamps;
- modelo UML;
- layout;
- perfil de generación.

El modelo UML soporta:
- paquetes;
- clases;
- atributos/propiedades;
- operaciones y parámetros;
- visibilidad;
- tipos primitivos y referencias a clasificadores;
- enumeraciones;
- asociaciones con dos extremos;
- agregación y composición mediante semántica del extremo;
- multiplicidades;
- generalización.

El perfil de generación soporta, separado del UML:
- `entity`;
- `auditable`;
- `readOnly`;
- `searchable`;
- `crud`;
- `required`;
- `unique`;
- `sortable`;
- `defaultSort`.

### Validación

El motor único produce diagnósticos con:
- `severity`;
- `code`;
- mensaje;
- `path` lógico;
- `elementId` opcional.

Reglas mínimas de CU-2.1:
- IDs únicos;
- nombres requeridos no vacíos;
- referencias existentes y compatibles;
- multiplicidad válida;
- ausencia de ciclos de paquete y generalización;
- referencias de layout existentes;
- referencias del perfil existentes y compatibles;
- versión de documento soportada.

Las políticas `edit`, `save`, `import` y `generate` comparten reglas y códigos. CU-2.1 solo define/valida esas políticas; no implementa guardado, XMI ni generación.

## Flujos esperados de CU-2.1

1. La sesión autenticada suministra `ownerId` al crear un documento nuevo.
2. La fábrica crea documento versión 1, revisión 0, timestamps y colecciones vacías.
3. Fixtures o consumidores de dominio agregan estructuras UML válidas en pruebas.
4. El validador recorre documento, layout y perfil y devuelve diagnósticos deterministas.
5. La serialización y deserialización preservan el documento válido.
6. Una versión no soportada, ID duplicado, referencia rota, ciclo o multiplicidad inválida produce error tipado y nunca un falso válido.

CU-2.1 no expone estas acciones como editor visual; las mutaciones públicas se diseñan en CU-2.2. La implementación actual vive en `packages/uml-domain` y no importa UI, backend, ORM ni librerías de canvas.

## Fuera de alcance de CU-2.1

- Command Bus y comandos de edición.
- Undo/Redo e historial.
- Canvas, D3, SVG, ELK, Shoelace y Nanostores.
- Toolbox, inspector, menús contextuales y rutas del editor.
- Guardado o reapertura en PostgreSQL.
- CRUD/ownership persistente de proyectos.
- WebSocket, colaboración y presencia.
- XMI.
- UML → relacional y generación de código.
- IA, lenguaje natural, voz e imagen.
- Offline integral.

## Implementación actual

- Nuevo workspace `@primer-parcial/uml-domain` sin dependencias de runtime.
- `ProjectDocument` versión 1 con fábrica inyectable de ID/reloj.
- Modelo canónico con paquetes, clases, atributos, operaciones, parámetros, enumeraciones, asociaciones y generalizaciones.
- `DiagramLayout` separado y perfil de generación referenciado por IDs.
- Serializador estable y parser versionado sin documentos parciales ante errores estructurales.
- Validador único con diagnósticos ordenados y políticas `edit`, `save`, `import` y `generate`.
- Fixtures y pruebas unitarias del dominio.

Aún no se registra como cerrado ningún check raíz, reproducción limpia ni evidencia CI; esas verificaciones corresponden al bloque de integración.

## Evidencia de integracion CU-2.1 - 2026-09-15

La regresion raiz fue ejecutada correctamente con el nuevo workspace incluido: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`. La API cerro 18/18 tests, web 19 correctos con 1 integracion condicional omitida, contracts 4/4 y `uml-domain` conteo historico previo a remediacion (no vigente). `astro check` informo 0 errores, 0 warnings y 0 hints.

El control de alcance confirmo que `packages/uml-domain` no introdujo Command Bus, Undo/Redo, canvas, persistencia, XMI, generacion ni IA. `openspec validate cu-2-1-modelo-validacion --strict` y `git diff --check` fueron correctos.

Durante la regresion en esta PC se detecto una limitacion heredada de infraestructura de tests de CU-1: `apps/api/test/test-database.ts` fijaba `POSTGRES_PORT=5432`. Se corrigio para respetar `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_TEST_DB` del entorno, conservando los valores historicos como fallback. Esto no cambia el comportamiento productivo ni el contrato de CI/reproduccion limpia.

La reproduccion limpia permanece pendiente porque debe ejecutarse sobre un snapshot Git versionado que incluya CU-2.1.

## Pruebas requeridas para cerrar CU-2.1

- Unitarias del documento, modelo, perfil, serialización y validador.
- Fixtures positivos y negativos de todo el subconjunto incorporado.
- Round-trip completo de semántica/layout/perfil.
- IDs duplicados, nombres, referencias, multiplicidad y ciclos.
- Políticas de validación y orden estable de diagnósticos.
- `npm run lint`.
- `npm run typecheck`.
- `npm run test`.
- `npm run build`.
- Reproducción limpia si cambia el workspace/lockfile o la receta reproducible.
- `openspec validate cu-2-1-modelo-validacion --strict`.
- `git diff --check`.
- Regresión de CU-0/CU-1 sin cambiar sus contratos.

No se requiere E2E de navegador en CU-2.1 porque todavía no existe UI UML; el E2E manual de diagramación corresponde al cierre de CU-2.3.

## Documentación a mantener

- este documento;
- `docs/STATUS.md`;
- `docs/PROJECT_CONTEXT.md`;
- arquitectura/desarrollo si cambia un contrato o comando público;
- OpenSpec del incremento;
- plan maestro si cambia alcance aprobado, nunca para ocultar una desviación.

## Comandos finales de commit y push

Pendientes hasta implementar, verificar y cerrar CU-2.1. El parche de planificación no ejecuta `git add`, `git commit` ni `git push`.

## Historial - cierre local previo al verify critico - 2026-09-15

CU-2.1 - Modelo y validacion queda implementado y verificado localmente con 9/9 tareas OpenSpec completas.

La reproduccion limpia final paso correctamente sobre el snapshot Git `3c030ef6674f82b674bd48823a95e2623c22f8d1`.

Evidencia real:
- `uml-domain`: conteo historico previo a remediacion (no vigente) tests;
- E2E Chromium: 5/5;
- build raiz completo: API, web, contracts y `uml-domain`;
- PostgreSQL aislado: host port `55432`;
- proyecto Compose aislado: `primer-parcial-clean-4bf13daade14`;
- health final: `available`;
- PostgreSQL temporal detenido correctamente al finalizar;
- `git diff --check`: correcto;
- OpenSpec strict: correcto.

No se implementaron Command Bus, Undo/Redo, canvas, persistencia de proyectos, XMI, generacion ni IA en CU-2.1.

Estado: listo para `/opsx-verify`, `/opsx-sync` y `/opsx-archive`.

## Estado vigente tras remediacion del verify - 2026-09-15

El verify final detecto un bloqueo critico: `parseProjectDocument` no validaba recursivamente el contrato cerrado. La remediacion agrega validacion runtime exhaustiva y regresiones negativas para discriminantes, enums, UUID, timestamps, primitivas, asociaciones, layout, perfil y propiedades no permitidas.

La reproduccion limpia registrada antes de esta remediacion se conserva como historial, pero ya no certifica el codigo actual. La tarea 3.2 queda reabierta hasta versionar esta correccion y ejecutar nuevamente `reproduce-clean`.

Estado vigente: no archivar CU-2.1 todavia.

## Cierre local CU-2.1 - 2026-09-15

CU-2.1 - Modelo y validacion queda implementado y verificado localmente con 9/9 tareas OpenSpec completas.

La reproduccion limpia final paso correctamente sobre el snapshot Git `3c030ef6674f82b674bd48823a95e2623c22f8d1`.

Evidencia real:
- `uml-domain`: conteo historico previo a remediacion (no vigente) tests;
- E2E Chromium: 5/5;
- build raiz completo: API, web, contracts y `uml-domain`;
- PostgreSQL aislado: host port `55432`;
- proyecto Compose aislado: `primer-parcial-clean-4bf13daade14`;
- health final: `available`;
- PostgreSQL temporal detenido correctamente al finalizar;
- `git diff --check`: correcto;
- OpenSpec strict: correcto.

No se implementaron Command Bus, Undo/Redo, canvas, persistencia de proyectos, XMI, generacion ni IA en CU-2.1.

Estado: listo para `/opsx-verify`, `/opsx-sync` y `/opsx-archive`.

## Estado vigente post-remediacion verify

- Rama de trazabilidad: $TargetBranch.
- Runtime-contract remediation vigente desde ec30194.
- Fixture composite valido: presente.
- Validacion de composite valido: cubierta.
- Round-trip de composite valido: cubierto.
- Tests uml-domain post-remediacion: 37/37 correctos.
- La reproduccion limpia del snapshot 3c030ef6674f82b674bd48823a95e2623c22f8d1 es historica y no certifica el codigo actual.
- OpenSpec 3.2 permanece pendiente hasta versionar este estado y ejecutar
eproduce-clean nuevamente.
- No archivar CU-2.1 todavia.

## Evidencia vigente final CU-2.1 - 2026-09-15

La reproduccion limpia post-remediacion paso correctamente sobre el snapshot Git $Snapshot.

Evidencia vigente:
- rama: $TargetBranch;
- runtime-contract remediation: incluida;
- composite valido: cubierto por validacion y round-trip;
- tests uml-domain post-remediacion: 37/37;
- E2E del snapshot limpio: correctos;
- build raiz del snapshot limpio: correcto;
- PostgreSQL aislado: host port $PostgresHostPort;
- Compose aislado: $ComposeProject;
- health final: vailable;
- contenedor PostgreSQL temporal detenido correctamente;
- OpenSpec: 9/9 tareas completas.

La evidencia anterior basada en 3c030ef6674f82b674bd48823a95e2623c22f8d1 permanece solo como historial y no es la evidencia de cierre vigente.

Estado: listo para repetir /opsx-verify. No ejecutar sync/archive hasta que ese verify no tenga CRITICAL.
