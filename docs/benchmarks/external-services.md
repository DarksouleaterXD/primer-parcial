# Benchmarks de IA, visión y voz local

## 1. Objetivo

Este documento define cómo seleccionar y mejorar modelos, prompts y parámetros de Ollama y `whisper.cpp` sin depender de impresiones aisladas. También conserva las comparaciones que respaldan decisiones futuras.

Estado inicial: **ningún benchmark ha sido ejecutado**. Todas las tablas de resultados están vacías de forma intencional.

Baselines definidos por producto:

- texto: Qwen3.5 0.8B multimodal empaquetado para Ollama;
- visión: Gemma 3 4B multimodal en Ollama;
- voz: `whisper.cpp`; el tamaño/modelo Whisper se elegirá mediante benchmark antes de cerrar el CU de STT.

Un experimento puede comparar alternativas, pero no cambia el baseline automáticamente. Para cambiar una decisión fija se requiere resultado reproducible, aprobación del usuario y actualización del producto o ADR.

## 2. Cuándo ejecutar cada benchmark

| Puerta | Debe completarse antes de cerrar | Resultado que habilita |
|---|---|---|
| B-TXT-UML | CU-8 | Prompt y parámetros de texto → `UmlCommand` |
| B-TXT-APP | CU-8 | Prompt y parámetros de texto → `AssistantCommand` |
| B-STT | CU-9 | Modelo y parámetros de `whisper.cpp` para comandos breves |
| B-VLM | CU-10 | Prompt, preprocesamiento y parámetros de imagen → UML |
| B-OFFLINE | CU-11 | Configuración reproducible sin Internet y consumo aceptable |

Durante desarrollo se permite un baseline provisional. El CU no se marca terminado si su puerta obligatoria no tiene dataset, ejecución, resultados y decisión documentada.

## 3. Principios de experimentación

1. Versionar dataset, evaluador, prompt y configuración.
2. Congelar el conjunto de evaluación antes de comparar variantes.
3. Cambiar una variable principal por experimento: modelo, prompt, temperatura, cuantización, contexto o preprocesamiento.
4. Repetir cada caso no determinista al menos tres veces; reportar consistencia.
5. Separar exactitud estructural de exactitud semántica.
6. Registrar fallos individuales, no solo el promedio.
7. Medir en el equipo objetivo del usuario y anotar hardware y procesos relevantes.
8. Ejecutar completamente offline después de descargar modelos y dependencias.
9. No incluir datos personales, secretos ni material sin permiso.
10. Mantener un conjunto de regresión con todo fallo corregido.

## 4. Huella obligatoria del entorno

Cada corrida crea un registro en `docs/benchmarks/runs/<fecha>-<suite>-<variante>.md` o un archivo tabular enlazado. Debe contener:

| Campo | Ejemplo de formato; no es un resultado |
|---|---|
| Fecha y hora | ISO 8601 con zona horaria |
| Commit | SHA completo |
| Sistema operativo | Nombre y versión |
| CPU | Modelo y núcleos disponibles |
| RAM | Total y disponible al inicio |
| GPU/VRAM | Modelo, VRAM y driver; `sin GPU` si aplica |
| Runtime | Versión de Ollama o `whisper.cpp` |
| Modelo | Nombre, versión/hash, cuantización y tamaño |
| Parámetros | Temperatura, seed, contexto, límites y threads |
| Prompt | Archivo y hash/versión |
| Dataset | Archivo y hash/versión |
| Repeticiones | Número por caso |
| Modo de red | Conectado o desconectado |

## 5. Métricas comunes

- **Tasa de ejecución:** casos que producen una respuesta evaluable / total.
- **Validez estructural:** respuestas que cumplen el esquema / total × 100.
- **Exactitud semántica exacta:** comandos o modelos que coinciden con el resultado esperado / total × 100.
- **Exactitud por campo:** campos correctos / campos evaluados × 100.
- **Tasa de rechazo seguro:** entradas ambiguas o no permitidas rechazadas correctamente / total de casos de rechazo × 100.
- **Alucinación:** respuestas que inventan entidades, campos u operaciones / total × 100; objetivo ideal 0 %.
- **Consistencia:** casos con el mismo resultado válido en todas las repeticiones / total × 100.
- **Latencia:** p50, p95 y máximo; se separa carga fría de ejecución caliente.
- **Throughput:** tokens/s para LLM/VLM o factor de tiempo real para STT.
- **Recursos:** pico de RAM, VRAM, CPU y tamaño en disco.
- **Éxito offline:** casos completos sin tráfico o dependencia de Internet / total × 100.

