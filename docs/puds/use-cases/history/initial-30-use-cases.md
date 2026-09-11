# Registro histórico — Plan inicial de 30 casos de uso

> Archivo de trazabilidad, no plan activo. Conserva íntegramente el cuerpo de la planificación anterior a CU-0.1, incluidos sus IDs, dependencias y nombres de documentos entonces propuestos. No representa capacidades implementadas ni exige crear esos documentos históricos. El [plan maestro vigente](../README.md) reasigna todo el alcance a 12 CUs en 3 ciclos. Las decisiones posteriores se registran en [ADR-0001](../../../decisions/ADR-0001-initial-technical-boundaries.md).

## 1. Propósito

Este es el mapa lineal de implementación del producto. Aplica el Proceso Unificado de Desarrollo de Software: está dirigido por casos de uso, centrado en la arquitectura y trabaja de forma iterativa e incremental.

Cada ciclo produce un incremento usable. Cada caso de uso se implementa, prueba, documenta y cierra antes de iniciar el siguiente. Este archivo define el orden; el detalle real de una implementación terminada queda en `CU-X-nombre.md`.

El documento de producto permanece como visión estable. `docs/STATUS.md` registra el avance real y nunca debe inferirse a partir de este plan.

## 2. Actores

| Actor | Responsabilidad |
|---|---|
| Visitante | Conocer el producto, registrarse e iniciar sesión |
| Modelador | Crear, editar, validar, guardar, importar y generar desde un proyecto UML |
| Propietario | Autorizar acceso y controlar sus proyectos; en el MVP es la autoridad de acceso |
| Colaborador autorizado | Participar en una sesión realtime permitida |
| Usuario de aplicación generada | Operar CRUD y asistente de texto/voz del sistema producido |
| Sistema anfitrión | Ejecutar API, PostgreSQL, IA, STT, generación y realtime en local/LAN |
| Enterprise Architect | Sistema externo que intercambia XMI 2.1 |

## 3. Convenciones

- ID estable: `CU-0`, `CU-1`, etc. No se renumera un CU cerrado.
- Documento de cierre: `docs/puds/use-cases/CU-X-nombre.md`.
- Un CU grande puede tener máximo tres incrementos. No son CUs ocultos: todos forman parte del mismo objetivo y documento.
- Dependencia significa que el CU anterior debe estar cerrado o tener una excepción explícita.
- `Automática` abarca unitarias, integración, contrato, compilación o E2E según corresponda.
- `Manual` indica comprobación humana guiada y evidencia mínima.
- Todo CU actualiza `docs/STATUS.md`, su documento individual y cualquier fuente que haya quedado desactualizada.

Estados permitidos: `Pendiente`, `Planificado`, `En implementación`, `En validación`, `Bloqueado` y `Terminado`.

## 4. Definición global de terminado

Un CU está terminado únicamente cuando:

1. cumple todos sus criterios obligatorios;
2. sus incrementos están integrados en la rama acordada;
3. build, lint, tipos y pruebas del alcance están verdes;
4. se ejecutaron las comprobaciones manuales definidas;
5. no existen errores silenciosos ni secretos incluidos;
6. el documento `CU-X-nombre.md` describe exactamente lo implementado;
7. `docs/STATUS.md` está actualizado;
8. benchmarks o ADR obligatorios están cerrados;
9. el documento termina con comandos concretos de commit y push.

No basta con crear archivos, mocks o interfaces sin comportamiento verificable.

## 5. Mapa de ciclos

| Ciclo | Fase PUDS predominante | Casos de uso | Incremento usable |
|---|---|---|---|
| 0. Inicio ejecutable | Inicio | CU-0 | Web y API vacías conectadas, health y CI |
| 1. Editor UML local | Elaboración | CU-1 a CU-5 | Editor manual en memoria, validación y Undo/Redo |
| 2. Proyectos privados persistentes | Elaboración/Construcción | CU-6 a CU-8 | Cuenta, ownership, guardado y reapertura |
| 3. Colaboración LAN | Construcción | CU-9 a CU-11 | Edición simultánea, presencia y recuperación |
| 4. Generación backend determinista | Construcción | CU-12 a CU-16 | Backend Spring compilable, CRUD, OpenAPI, Postman y manifiesto |
| 5. Aplicación generada web y Android | Construcción | CU-17 a CU-20 | CRUD web/PWA/Android ejecutable y portable |
| 6. Asistentes de texto seguros | Construcción | CU-21 a CU-24 | Operación textual validada en la app generada y en UML |
| 7. Voz local | Construcción | CU-25 a CU-26 | Comandos por voz en ambos contextos |
| 8. Interoperabilidad, visión y transición | Construcción/Transición | CU-27 a CU-29 | XMI, imagen a UML y demostración completa offline |

---

# Ciclo 0 — Inicio ejecutable

## Objetivo del ciclo

Eliminar riesgos de entorno y demostrar la comunicación mínima entre frontend y backend antes de construir dominio. El incremento debe poder clonarse, configurarse y ejecutarse siguiendo una guía para principiantes.

## CU-0 — Inicializar la base ejecutable del proyecto

**Actor iniciador:** equipo de desarrollo.
**Dependencias:** ninguna.
**Resultado:** repositorio base, web Astro/Preact y API NestJS/PostgreSQL levantadas, health comprobable y web conectada a la API.

### Incrementos

1. **Repositorio y herramientas:** confirmar nombre y cuenta/organización de GitHub, aprobar monorepo o registrar ADR alternativo, crear estructura, versiones fijadas, configuración, variables de ejemplo y scripts comunes.
2. **Aplicaciones conectadas:** levantar `apps/web` y `apps/api`, implementar health simple, configurar CORS/URL por entorno y mostrar desde la web el estado real de la API.
3. **Calidad y documentación:** checks mínimos, smoke test, CI, guía de instalación/arranque y plantillas documentales.

