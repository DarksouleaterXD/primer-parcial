# CU-2 — Modelar diagramas UML manualmente

## Estado y trazabilidad

- **Estado del CU completo: En implementación.**
- Dependencias: CU-0 terminado y CU-1 terminado/archivado.
- Actor principal: modelador autenticado.
- Origen histórico: CUs anteriores 1–5, reagrupados en el plan 12/3.
- CU-2.1 — Modelo y validación: implementación completa, 9/9 tareas y verify estático sin CRITICAL.
- Evidencia `reproduce-clean` vigente y conductualmente verificada: snapshot `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`.
- Gate de CU-2.1: verify final sobre la documentación consolidada y cierre formal `sync/archive`.
- Cambio OpenSpec activo: `cu-2-2-comandos-historial`.
- CU-2.2 — Comandos e historial: implementación integrada; 19/20 tareas, con verificación final pendiente.
- CU-2.3 — Workspace visual: pendiente.

CU-2.1 fue aprobado explícitamente antes de implementar. Su alcance se limita al dominio UML, serialización, perfil y validación definidos por OpenSpec. CU-2.2 y CU-2.3 siguen fuera de este incremento.

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
| CU-2.1 | `ProjectDocument`, modelo canónico, layout, perfil, serialización y validación | Implementado; 9/9; verify sin CRITICAL; verificación de comportamiento completada; verify final y `sync/archive` pendientes |
| CU-2.2 | `UmlCommandBus`, executor, comandos manuales, revisión local, historial máximo 100, Undo/Redo | Implementado; 19/20 tareas, pendiente solo la verificación final 5.4 |
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
- Runtime-contract remediation `ec30194` incorporada.
- Composite válido y round-trip cubiertos.

Los checks raíz y la reproducción limpia cuentan con evidencia vigente. La verificación de comportamiento autorizada se completó mediante `reproduce-clean` sobre el snapshot `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`.

## Evidencia de integración CU-2.1

Evidencia vigente:
- `uml-domain`: 37/37 tests post-remediación;
- API/web/contracts: regresión raíz previamente ejecutada sin romper contratos de CU-0/CU-1;
- `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`: ejecutados correctamente en la reproducción limpia vigente;
- E2E Chromium: incluido en la reproducción limpia vigente;
- `openspec validate cu-2-1-modelo-validacion --strict`: correcto;
- `git diff --check`: correcto;
- snapshot limpio conductualmente verificado: `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`;
- PostgreSQL aislado: `55432`;
- Compose: `primer-parcial-clean-fe04b87c22b7`;
- health: `available`.

Durante la regresión se corrigió la infraestructura de tests API para respetar `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_TEST_DB`, manteniendo los valores históricos como fallback. Esto no cambia el comportamiento productivo.

El verify read-only más reciente confirmó **CRITICAL: None**. Después se ejecutó la verificación de comportamiento autorizada mediante `reproduce-clean` sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b` y finalizó correctamente. Gate restante: repetir el verify final sobre la documentación consolidada antes de `sync/archive`.

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

CU-2.1 ya está implementado, verificado estáticamente sin CRITICAL y verificado conductualmente mediante `reproduce-clean`. Antes del `sync/archive` resta únicamente el verify final sobre la documentación consolidada. Los cambios locales de `compose.yaml` y `opencode.json` no pertenecen al cierre de CU-2.1.

## Historial de verificación y remediación — 2026-09-15

El snapshot `3c030ef6674f82b674bd48823a95e2623c22f8d1` tuvo una reproducción limpia correcta antes de la remediación runtime. El verify posterior detectó que `parseProjectDocument` aceptaba formas JSON que violaban contratos cerrados, por lo que esa evidencia quedó histórica.

La remediación `ec30194` añadió validación runtime exhaustiva y regresiones negativas. También se agregaron fixture, validación y round-trip para un composite válido. Después de esos cambios, `uml-domain` quedó en 37/37 tests.

## Evidencia vigente final CU-2.1

- Rama: `feature/cu-2-1-modelo-validacion`.
- Snapshot Git conductualmente verificado: `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`.
- Runtime-contract remediation `ec30194`: ancestro del snapshot.
- Comando: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Software-Parcial-1\project-planning\scripts\reproduce-clean.ps1"`.
- Resultado: reproducción limpia finalizada correctamente.
- Compose aislado: `primer-parcial-clean-fe04b87c22b7`.
- PostgreSQL host port: `55432`.
- Health final: `available`.
- Contenedor temporal: `Stopped`.
- `uml-domain`: 37/37 tests post-remediación.
- Composite válido y round-trip: cubiertos.
- OpenSpec: 9/9 tareas.
- Verify estático más reciente: **CRITICAL: None**.

- Verificación de comportamiento: `reproduce-clean` completado correctamente sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`.
- Directorio temporal: `C:\Users\brand\AppData\Local\Temp\primer-parcial-clean-d402d40dfd304b98b354eabef08a57a7`.
- Compose de la verificación: `primer-parcial-clean-fe04b87c22b7`.
- PostgreSQL host port: `55432`.
- Health: `available`.
- Contenedor `primer-parcial-clean-fe04b87c22b7-postgres-1`: `Stopped` al finalizar.

La evidencia `3c030ef6674f82b674bd48823a95e2623c22f8d1` permanece únicamente como historial. La verificación de comportamiento autorizada quedó completada sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`. Gate restante antes de `sync/archive`: verify final sobre la documentación consolidada.

## CU-2.2 — Comandos e historial

La integración final expone en `@primer-parcial/uml-domain` el catálogo cerrado de 27 `UmlCommand`, sus resultados tipados y `UmlCommandBus` como única frontera pública con estado local. El bus acepta solo envelopes cerrados, delega el candidato aislado al executor, aplica una validación `edit`, incrementa la revisión solo al aceptar y conserva snapshots privados completos para Undo/Redo con capacidad exacta de 100.

La superficie pública auditada mantiene `UmlCommandBus`, contratos de comando, `UmlHistoryResult`, `currentDocument`, `canUndo`, `canRedo`, `submit`, `undo` y `redo`. El executor, stacks, tupla y capacidad no se exportan desde el índice del paquete; no hay dependencias de adaptadores.

Pruebas ejecutadas en esta integración:
- `npm run test --workspace @primer-parcial/uml-domain`: 5 archivos, **69/69** tests correctos.
- `npm run typecheck --workspace @primer-parcial/uml-domain`: correcto.
- `npm run typecheck`: correcto en API, web (0 errores, 0 warnings, 0 hints), contracts y `uml-domain`.
- `npm run lint`: correcto después de eliminar dos imports sin uso en los archivos de CU-2.2.
- `npm run test`: no cerró en verde porque los 14 tests de API que requieren PostgreSQL fallaron al no existir el rol local `primer_parcial_local`; web terminó 19 correctos y 1 omitido, contracts 4/4 y `uml-domain` 69/69.
- `openspec validate cu-2-2-comandos-historial --strict` y `git diff --check`: correctos.

No se ejecutaron `npm run build` ni `reproduce-clean` en CU-2.2 por restricción explícita. Tampoco se implementaron UI/canvas, persistencia, red, realtime, XMI, generación, IA, dependencias ni refactorizaciones ajenas. La tarea 5.4 queda pendiente hasta completar los checks autorizados que no se pueden declarar sin build y reproducción limpia; CU-2 completo sigue **en implementación** porque CU-2.3 permanece pendiente.
