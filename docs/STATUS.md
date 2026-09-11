# Estado real del proyecto

Última actualización: 2026-09-10

## Resumen

- Producto: **Primer Parcial** (`primer-parcial`).
- Planificación definitiva: **12 CUs en 3 ciclos**, mapa 30→12 conservado.
- Caso de uso activo: **CU-0 — Inicializar la base ejecutable del proyecto**, **En implementación**.
- Incremento activo de esta entrega: **CU-0.1 — Repositorio, configuración y documentación inicial**, **Terminado: configuración/documentación verificada**. Detenido antes de CU-0.2.
- Código de aplicaciones: **no iniciado**. Configuración/documentación no constituyen una base ejecutable.
- Benchmarks: **no ejecutados**; B-TXT-UML/B-TXT-APP→CU-8, B-STT→CU-9, B-VLM→CU-10, B-OFFLINE→CU-11.
- Rama esperada y verificada: `feature/cu-0-inicializar-base`; árbol limpio al iniciar CU-0.1.
- Plan/aprobación: prompt explícito del usuario para CU-0.1; responsable de ejecución: agente, revisión/aceptación: usuario.
- Docker: **CLI disponible pero motor no operativo**, según diagnóstico previo/estado informado. Solo se valida configuración en este incremento.
- Build: **pendiente para CU-0.3**, a ejecutar por usuario/CI; no existe código para declarar build verde.
- GitHub futuro: `DarksouleaterXD/primer-parcial`, público; credenciales no bloquean local. Sin acciones de publicación en CU-0.1.
- Deuda/riesgos: motor Docker y posible ocupación previa de 5432 a revalidar en CU-0.2; comportamiento ejecutable, tests y reproducibilidad aún pendientes.

## Estado por ciclo

| Ciclo | Estado | Incremento usable esperado |
|---|---|---|
| 1. Editor UML con proyectos privados | CU-0 En implementación; CU-0.1 verificado, CU-0.2/0.3 y CU-1 a CU-3 pendientes | Cuenta, editor validado con Undo/Redo y proyectos privados persistentes |
| 2. Colaboración, interoperabilidad y generación | Pendiente: CU-4 a CU-7 | LAN/presencia, XMI y aplicación Spring/web/PWA/Android generada |
| 3. Inteligencia, visión y cierre offline | Pendiente: CU-8 a CU-11 | Texto, voz, imágenes y demostración integral offline |

## Entorno comprobado en CU-0.1

| Herramienta | Resultado real |
|---|---|
| Git | `2.39.2.windows.1` |
| Node.js | `v24.11.1` |
| npm | `11.6.2` |
| Docker CLI | `28.5.1`, build `e180ab8` |
| Docker Compose | `v2.40.2-desktop.1` |

Motor/puertos no se volvieron a diagnosticar en CU-0.1: las validaciones autorizadas no requieren motor. Versiones no equivalen a servicios iniciados.

## Evidencia y próximos pasos

- Evidencia de configuración: [CU-0](puds/use-cases/CU-0-inicializar-base.md). Verificador Node: **12 grupos correctos**; 3 JSON válidos, Markdown/enlaces coherentes, 12 CUs/3 ciclos, máximo tres incrementos y 30 IDs trazados. Histórico íntegro y benchmarks cambiados solo en cinco referencias, comparados con commit base `eff9bdc`.
- `docker compose config`: **código 0**, loopback/volumen PG18/healthcheck correctos; no se inició motor/contenedor. `git diff --check`: **código 0**. Diff revisado, índice sin cambios y búsqueda heurística sin hallazgos de secretos. Ausencia de lockfile, apps, paquetes y dependencias comprobada.
- OpenCode: JSON y reglas declaradas comprobados; reinicio/revisión de permisos efectivos pendiente para la próxima sesión, sin probar comandos destructivos. No es evidencia de un sandbox ni del runtime completo.
- **CU-0.2 pendiente y no autorizado en esta entrega:** resolver entorno Docker/5432, inicializar aplicaciones, instalar/lockfile, integrar PostgreSQL/TypeORM, health/OpenAPI y comunicación real.
- **CU-0.3 pendiente:** calidad, CI, pruebas manuales, build/reproducibilidad por usuario/CI, evidencia y cierre del CU.
- No hay commit de implementación ni push de esta entrega. Los comandos finales de CU-0 se completarán al cierre.

## Reglas de actualización

Al iniciar un CU se registra responsable, rama, plan aprobado, incremento activo y bloqueos. Al cerrarlo se registra fecha, commit, pruebas, evidencia, documentos afectados y deuda residual. Un CU solo puede estar `Terminado` cuando su documento individual representa fielmente la implementación y todos sus criterios obligatorios están comprobados.

## Historial

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-09-01 | Se creó la planificación PUDS, las reglas generales, la estrategia de benchmarks y el contexto de continuidad. | Documentación inicial |
| 2026-09-10 | Se aprobó mapa definitivo 12/3, fronteras técnicas e implementación exclusiva de CU-0.1; configuración/documentación verificada. CU-0 permanece En implementación. | ADR-0001, 12 grupos estáticos correctos, Compose config y diff --check con código 0; documento CU-0 |