### Flujo principal

1. El desarrollador clona e instala usando versiones documentadas.
2. Configura variables a partir de ejemplos sin secretos.
3. Inicia PostgreSQL, API y web.
4. Consulta el health de la API.
5. Abre la web y observa que la API está disponible.

### Alternativas y errores

- Si falta una herramienta, la guía indica instalación y verificación.
- Si PostgreSQL no está disponible, la API informa el componente fallido sin revelar credenciales.
- Si la URL o CORS es incorrecto, la web muestra error recuperable, no un falso estado saludable.

### Aceptación y pruebas

- Clonado limpio reproducible; versiones reales compatibles con Node 24 LTS y NestJS 11.
- Health responde de manera estable y distingue vida de dependencias cuando se implemente readiness.
- La pantalla consume la API; no usa un valor hardcodeado.
- Tests unitarios/smoke, build, lint y tipos verdes en local y CI.
- La API principal publica su contrato inicial con `@nestjs/swagger` y se actualiza en los CUs que agreguen rutas.
- Prueba manual desde navegador documentada con URL y resultado esperado.

### Documentación

Crear `CU-0-inicializar-base.md`, README de raíz, guía de desarrollo, variables de entorno, arquitectura inicial y actualizar estado. No se implementa dominio UML, auth ni CRUD en CU-0.

---

# Ciclo 1 — Editor UML local

## Objetivo del ciclo

Entregar un editor de clases UML usable en una sola sesión local. Al finalizar se puede crear un modelo, editarlo desde el canvas, validarlo y deshacer/rehacer sin persistencia ni colaboración.

## CU-1 — Crear y mantener el documento UML canónico

**Actor:** Modelador.
**Dependencia:** CU-0.
**Resultado:** `ProjectDocument` tipado con `UmlModel` semántico y `DiagramLayout` visual separado.

### Incrementos

1. Definir IDs, metadatos, revisión, timestamps, clases, atributos/propiedades, operaciones, visibilidad, tipos, enums, paquetes y perfil de generación.
2. Definir asociaciones, agregación, composición, generalización, extremos y multiplicidades; separar layout y serialización versionada.

### Flujo y errores

El sistema crea un documento vacío, agrega elementos mediante fábricas de dominio y produce una representación serializable estable. IDs duplicados, referencias rotas o datos visuales mezclados con semántica se rechazan.

### Aceptación y pruebas

- Ninguna dependencia de UI, NestJS, TypeORM o IA dentro del dominio.
- Round-trip de serialización conserva semántica y layout.
- Fixtures cubren todo el subconjunto UML obligatorio y metadatos propios diferenciados.
- Tests unitarios de invariantes, IDs, multiplicidad y versionado.

### Documentación

Crear `CU-1-documento-uml-canonico.md` y documentar modelo de dominio, perfil propio y formato versionado aprobado.

## CU-2 — Validar un modelo UML

**Actor:** Modelador y todos los adaptadores del sistema.
**Dependencia:** CU-1.
**Resultado:** un motor único devuelve diagnósticos navegables y decide si una operación puede continuar.

### Incrementos

1. Contrato de diagnóstico: severidad, código, mensaje, path lógico y elemento.
2. Reglas del subconjunto UML y políticas por contexto: edición, guardado, importación y generación.

### Flujo y errores

El actor solicita validar; el motor recorre el modelo; presenta errores y advertencias; errores bloqueantes impiden la acción correspondiente. Un fallo interno del validador nunca se interpreta como modelo válido.

### Aceptación y pruebas

- El mismo motor se reutiliza desde todos los consumidores.
- Códigos estables, mensajes comprensibles y navegación por elemento.
- Advertencias no bloquean por defecto; errores sí cuando corresponde.
- Tabla de reglas y pruebas unitarias positivas/negativas por regla.

### Documentación

Crear `CU-2-validar-modelo-uml.md` y catálogo de diagnósticos.

## CU-3 — Editar el UML mediante comandos

**Actor:** Modelador.
**Dependencias:** CU-1 y CU-2.
**Resultado:** todas las mutaciones manuales pasan por `UmlCommandBus` y producen resultado/revisión controlados.

### Incrementos

1. Contratos, executor y comandos de clase/atributo/enum.
2. Comandos de relaciones, multiplicidades, generalización, movimiento y metadatos.

### Flujo y errores

Una UI/adaptador crea un comando; el bus valida forma y precondiciones; el executor calcula el documento resultante; el validador comprueba; se acepta o se devuelve un error tipado. Un comando inválido no deja mutación parcial.

### Aceptación y pruebas

- Ninguna mutación pública evita el bus.
- Cada intención es atómica e identificable.
- Tests de éxito, precondición, elemento inexistente, colisión, referencia rota y atomicidad.
- El contrato conceptual puede reutilizarse en realtime e IA sin acoplar transporte.

### Documentación

Crear `CU-3-editar-uml-con-comandos.md` y catálogo inicial de comandos.

## CU-4 — Deshacer y rehacer ediciones locales

**Actor:** Modelador.
**Dependencia:** CU-3.
**Resultado:** historial local configurable, inicialmente de 100 operaciones, con Undo/Redo correcto.

### Flujo y errores

Tras ejecutar comandos, el actor deshace o rehace. Una nueva edición después de deshacer invalida la rama de redo. Los comandos rechazados y presencia no entran al historial. Al alcanzar el límite se elimina historia antigua de manera definida.

### Aceptación y pruebas

- Restauración exacta de semántica, layout y revisión local definida.
- Límites vacío, 100+, secuencias mixtas y comando fallido probados.
- La estrategia elegida —snapshot o compensación— y su costo quedan documentados.