No se combinan todas las métricas en una puntuación única salvo que se documente la fórmula y los pesos. Se priorizan primero seguridad y exactitud; después latencia y recursos.

## 6. Suite B-TXT-UML: texto a comandos UML

### Dataset mínimo

Crear al menos 60 casos equilibrados:

- 10 crear, renombrar y eliminar clases;
- 10 agregar, cambiar y quitar atributos;
- 10 asociaciones, agregaciones, composiciones y herencia;
- 8 multiplicidades y nulabilidad;
- 8 referencias a elementos por nombre o contexto;
- 7 órdenes ambiguas que deben pedir aclaración;
- 7 acciones fuera del esquema que deben rechazarse.

Cada caso contiene entrada, estado inicial mínimo, comando esperado o rechazo esperado y campos que admiten equivalencia.

### Edge cases manuales sugeridos

- faltas ortográficas y ausencia de tildes;
- nombres técnicos en inglés dentro de frases en español;
- clases con nombres parecidos;
- orden que referencia un elemento inexistente;
- dos instrucciones en una frase cuando solo una operación sea admisible;
- intento de hacer SQL, ejecutar código o alterar el canvas directamente;
- texto muy largo con una instrucción escondida;
- prompt injection dentro del nombre de una clase.

### Criterio de decisión inicial

- 100 % de respuestas parseables o rechazadas de forma controlada;
- 0 % de operaciones fuera de allow-list aplicadas;
- al menos 95 % de exactitud exacta en casos claros;
- al menos 95 % de rechazo/aclaración correcta en casos ambiguos;
- p95 compatible con interacción local, con el umbral en segundos aprobado después de medir el hardware objetivo.

## 7. Suite B-TXT-APP: texto a AssistantCommand

### Dataset mínimo

Crear al menos 80 casos sobre dos Domain Manifest de prueba distintos para evitar sobreajuste a un dominio:

- LIST, GET, SEARCH, COUNT;
- CREATE, UPDATE y DELETE;
- filtros, búsqueda, orden y paginación;
- alias de entidades y campos;
- relaciones y planes compuestos de dos o tres pasos;
- entidad/campo inexistente;
- tipos inválidos y valores faltantes;
- acción destructiva sin confirmación;
- intento de SQL, URL o código arbitrario.

La evaluación separa planificación de ejecución. El modelo propone; el validador determinista decide; el ejecutor solo opera comandos aprobados.

### Criterio de decisión inicial

- 100 % de salidas procesadas mediante el esquema cerrado;
- 0 comandos no declarados ejecutados;
- al menos 95 % de exactitud exacta en operaciones simples claras;
- al menos 90 % de planes compuestos correctos;
- 100 % de acciones destructivas sujetas a la política de confirmación;
- 0 % de invención silenciosa de entidad, campo o relación.

## 8. Suite B-STT: comandos breves con whisper.cpp

### Dataset mínimo

Entre 40 y 80 audios con transcripción de referencia y comando/intención esperada. Duración objetivo por audio: 1 a 15 segundos. Incluir voces autorizadas distintas cuando sea posible.

Categorías:

- ambiente silencioso y micrófono cercano;
- ventilador, calle u oficina moderada;
- habla lenta, normal y rápida;
- acentos locales y términos técnicos;
- nombres de clases en inglés, siglas y números;
- pausas, autocorrecciones y frases incompletas;
- volumen bajo y micrófono distante;
- audio vacío o ininteligible que debe rechazarse.

### Métricas específicas

- WER y CER contra transcripción;
- exactitud de intención final, que tiene prioridad sobre WER;
- factor de tiempo real = tiempo de proceso / duración del audio;
- latencia desde fin de grabación hasta texto;
- tasa de rechazo correcto de audio insuficiente.

### Pruebas manuales guiadas

1. Grabar la misma orden con micrófono del portátil y auriculares.
2. Repetir a 30 cm, 1 m y 2 m.
3. Repetir con ventilador y conversación de fondo.
4. Pronunciar nombres mixtos como `OrderItem`, UUID y multiplicidades `uno a muchos`.
5. Hablar, corregirse a mitad de frase y terminar la orden.
6. Enviar silencio, ruido y una conversación que no sea una orden.

Registrar consentimiento, dispositivo, distancia y entorno; no guardar audio personal más tiempo del necesario.

### Criterio de decisión inicial

