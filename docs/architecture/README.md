# Arquitectura aprobada — Primer Parcial

**Estado:** arquitectura objetivo, sin componentes de aplicación implementados. CU-0.1 aporta configuración/documentación. Consultá [STATUS](../STATUS.md), [producto](../product/product-05-astro-nestjs.md) y [ADR-0001](../decisions/ADR-0001-initial-technical-boundaries.md).

## Dos aplicaciones distintas

| Contexto | Stack aprobado | Estado |
|---|---|---|
| Herramienta CASE: web principal | Astro, TypeScript, islas Preact, Shoelace, D3/SVG, ELK.js, Nanostores, WebSocket nativo | No implementado |
| Herramienta CASE: API | Node 24, NestJS 11/Express, TypeORM/PostgreSQL, Passport/JWT/bcrypt, Zod/`nestjs-zod`, `@nestjs/swagger` | No implementado |
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
├── apps/                   [futuro, no creado]
│   ├── web/                [CU-0.2: Astro/Preact]
│   └── api/                [CU-0.2: NestJS]
├── packages/               [futuro: solo con contratos/dominio reales]
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

No se crean paquetes vacíos por capacidad futura. El nombre del directorio actual es `D:\project-planning`; no se renombra para adoptar el slug. Workspaces `apps/*` y `packages/*` reservan la topología, no demuestran que existan aplicaciones.

## Infraestructura local objetivo y orden

PostgreSQL `18.6-alpine` solo publica `127.0.0.1:5432`, con volumen nombrado montado en `/var/lib/postgresql` y healthcheck `pg_isready`. Variables vienen del entorno con fallback de desarrollo sintético; `.env.example` es versionable y archivos reales son ignorados. El motor está pendiente de operatividad; no hay prueba de conexión ni persistencia en CU-0.1.

CU-0.2 inicializa web/API/BD, health y contrato principal; CU-0.3 verifica calidad/build/CI. Dentro de CU-2 se estabilizan canónico→validador→bus antes del canvas. CU-3 incorpora proyectos, CU-4 LAN, CU-5 XMI, CU-6/7 generación y CU-8/9/10 asistentes/visión; CU-11 verifica conjunto offline. LAN no requiere exponer PostgreSQL: el anfitrión media acceso por sus servicios autorizados. GitHub no es dependencia de ejecución local.