### Documentación

Crear `CU-4-deshacer-rehacer.md` y registrar estrategia de historial.

## CU-5 — Diagramar visualmente en el workspace UML

**Actor:** Modelador.
**Dependencias:** CU-2, CU-3 y CU-4.
**Resultado:** canvas D3/SVG proyecta el documento y permite diagramación manual completa del subconjunto MVP.

### Incrementos

1. Shell CASE, grid, nodos custom, zoom, pan, selección, ajuste a contenido y auto-layout ELK inicial.
2. Toolbox e inspector para clases, atributos, operaciones, enums y metadatos; movimiento emite `MoveNode`.
3. Relaciones UML, multiplicidades, generalización, diagnósticos navegables, menús contextuales y Undo/Redo visible.

### Flujo y errores

El actor elige una herramienta, crea o selecciona elementos, edita propiedades y relaciones; la UI emite comandos; el canvas vuelve a proyectar el documento aceptado. Errores aparecen en consola técnica y permiten enfocar el elemento. La UI no muta objetos D3 como dominio.

### Aceptación y pruebas

- Identidad visual CASE clara, no dashboard genérico; responsive según producto.
- Relaciones, handles, etiquetas y multiplicidades legibles.
- Unit/component tests para adaptadores e inspector; Playwright para flujo manual, validación y Undo/Redo.
- Prueba manual de accesibilidad básica, tablet y móvil de revisión.

### Documentación

Crear `CU-5-workspace-uml.md`, guía de interfaz y capturas/evidencia autorizada. Registrar deuda visual sin falsear aceptación funcional.

---

# Ciclo 2 — Proyectos privados persistentes

## Objetivo del ciclo

Convertir el editor local en una aplicación privada que conserva proyectos y layout entre sesiones, con autorización por propietario y revisión optimista.

## CU-6 — Registrarse e iniciar sesión

**Actor:** Visitante.
**Dependencia:** CU-0.
**Resultado:** landing, registro, login, sesión JWT y logout con contraseñas protegidas.

### Incrementos

1. Persistencia de usuario, bcrypt, Passport/JWT, validación Zod y errores seguros.
2. Landing y pantallas de auth con identidad visual, manejo de sesión y rutas protegidas.

### Flujo y errores

El visitante registra credenciales válidas, inicia sesión y entra a proyectos. Duplicados, credenciales incorrectas, token vencido o payload inválido producen respuestas uniformes sin enumeración sensible.

### Aceptación y pruebas

- Contraseña nunca se almacena ni registra en texto plano.
- Auth unit/integration y E2E de registro, login, logout, expiración y acceso anónimo.
- UI accesible y responsive; secretos solo por entorno.

### Documentación

Crear `CU-6-autenticacion.md`, modelo de amenazas mínimo y guía de variables.

## CU-7 — Administrar proyectos propios

**Actor:** Propietario.
**Dependencias:** CU-1 y CU-6.
**Resultado:** crear, listar, abrir, renombrar y eliminar proyectos autorizados.

### Flujo y errores

El propietario ve solo sus proyectos, crea uno, lo abre o administra. Un ID inexistente o ajeno se responde sin filtrar existencia. Eliminar exige confirmación y política de recuperación/irreversibilidad documentada.

### Aceptación y pruebas

- Toda consulta filtra autorización en backend, no solo UI.
- UUID, ownerId, metadatos y timestamps persistidos con migración TypeORM.
- Integration/E2E con dos usuarios comprueba aislamiento.

### Documentación

Crear `CU-7-proyectos-propios.md`, esquema de datos, migración y política de borrado.

## CU-8 — Guardar y reabrir el documento con revisión

**Actor:** Propietario.
**Dependencias:** CU-2 y CU-7.
**Resultado:** semántica y layout se guardan/reabren sin pérdida, usando revisión optimista.

### Incrementos

1. Repositorio TypeORM y transacción de guardado de `ProjectDocument` versionado.
2. Carga, autosave/manual según decisión del plan, conflicto de revisión y recuperación UI.

### Flujo y errores

El actor abre un proyecto, edita y guarda con `baseRevision`; el servidor valida y persiste una nueva revisión. Si la base es obsoleta, rechaza y ofrece recargar el documento autoritativo sin sobrescritura silenciosa.

### Aceptación y pruebas

- Round-trip real contra PostgreSQL conserva modelo y layout.
- Validación bloquea persistencia cuando corresponde.
- Tests de concurrencia, rollback, versión de formato y documento corrupto.
- E2E de cerrar navegador, reabrir y comprobar el diagrama.

### Documentación

Crear `CU-8-persistencia-versionada.md`, contratos, transacciones, estrategia de autosave y recuperación.

---

# Ciclo 3 — Colaboración LAN

## Objetivo del ciclo

Permitir dos clientes autorizados sobre un anfitrión local, con servidor autoritativo, operaciones incrementales, presencia efímera y recuperación de divergencias.

## CU-9 — Editar colaborativamente en tiempo real

**Actor:** Propietario o colaborador autorizado.
**Dependencias:** CU-3 y CU-8.
**Resultado:** operaciones WebSocket aceptadas/rechazadas por revisión, persistidas y difundidas.

### Incrementos

1. Gateway `ws`, autenticación de conexión, unión al proyecto y protocolo versionado.
2. Envío de una operación por intención con `baseRevision`, ejecución por Command Bus, persistencia inmediata y broadcast.
3. Rechazo obsoleto, idempotencia, reconexión y recuperación del documento autoritativo.

### Flujo y errores

El cliente conecta, recibe estado/revisión, envía una operación y recibe aceptación con nueva revisión; los demás reciben la operación aceptada. Una operación obsoleta o no autorizada se rechaza sin mutación; el cliente resincroniza.