- al menos 95 % de intención correcta en entorno silencioso;
- al menos 85 % en ruido moderado;
- 100 % de audio vacío/ininteligible rechazado sin mutación;
- factor de tiempo real menor a 1 en el equipo anfitrión objetivo, o una excepción explícita documentada.

## 9. Suite B-VLM: imagen a UML

### Dataset mínimo

Crear de 40 a 60 imágenes autorizadas con modelo UML esperado:

- diagramas digitales nítidos;
- capturas de Enterprise Architect;
- fotos de papel y pizarra;
- perspectiva, rotación, sombra y reflejo;
- baja resolución y compresión;
- escritura manual legible y parcialmente legible;
- relaciones cruzadas, multiplicidades y herencia;
- elementos fuera del subconjunto soportado;
- imagen sin diagrama que debe rechazarse.

No comparar JSON como texto. Normalizar IDs, orden y layout antes de evaluar la semántica.

### Métricas específicas

- precisión, recall y F1 de clases;
- precisión, recall y F1 de atributos;
- precisión, recall y F1 de relaciones;
- exactitud de tipo de relación y multiplicidades;
- tasa de modelos que pasan el validador;
- tasa de rechazo/aclaración correcta;
- latencia fría/caliente y pico de VRAM/RAM.

### Variables de preprocesamiento

- tamaño máximo;
- auto-rotación;
- recorte;
- contraste y escala de grises;
- corrección de perspectiva;
- compresión/formato;
- una imagen completa frente a recortes por regiones.

### Edge cases manuales sugeridos

- foto inclinada desde una esquina;
- pizarra con reflejo;
- flecha que cruza una clase;
- multiplicidad escrita lejos del extremo;
- dos clases con el mismo nombre;
- texto tachado o corrección a mano;
- mezcla UML válida con notas informales;
- diagrama demasiado grande fotografiado en varias partes;
- imagen maliciosa con instrucciones textuales para el modelo.

### Criterio de decisión inicial

- 100 % de salidas sometidas al esquema y al validador antes de previsualizar;
- 0 modelos inválidos aplicados automáticamente;
- F1 de clases al menos 95 % en diagramas digitales y 85 % en fotos legibles;
- F1 de relaciones al menos 90 % en digital y 75 % en fotos legibles;
- los elementos dudosos se presentan para revisión, no se inventan silenciosamente.

## 10. Suite B-OFFLINE

Preparación:

1. descargar dependencias, modelos y artefactos permitidos;
2. detener o bloquear acceso a Internet;
3. iniciar base de datos, API, web, Ollama y STT siguiendo la guía limpia;
4. ejecutar smoke tests de UML manual, colaboración LAN, generación, texto, voz e imagen;
5. ejecutar la aplicación generada y su CRUD;
6. reiniciar el anfitrión y repetir el arranque.

Medir tiempo total de instalación preparada, tiempo de arranque frío/caliente, almacenamiento, RAM/VRAM en reposo y pico, fallos y recuperación. El objetivo obligatorio es 100 % de los flujos esenciales sin Internet una vez completada la preparación documentada.

## 11. Matriz de comparación

Agregar una fila solo después de ejecutar la corrida.

| Suite | Variante | Exactitud principal | Validez | Rechazo seguro | p50/p95 | RAM/VRAM pico | Tamaño | Offline | Decisión |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Pendiente | — | — | — | — | — | — | — | — | Sin ejecutar |

## 12. Registro de decisión de benchmark

Cada comparación final debe responder:

- ¿qué hipótesis se probó?;
- ¿qué se mantuvo constante?;
- ¿qué variante ganó por seguridad y exactitud?;
- ¿qué costo de latencia, memoria y almacenamiento tiene?;
- ¿qué categorías empeoraron?;
- ¿el resultado se repite en el hardware objetivo?;
- ¿se conserva el baseline, se ajusta configuración o se propone cambiar modelo?;
- ¿qué archivos de prompt, configuración, ADR y producto deben actualizarse?;

## 13. Guía de iteración con el usuario

Para cada puerta, el asistente debe proporcionar comandos copiables y explicar dónde ejecutarlos, cómo preparar los archivos físicos, qué datos se guardarán y cómo interpretar la salida. El usuario ejecuta y devuelve reporte o archivos de resultados. Se diagnostican fallos por categoría, se elige un único cambio principal, se repite el mismo benchmark y se actualizan comparación y decisión. El ciclo termina cuando se cumplen umbrales o se aprueba explícitamente una excepción con su impacto.
