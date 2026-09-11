# ADR-0001 — Fronteras técnicas iniciales

- **Estado:** Aceptado por decisión explícita del usuario para CU-0.1.
- **Fecha:** 2026-09-10.
- **Alcance:** planificación y configuración de Primer Parcial. No afirma existencia de código.
- **Fuentes:** [producto variante 5](../product/product-05-astro-nestjs.md), [AGENTS](../../AGENTS.md), [plan maestro](../puds/use-cases/README.md).

## Contexto

La variante distingue herramienta CASE y aplicación que esta generará, pero el producto conserva ambigüedades: §24 asigna TypeORM a auditoría de generación, §25 y §39 mencionan Swagger Nest en generación, §26 expresa frontend libre y fijo, §32 deja opcional la confirmación destructiva y §37 recomienda un orden técnico distinto de la agrupación aprobada. Este ADR precisa esas fronteras con aprobación explícita, conservando el producto intacto y la historia trazable.

El plan previo de 30 CUs se agrupa en 12 CUs/3 ciclos; la cuenta precede al modelado en la entrega. El trabajo local debe poder avanzar sin remoto ni credenciales GitHub.

## Decisión

1. **Aplicación principal:** NestJS 11 sobre Express, Node.js 24, TypeORM y PostgreSQL.
2. **Backend generado:** Java 21, Spring Boot 4.x, Gradle, Spring Web MVC, Spring Data JPA, Hibernate, Jakarta Validation, Jackson y PostgreSQL. No hereda NestJS ni TypeORM.
3. **Auditoría principal:** columnas/mecanismos TypeORM para usuarios, proyectos y documentos de la herramienta.
4. **Auditoría generada:** metadato `auditable` produce `createdAt`/`updatedAt` mediante Spring Data JPA. Precisa §24 sin trasladar el ORM principal al generado.
5. **OpenAPI principal:** `@nestjs/swagger` documenta la API NestJS.
6. **OpenAPI generado:** `springdoc-openapi` documenta Spring. OpenAPI es fuente de Postman Collection y derivados; ambas APIs buscan 3.1 cuando las herramientas lo permitan. Una limitación comprobada se documenta/prueba, sin cambiar stack silenciosamente. Precisa §25/§39.
7. **Frontend generado de esta variante:** fijado en Astro + Preact; salida Android mediante Astro estático/PWA y Capacitor. La apertura general de §26 no habilita elegir otro frontend durante esta variante.
8. **Asistentes MVP:** toda operación destructiva propuesta requiere confirmación. Se conserva además la confirmación antes de mutar UML de la interfaz del producto (§5.1); cancelar no muta. Precisa el carácter opcional de §32.
9. **Orden técnico:** reagrupación de CUs no cambia los fundamentos: modelo canónico → validación → Command Bus deben estabilizarse antes de canvas, realtime, generación o IA. CU-1 incorpora cuenta sin adelantar dominio UML; CU-2 estabiliza sus fundamentos internamente antes del canvas. Toda entrada se adapta/valida y toda mutación UML pasa por el bus.
10. **GitHub:** las credenciales no bloquean desarrollo local. Solo serán necesarias al crear o publicar el remoto público previsto `DarksouleaterXD/primer-parcial`. CU-0.1 no crea remoto ni ejecuta acciones GitHub.

## Consecuencias

- Dos contextos tecnológicos explícitos, con adaptadores y pruebas propios; dominio canónico independiente de frameworks, ORM, canvas y modelos IA.
- Contratos y auditoría se verifican en su runtime real cuando se implementen; no se afirma compatibilidad comprobada ni artefactos compilados en CU-0.1.
- La planificación guarda correspondencia completa 30→12 y puertas B-TXT-UML/B-TXT-APP→CU-8, B-STT→CU-9, B-VLM→CU-10, B-OFFLINE→CU-11.
- Confirmaciones añaden un paso al flujo destructivo a cambio de control explícito del usuario.
- Monorepositorio npm workspaces (`apps/*`, `packages/*`) mantiene cambios front/back/contratos/docs atómicos. Los directorios se crean cuando contienen implementación real.
- PostgreSQL local `18.6-alpine`, puerto fijo `127.0.0.1:5432`, volumen nombrado en `/var/lib/postgresql`; motor operativo y persistencia real se verifican desde CU-0.2.

## Alternativas descartadas

| Alternativa | Motivo / costo de la elección |
|---|---|
| TypeORM o Swagger Nest dentro del generado Spring | Mezcla runtimes y contradice stack generado obligatorio; mantener JPA/springdoc exige pruebas separadas |
| Elegir otro frontend generado | Introduce variación no aprobada; Astro/Preact reduce libertad pero estabiliza inferencia y pruebas |
| Confirmación destructiva opcional en MVP | Permite mutación accidental; confirmación agrega interacción deliberada |
| Adelantar canvas/IA por agrupar CUs | Crea rutas de mutación competidoras; estabilizar dominio primero retrasa UI pero preserva invariantes |
| Bloquear local hasta disponer de GitHub | No aporta validación local; publicación queda como paso posterior explícito |
| Repositorios separados, Nx o Turborepo | npm workspaces satisface la topología aprobada sin coordinación multirrepo ni orquestador adicional |
| Reescribir producto para ocultar contradicciones | Elimina trazabilidad; se conserva producto y se registra esta precisión posterior |