### Aceptación y pruebas

- No se transmite el documento completo por cada edición.
- El servidor es la única autoridad y reutiliza validador/Command Bus.
- Integration/E2E con dos clientes para orden, conflicto, duplicado, desconexión y reconexión.
- Persistencia y broadcast son coherentes ante fallos.

### Documentación

Crear `CU-9-colaboracion-realtime.md`, protocolo WebSocket, secuencias y política de conflicto.

## CU-10 — Ver presencia de participantes

**Actor:** participante de sesión.
**Dependencia:** CU-9.
**Resultado:** lista de sesiones, selección, cursor, elemento en edición y última actividad sin cambiar revisión.

### Flujo y errores

Los clientes emiten presencia limitada; el servidor la distribuye; la UI muestra etiquetas, cursores e indicadores. La presencia expira por desconexión o timeout. Paquetes excesivos se limitan y nunca se persisten como proyecto.

### Aceptación y pruebas

- Presencia separada de dominio, historial y revisión.
- Throttling, expiración, desconexión y múltiples pestañas probados.
- E2E visual con dos clientes y log compacto.

### Documentación

Crear `CU-10-presencia.md` y contrato/política de frecuencia y expiración.

## CU-11 — Operar y recuperarse en red local

**Actor:** Sistema anfitrión y clientes LAN.
**Dependencias:** CU-9 y CU-10.
**Resultado:** acceso documentado desde otros equipos, pérdida temporal de red manejada y restablecimiento coherente.

### Flujo y errores

El anfitrión publica servicios en interfaz LAN autorizada; otro cliente abre la web y colabora. Si pierde red, la UI informa estado, conserva cambios aún no enviados según política y resincroniza sin duplicar al reconectar.

### Aceptación y pruebas

- Funciona sin Internet con dependencias ya instaladas.
- Configuración de host, puertos, firewall y origen queda explicada de forma segura.
- Pruebas de corte, reconexión, anfitrión reiniciado y dos dispositivos reales cuando estén disponibles.
- No se promete edición multiusuario no autorizada; invitaciones avanzadas siguen fuera de MVP.

### Documentación

Crear `CU-11-operacion-lan.md`, guía para anfitrión/cliente y matriz de fallos.

---

# Ciclo 4 — Generación backend determinista

## Objetivo del ciclo

Transformar un UML válido en artefactos backend reproducibles: modelo relacional, aplicación Spring compilable, CRUD, OpenAPI, Postman y Domain Manifest.

## CU-12 — Transformar UML a modelo relacional

**Actor:** Modelador.
**Dependencia:** CU-2.
**Resultado:** vista previa determinista de tablas, columnas, PK, FK, índices, constraints y relaciones.

### Incrementos

1. Clases, atributos, tipos, enums, IDs, nulabilidad, unique e índices.
2. Reglas 1:1, 1:N, N:M, composición, herencia y nombres deterministas.

### Flujo y errores

El actor solicita transformar un modelo válido; el mapper produce `RelationalModel` y diagnósticos. Ambigüedad no cubierta se rechaza con instrucción para completar metadatos; la IA no decide.

### Aceptación y pruebas

- Mismo modelo/configuración produce salida equivalente.
- Reglas y precedencias documentadas con fixtures por relación.
- Colisiones de nombre, ciclos, IDs faltantes y tipos no soportados probados.

### Documentación

Crear `CU-12-mapeo-relacional.md` y especificación completa UML → relacional.

## CU-13 — Generar el esqueleto Spring Boot

**Actor:** Modelador.
**Dependencia:** CU-12.
**Resultado:** proyecto Java 21/Spring Boot 4.x/Gradle generado por Eta y compilable.

### Flujo y errores

El actor elige generar; se valida el modelo, se crea un directorio limpio/seguro y se renderizan estructura, build, configuración y paquetes. Una ruta insegura, conflicto no permitido o plantilla fallida aborta sin artefacto engañoso.

### Aceptación y pruebas

- No hay concatenación manual extensa; plantillas, helpers y entradas están separados.
- Generación reproducible y segura contra path traversal.
- Compilación real con Java 21/Gradle y smoke context test.

### Documentación

Crear `CU-13-generar-esqueleto-spring.md`, estructura generada y requisitos de toolchain.

## CU-14 — Generar persistencia y API CRUD

**Actor:** Modelador y usuario técnico del artefacto.
**Dependencias:** CU-12 y CU-13.
**Resultado:** backend generado ejecuta entidades, relaciones, validación y operaciones CRUD ampliadas.

### Incrementos

1. Entidades JPA, enums, repositorios, migración/configuración y constraints.
2. Servicios, DTOs/mappers, errores y controladores CRUD.
3. Listado, paginación, sorting, filtering, search, count y navegación de relaciones según metadatos.

### Flujo y errores

El generador crea código desde modelos válidos. El usuario inicia PostgreSQL y backend y opera la API. Entradas inválidas, duplicados, referencias ausentes y filtros no permitidos producen errores coherentes.

### Aceptación y pruebas

- Compilación y tests reales del proyecto generado.
- Integration tests con PostgreSQL para todas las cardinalidades.
- El metadato `auditable` genera `createdAt` y `updatedAt` mediante mecanismos de Spring Data JPA; el proyecto principal conserva su propia auditoría TypeORM.
- No se edita el resultado para hacerlo compilar; se corrigen mapper o plantillas.
- Regenerar es idempotente según política documentada y no pisa personalizaciones no gestionadas silenciosamente.

### Documentación

Crear `CU-14-backend-crud-generado.md`, capacidades, errores y estrategia de regeneración.

## CU-15 — Producir OpenAPI y colección Postman

**Actor:** Modelador o consumidor de API.
**Dependencia:** CU-14.
**Resultado:** OpenAPI 3.1 verificable del backend generado y Postman Collection derivada.

