# Arquitectura aprobada — Primer Parcial

CU-2.1 está implementado, verificado estáticamente sin CRITICAL y verificado conductualmente mediante `reproduce-clean` sobre `ca12e3fc8ca5f7df1b8a35d89556456a1bd1fd9b`. CU-2.2 integra el Command Bus y el historial local en `packages/uml-domain`, sin dependencias de UI/backend; su verificación final sigue pendiente. CU-2.3 (canvas) no está iniciado.

## Dos aplicaciones distintas

| Contexto | Stack aprobado | Estado |
|---|---|---|
| Herramienta CASE: web principal | Astro, TypeScript, islas Preact, Shoelace, D3/SVG, ELK.js, Nanostores, WebSocket nativo | CU-1: landing/registro/login/workspace; canvas UML sigue pendiente para CU-2.3 |
| Herramienta CASE: API | Node 24, NestJS 11/Express, TypeORM/PostgreSQL, Passport/JWT/bcrypt, Zod/`nestjs-zod`, `@nestjs/swagger` | CU-1: health + cuenta/sesión JWT; proyectos UML persistentes siguen pendientes para CU-3 |
| Realtime principal | NestJS Gateway con adaptador `ws`, servidor autoritativo | No implementado |
| Interoperabilidad | UML 2.5.1, XMI 2.1, `saxes`/`xmlbuilder2`, Enterprise Architect | No implementado |
| Generadores | Mapper determinista y plantillas Eta | No implementado |
| Backend producido | Java 21, Spring Boot 4.x, Gradle, Spring Web MVC, Spring Data JPA/Hibernate, Jakarta Validation, Jackson, `springdoc-openapi`, PostgreSQL | No implementado |
| Frontend producido | Astro + Preact; estático/PWA y Capacitor Android | No implementado |
| IA / visión / voz local | Ollama, Qwen3.5 0.8B, Gemma 3 4B, Sharp y `whisper.cpp` | No implementado; benchmarks no ejecutados |

La auditoría principal usa TypeORM. El perfil `auditable` generado produce `createdAt`/`updatedAt` con Spring Data JPA. OpenAPI principal procede de Swagger Nest; el generado procede de springdoc y alimenta Postman Collection. No intercambiar ORM ni herramientas entre runtimes.

## Flujo semántico y dependencias

```text
Manual / texto / voz / imagen / XMI
             ↓ adaptadores y validación
         UmlCommandBus
             ↓ executor + validador único
   ProjectDocument versionado
     ├─ CanonicalUmlModel: única semántica UML
     └─ DiagramLayout: posiciones y estado visual
             ↓ salidas desde canónico validado
   Canvas / XMI / RelationalModel / generadores / manifiesto
```

- Dominio independiente de Astro, NestJS, ORM, D3/ELK, transporte, Ollama y plantillas; adaptadores dependen del dominio.
- Toda entrada se adapta al modelo canónico y pasa por el mismo validador; toda mutación UML pasa por el bus. Canvas/objetos D3/SVG/ELK no son dominio persistido.
- Realtime: una operación por intención, `baseRevision`, persistencia inmediata, broadcast y rechazo obsoleto/recuperación autoritativa. Presencia efímera fuera de revisión e historial; no CRDT completo MVP.
- UML→relacional es determinista; generadores solo derivan comportamiento del modelo/perfil, sin lógica de negocio inventada ni edición manual permanente de artefactos.
- IA propone estructuras cerradas, no SQL/código/URLs arbitrarios. Destructivas exigen confirmación; editor confirma antes de mutar según producto.
- Migraciones explícitas/versionadas; contratos compartidos tipados/versionables sin importar implementación web/API.

## Estructura objetivo del monorepositorio

```text
primer-parcial/
├── apps/
│   ├── web/                [CU-0.2: Astro/Preact + ApiStatus]
│   └── api/                [CU-0.2: NestJS health]
├── packages/
│   ├── contracts/          [CU-1: health + cuenta/sesión]
│   └── uml-domain/         [CU-2.1: dominio/validación; CU-2.2: comandos e historial local]
├── docs/                   [documentación existente y de CU-0.1]
│   ├── architecture/
│   ├── benchmarks/
│   ├── decisions/
│   ├── development/
│   ├── product/
│   └── puds/use-cases/
├── package.json            [configurado: privado, npm workspaces]
├── tsconfig.base.json      [configurado: base neutral/estricta]
└── compose.yaml            [configurado: solo PostgreSQL local]
```

`packages/uml-domain` es un paquete real de CU-2.1/CU-2.2 y no contiene dependencias de UI/backend. En CU-2.2, el índice expone contratos cerrados y `UmlCommandBus`; executor y snapshots de historial permanecen internos. No se crean paquetes vacios por capacidad futura. El nombre del directorio actual es `D:\project-planning`; no se renombra para adoptar el slug. Los workspaces implementados incluyen la base ejecutable web/API de CU-0.2, los contratos de cuenta/sesion de CU-1 y `packages/uml-domain`.

## Infraestructura local objetivo y orden

PostgreSQL `18.6-alpine` solo publica `127.0.0.1:5432`, con volumen nombrado montado en `/var/lib/postgresql` y healthcheck `pg_isready`. Variables vienen del entorno con fallback de desarrollo sintético; `.env.example` es versionable y archivos reales son ignorados. CU-0.2 comprobó el motor, el healthcheck, el endpoint disponible y el endpoint no disponible sin borrar el volumen.

CU-0.2 implementa web/API/BD, health y contrato principal; su build fue comprobado manualmente. CU-0.3 verifica CI, E2E, reproducción limpia y el cierre de CU-0. Dentro de CU-2 se estabilizan canónico→validador→bus antes del canvas. CU-3 incorpora proyectos, CU-4 LAN, CU-5 XMI, CU-6/7 generación y CU-8/9/10 asistentes/visión; CU-11 verifica conjunto offline. LAN no requiere exponer PostgreSQL: el anfitrión media acceso por sus servicios autorizados. GitHub no es dependencia de ejecución local.