### Incrementos

1. Anotaciones/configuración `springdoc-openapi`, schemas, parámetros, errores y exportación.
2. Conversión determinista a Postman con variables de entorno y pruebas básicas sin secretos.

### Flujo y errores

Con el backend generado, el actor obtiene OpenAPI y Postman. La colección deriva de OpenAPI; inconsistencias o endpoints no representados fallan la verificación.

### Aceptación y pruebas

- Documento valida contra su versión y cubre operaciones generadas.
- Postman importa correctamente y referencia variables, no hosts fijos.
- Contract tests comparan runtime, OpenAPI y colección.
- `@nestjs/swagger` queda reservado a la API NestJS principal.

### Documentación

Crear `CU-15-openapi-postman.md` y guía de generación/uso.

## CU-16 — Generar Domain Manifest

**Actor:** generador y asistente.
**Dependencias:** CU-12, CU-14 y CU-15.
**Resultado:** manifiesto tipado de entidades, aliases, campos, relaciones, validaciones y operaciones permitidas.

### Flujo y errores

El generador deriva el manifiesto del modelo/OpenAPI; valida consistencia; lo incluye junto a la aplicación. Una capacidad no declarada se considera no permitida.

### Aceptación y pruebas

- Esquema versionado y validable.
- Trazabilidad manifiesto ↔ UML ↔ API; no expone campos internos accidentalmente.
- Fixtures cubren aliases, permisos CRUD, search/sort y relaciones.

### Documentación

Crear `CU-16-domain-manifest.md`, esquema, versionado y reglas de derivación.

---

# Ciclo 5 — Aplicación generada web y Android

## Objetivo del ciclo

Generar una interfaz funcional que consuma la API Spring, inferir controles CRUD y producir salida PWA/Android reproducible.

## CU-17 — Generar el frontend Astro/Preact

**Actor:** Modelador.
**Dependencias:** CU-15 y CU-16.
**Resultado:** proyecto Astro/Preact compilable, navegación y páginas CRUD base derivadas.

### Incrementos

1. Esqueleto, cliente tipado cuando corresponda, configuración y navegación por entidades.
2. Listado, detalle y formularios inferidos por tipo, validación y metadatos.

### Aceptación y pruebas

- Build real y generación determinista mediante Eta.
- Regla de UI por tipo cubierta; unsupported type produce diagnóstico.
- Component tests y snapshots/fixtures semánticos, no frágiles al formato irrelevante.

### Documentación

Crear `CU-17-frontend-generado.md` y matriz tipo → control.

## CU-18 — Operar el CRUD desde el frontend generado

**Actor:** Usuario de aplicación generada.
**Dependencias:** CU-14 y CU-17.
**Resultado:** CRUD, búsqueda, filtros, orden, paginación y relaciones funcionan end-to-end.

### Incrementos

1. Crear, listar, ver, editar y eliminar con errores y confirmaciones.
2. Búsqueda, filtros, sorting, paginación y count.
3. Select/autocomplete N:1, listados 1:N y navegación de relaciones.

### Aceptación y pruebas

- E2E contra backend y PostgreSQL generados, no mocks.
- Estados loading, vacío, error y validación visibles.
- Acciones destructivas confirmadas y relaciones consistentes.
- Prueba manual responsive y flujo completo en al menos dos dominios fixture.

### Documentación

Crear `CU-18-crud-web-generado.md`, guía del usuario y limitaciones de inferencia.

## CU-19 — Empaquetar como PWA y Android

**Actor:** Modelador/usuario técnico.
**Dependencia:** CU-18.
**Resultado:** frontend estático/PWA instalable y proyecto Capacitor Android compilable.

### Incrementos

1. Manifest, assets, service worker/política de caché y build estático.
2. Capacitor, configuración segura del endpoint y build Android reproducible.

### Aceptación y pruebas

- PWA instala y actualiza sin servir HTML/API obsoletos de forma peligrosa.
- Build Android real; smoke test en emulador o dispositivo cuando esté disponible.
- Se documenta claramente qué funciones requieren al anfitrión LAN.

### Documentación

Crear `CU-19-pwa-android.md` y guías de instalación/emulador/dispositivo.

## CU-20 — Exportar y ejecutar la aplicación generada

**Actor:** Modelador y sistema anfitrión.
**Dependencias:** CU-14, CU-18 y CU-19.
**Resultado:** paquete coherente con backend, frontend, Android, OpenAPI, Postman y manifiesto, ejecutable sin Internet tras preparación.

### Flujo y errores

El actor genera/exporta, sigue README del artefacto, configura PostgreSQL y arranca. Un fallo de compilación o incompatibilidad impide declarar éxito y enlaza diagnóstico con el modelo/plantilla.

### Aceptación y pruebas

- Generación y build limpios desde un directorio vacío.
- Checksums/metadatos permiten rastrear revisión de modelo, generador y plantillas.
- Smoke E2E de CRUD con red externa desconectada.

### Documentación

Crear `CU-20-exportar-aplicacion.md`, README generado y matriz de artefactos.

---

# Ciclo 6 — Asistentes de texto seguros

## Objetivo del ciclo

Introducir lenguaje natural solo después de estabilizar contratos deterministas. Ningún texto se convierte directamente en HTTP, SQL o mutación.

## CU-21 — Validar y ejecutar AssistantCommand

**Actor:** Usuario de aplicación generada.
**Dependencias:** CU-14 y CU-16.
**Resultado:** lenguaje cerrado `LIST`, `GET`, `SEARCH`, `CREATE`, `UPDATE`, `DELETE`, `COUNT` y planes cortos validados contra manifiesto.

### Incrementos

1. Esquema versionado, parser/validator, allow-lists, tipos, relaciones y confirmación destructiva.
2. Executor determinista y planes de máximo tres pasos con validación entre pasos.

### Flujo y errores

Se recibe un comando estructurado; se valida operación, entidad, campo, tipo y relación; se solicita confirmación si corresponde; el executor usa un cliente permitido del backend; se muestra resultado. Cualquier referencia arbitraria se rechaza.

### Aceptación y pruebas

- Sin dependencia de frases ni URLs dentro del contrato.
- 0 SQL/código/URL arbitrarios ejecutables.
- Tests exhaustivos de allow-list, tipo, relación, confirmación, plan y fallo intermedio.
- Auditoría suficiente sin registrar contenido sensible.

### Documentación

Crear `CU-21-assistant-command.md`, esquema, seguridad y semántica de operaciones.

## CU-22 — Interpretar solicitudes de texto para la aplicación generada

**Actor:** Usuario de aplicación generada.
**Dependencias:** CU-21 y benchmark B-TXT-APP.
**Resultado:** Ollama/Qwen propone `AssistantCommand` válido usando Domain Manifest.

### Incrementos

1. Adaptador Ollama, prompt versionado, salida estructurada y timeouts/cancelación.
2. Dataset/evaluador y baseline B-TXT-APP.
3. Iteración de prompt/parámetros, comparación y configuración seleccionada.

### Flujo y errores

El usuario escribe; el adaptador limita contexto; el modelo propone estructura; el validador acepta, pide aclaración o rechaza; solo luego puede ejecutarse. Timeout, modelo ausente o respuesta inválida dejan el sistema estable y explican recuperación.

### Aceptación y pruebas

- Puerta B-TXT-APP completada y enlazada; resultados reales.
- Pruebas unitarias con adaptador simulado y smoke real con Ollama.
- Inyección de prompt, entidades inexistentes, ambigüedad y modelo caído probados.

### Documentación

Crear `CU-22-texto-aplicacion-generada.md`; actualizar benchmark, prompt/config y guía de modelos.

## CU-23 — Usar el asistente en la aplicación generada

**Actor:** Usuario de aplicación generada.
**Dependencia:** CU-22.
**Resultado:** consola de asistente muestra solicitud, plan legible, confirmación, ejecución y resultado.

### Flujo y errores

El usuario envía texto, revisa plan y confirma si es destructivo; la UI ejecuta y muestra resultados/errores. Puede cancelar antes de mutar. El historial visible no autoriza repetir acciones automáticamente.

### Aceptación y pruebas

- Nunca se oculta el plan que mutará datos.
- Delete y cambios destructivos respetan confirmación.
- E2E texto → plan → confirmación → API → resultado y rutas de rechazo/cancelación.

### Documentación

Crear `CU-23-ui-asistente-generado.md` y guía de interacción/seguridad.

## CU-24 — Editar UML mediante texto en la herramienta CASE

**Actor:** Modelador.
**Dependencias:** CU-3, CU-5 y benchmark B-TXT-UML.
**Resultado:** texto en la consola CASE se resuelve a `UmlCommand`, se previsualiza y se confirma antes de mutar.

### Incrementos

1. Esquema de intención UML, resolver de referencias y adaptación a comandos existentes.
2. Consola, plan/confirmación, benchmark B-TXT-UML y manejo de ambigüedad.

### Aceptación y pruebas

- La IA no toca canvas ni documento; solo propone comandos cerrados.
- Puerta B-TXT-UML completada con resultados reales.
- E2E texto → plan → confirmación → Command Bus → canvas; cancelación no muta.

### Documentación

Crear `CU-24-texto-a-uml.md`; actualizar catálogo de comandos, benchmark y prompts.

---

# Ciclo 7 — Voz local

## Objetivo del ciclo

Capturar comandos breves mediante `whisper.cpp`, seleccionar una configuración con evidencia y reutilizar exactamente los flujos de texto seguros.

## CU-25 — Transcribir comandos breves localmente

**Actor:** Modelador o usuario de aplicación generada.
**Dependencia:** benchmark B-STT.
**Resultado:** grabación controlada se convierte en texto o rechazo seguro, sin Internet.

### Incrementos

1. Captura de audio, permisos, límites, cancelación y adaptador al servicio anfitrión.
2. Integración `whisper.cpp`, selección de modelo/parámetros mediante B-STT.
3. Estados UI, error/timeout y guía de micrófonos/pruebas manuales.

### Aceptación y pruebas

- Puerta B-STT completada en hardware objetivo o limitación explícita aprobada.
- Audio vacío, demasiado largo, formato inválido, permiso negado y servicio caído no mutan nada.
- Smoke real offline; unit/integration con fixtures de audio autorizados.

### Documentación

Crear `CU-25-speech-to-text.md`; actualizar benchmark, instalación y privacidad de audio.

## CU-26 — Operar UML y aplicación generada por voz

**Actor:** Modelador y usuario de aplicación generada.
**Dependencias:** CU-23, CU-24 y CU-25.
**Resultado:** audio → texto → plan estructurado → validación → confirmación → ejecución en el contexto correcto.

### Incrementos

1. Voz a `UmlCommand` en la herramienta CASE.
2. Voz a `AssistantCommand` en la aplicación generada.

### Aceptación y pruebas

- Mismo validador, plan y confirmación que el canal texto.
- E2E de éxito, transcripción errónea corregible, cancelación, destructiva y servicio no disponible.
- Pruebas manuales con micrófono real y edge cases del benchmark.

### Documentación

Crear `CU-26-operacion-por-voz.md` y actualizar guías de ambos asistentes.

---

# Ciclo 8 — Interoperabilidad, visión y transición

## Objetivo del ciclo

Completar XMI, incorporar imagen después del pipeline determinista y demostrar el flujo objetivo íntegro sin Internet.

## CU-27 — Importar y exportar XMI 2.1

**Actor:** Modelador y Enterprise Architect.
**Dependencias:** CU-1 y CU-2.
**Resultado:** subconjunto UML documentado intercambia XMI 2.1 mediante adaptadores seguros.

### Incrementos

1. Parser streaming con `saxes`, modelo intermedio y límites de seguridad XML.
2. Adaptación/validación a canónico y reporte de elementos no soportados.
3. Exportación con `xmlbuilder2`, round-trip y pruebas reales con Enterprise Architect.

### Flujo y errores

El actor importa un archivo; el sistema parsea sin ejecutar entidades externas, adapta y valida, muestra preview/diagnósticos y solo aplica tras confirmación. Exportar parte del modelo válido. Elementos desconocidos se informan, no se inventan.

### Aceptación y pruebas

- Subconjunto y limitaciones explícitos; protección contra XXE, archivos enormes y referencias rotas.
- Fixtures import/export y round-trip semántico normalizado.
- Prueba manual de ida/vuelta con una versión documentada de Enterprise Architect.

### Documentación

Crear `CU-27-interoperabilidad-xmi.md`, matriz de compatibilidad y procedimiento EA.

## CU-28 — Crear UML desde una imagen

**Actor:** Modelador.
**Dependencias:** CU-2, CU-3 y benchmark B-VLM.
**Resultado:** Sharp + Gemma proponen un modelo estructurado validado, revisable y aplicable por comandos.

### Incrementos

1. Carga segura y pipeline Sharp con variantes de preprocesamiento.
2. Adaptador Ollama/Gemma, prompt versionado, esquema y preview con incertidumbres.
3. Dataset B-VLM, comparación, revisión/corrección y aplicación por Command Bus.

### Flujo y errores

El actor carga una imagen autorizada; el sistema valida archivo, preprocesa, obtiene propuesta, normaliza y valida; muestra diferencias/diagnósticos; el actor corrige o confirma; se emiten comandos. Una salida inválida nunca se aplica.

### Aceptación y pruebas

- Puerta B-VLM completada con métricas por clases, atributos y relaciones.
- Archivo malicioso, imagen no UML, baja calidad, timeout y modelo ausente probados.
- Pruebas manuales con foto, pizarra, captura digital y casos ambiguos.

### Documentación

Crear `CU-28-imagen-a-uml.md`; actualizar benchmark, prompts, límites y privacidad de imágenes.

## CU-29 — Ejecutar la demostración completa offline

**Actor:** Equipo de desarrollo, docente/evaluador y Sistema anfitrión.
**Dependencias:** CU-0 a CU-28.
**Resultado:** release candidata reproduce el flujo objetivo completo sin Internet después de preparación.

### Incrementos

1. Instalación limpia, empaquetado de dependencias/modelos permitidos y suite B-OFFLINE.
2. Flujo funcional completo: UML, guardado, colaboración, presencia, generación, compilación, CRUD, texto, voz, XMI e imagen.
3. Corrección de regresiones, documentación final, métricas y release candidata.

### Flujo y errores

El evaluador sigue una receta desde equipo limpio/preparado, desconecta Internet y ejecuta el guion objetivo. Cada fallo queda registrado con paso, evidencia y recuperación; no se omite para declarar éxito.

### Aceptación y pruebas

- B-OFFLINE al 100 % de flujos esenciales o excepción explícita que impida declarar MVP completo.
- Todas las suites automáticas verdes y artefactos generados compilables.
- Demostración en dos clientes LAN y dispositivo/emulador Android cuando esté disponible.
- Documentación representa la release real y permite preparar el Word final sin reconstruir decisiones desde memoria.

### Documentación

Crear `CU-29-demostracion-offline.md`; cerrar estado, guías de instalación/usuario/demo, benchmarks, matriz de trazabilidad, deuda y notas de release.

---

# 6. Matriz de dependencias críticas

| Capacidad | Fundamento obligatorio |
|---|---|
| Canvas | Modelo canónico + validador + Command Bus |
| Persistencia | Modelo versionado + validador + auth/ownership |
| Realtime | Command Bus + persistencia + revisión optimista |
| Generación | Modelo válido + mapper relacional determinista |
| Frontend generado | Backend/OpenAPI + Domain Manifest |
| Asistentes | Manifiesto/comandos cerrados + executor determinista |
| Voz | Canal de texto seguro ya terminado |
| Imagen | Modelo/validador/Command Bus estables |
| Cierre offline | Todos los flujos y modelos instalados |

# 7. Receta para planificar un CU

Cuando el usuario pida “plan para CU-X”, la respuesta debe:

1. verificar `AGENTS.md`, estado, CU, código y diffs;
2. explicar en lenguaje simple qué quedará funcionando;
3. listar precondiciones y decisiones ya fijadas;
4. separar alcance y fuera de alcance;
5. proponer uno a tres incrementos con demostración por incremento;
6. detallar dominio, API/contratos, persistencia, UI, seguridad y errores que apliquen;
7. enumerar pasos de implementación en orden y archivos probables sin fingir que ya existen;
8. definir pruebas automáticas y manuales con resultado esperado;
9. enumerar documentación que se crea/actualiza;
10. identificar decisiones nuevas que necesitan aprobación;
11. indicar definición de terminado y estrategia de commit, sin implementar todavía.

# 8. Receta para generar el prompt del agente

Después de aprobar el plan, el prompt debe ser autocontenido y ordenar al agente:

1. leer las fuentes exactas y comprobar el estado;
2. trabajar solo en la rama, CU e incremento aprobados;
3. respetar las invariantes y stack;
4. implementar los pasos y manejar flujos alternativos;
5. no ampliar alcance ni cambiar contratos silenciosamente;
6. ejecutar comandos de calidad y reportar salida real;
7. crear/actualizar `CU-X-nombre.md`, estado y docs afectadas;
8. no inventar benchmarks ni marcar pruebas no ejecutadas;
9. detenerse y preguntar ante contradicción material, secreto, permiso o decisión no aprobada;
10. entregar resumen de cambios, pruebas, manual pendiente, riesgos y comandos sugeridos.

# 9. Plantilla del documento individual de CU

```markdown
# CU-X — Nombre

## Estado y trazabilidad
## Objetivo y resultado usable
## Actores, precondiciones y dependencias
## Alcance implementado / fuera de alcance
## Decisiones de análisis y diseño
## Incremento 1..3
## Flujo principal
## Flujos alternativos y errores
## Contratos, datos y migraciones
## Archivos relevantes
## Pruebas automáticas ejecutadas
## Pruebas manuales y evidencia
## Benchmarks, si aplica
## Documentación actualizada
## Desviaciones y deuda
## Cómo ejecutar y verificar
## Historial de iteraciones y correcciones
## Commit y push
```

La última sección usa rutas/archivos reales, por ejemplo:

```bash
git status
git diff --check
git add <archivos-reales-del-CU>
git commit -m "feat(cu-X): descripcion concreta"
git push -u origin feature/cu-X-slug
```

Si se modifica un CU anterior más adelante:

```bash
git status
git diff --check
git add <archivos-reales-de-la-correccion-y-documentacion>
git commit -m "fix(cu-X): descripcion concreta"
git push
```

Los placeholders deben reemplazarse por valores reales antes de entregar los comandos al usuario. Nunca se recomienda `git add .` sin revisar qué incluye.

# 10. Documentos transversales esperados

Se crean solo cuando un CU los necesita y siempre reflejan implementación real:

- arquitectura y ADR;
- dominio UML, perfil y validaciones;
- protocolos HTTP/WebSocket y errores;
- modelo de datos y migraciones;
- mapeo relacional y reglas de generación;
- OpenAPI, Postman y Domain Manifest;
- instalación local/LAN/offline;
- manual de usuario y demostración;
- seguridad, privacidad y modelo de amenazas;
- benchmarks, datasets, corridas y comparaciones;
- trazabilidad producto → CU → prueba → evidencia.

# 11. Decisiones pendientes antes de CU-0

El producto no fija estos datos externos. Deben resolverse en el plan de CU-0, no asumirse durante la ejecución:

- nombre definitivo del producto y del repositorio;
- cuenta u organización de GitHub y visibilidad;
- monorepo recomendado o repos separados mediante ADR;
- gestor de paquetes y estrategia de workspace compatibles con el stack;
- forma local de PostgreSQL —recomendada mediante contenedor reproducible si el equipo lo soporta—;
- sistema operativo y herramientas disponibles en el equipo del usuario;
- estrategia de CI según proveedor/repositorio.

Estas decisiones no cambian la visión funcional, pero condicionan comandos, estructura y automatización. El plan de CU-0 debe ofrecer una recomendación clara y explicar cómo verificar cada requisito.

# 12. Trazabilidad inicial de producto

Esta matriz demuestra cobertura planificada; no implica que una capacidad esté implementada.

| Requisito o decisión del producto | CU principal | Apoyo/verificación |
|---|---|---|
| Landing, registro e inicio de sesión | CU-6 | CU-0, CU-7 |
| Identidad CASE, responsive y workspace | CU-5 | CU-6, CU-23, CU-24 |
| `ProjectDocument`, UML y layout separado | CU-1 | CU-8 |
| UML 2.5.1 y perfil de generación | CU-1 | CU-12, CU-16 |
| D3/SVG y auto-layout ELK | CU-5 | CU-3, CU-4 |
| Diagramación manual | CU-3, CU-5 | CU-2, CU-4 |
| Validador único y diagnósticos | CU-2 | Todos los adaptadores/generadores |
| Command Bus y Undo/Redo | CU-3, CU-4 | CU-9, CU-24, CU-28 |
| Imagen con Sharp y Gemma | CU-28 | B-VLM |
| Voz con whisper.cpp | CU-25, CU-26 | B-STT |
| IA local con Ollama/Qwen | CU-22, CU-24 | B-TXT-APP, B-TXT-UML |
| XMI 2.1 y Enterprise Architect | CU-27 | CU-1, CU-2 |
| Colaboración autoritativa y revisión | CU-9 | CU-8, CU-11 |
| Presencia efímera | CU-10 | CU-9 |
| Offline y LAN | CU-11, CU-20, CU-29 | B-OFFLINE |
| TypeORM/PostgreSQL, auth y ownership | CU-6 a CU-8 | CU-0 |
| UML a modelo relacional | CU-12 | CU-1, CU-2 |
| Backend Spring Boot generado | CU-13, CU-14 | CU-12 |
| CRUD, filtros, orden, paginación y relaciones | CU-14, CU-18 | CU-16 |
| Auditoría declarativa | CU-1, CU-14 | CU-16 |
| OpenAPI 3.1 y Postman | CU-15 | CU-0 para API principal |
| Frontend Astro/Preact generado | CU-17, CU-18 | CU-15, CU-16 |
| PWA y Capacitor Android | CU-19 | CU-20, CU-29 |
| Domain Manifest | CU-16 | CU-21, CU-22 |
| Lenguaje cerrado y operaciones compuestas | CU-21 | CU-22, CU-23 |
| Seguridad del asistente | CU-21 a CU-24 | Benchmarks de texto |
| Testing de backend, frontend, E2E y generadores | Todos los CUs | CU-29 consolida |
| Flujo de demostración objetivo | CU-29 | CU-0 a CU-28 |
