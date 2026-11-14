# OSI Quest 3.9.5 · Respuesta más rápida con historial grande

El guardado reconstruía el registro completo varias veces por acción y escribía dos copias del progreso. Cada entrada incluía el enunciado, alternativas, explicaciones y fuentes de la pregunta. Sin Web Locks, el registro nunca se compactaba. La eliminación de muchas entradas enviaba un evento por clave a las otras pestañas y cada evento volvía a dibujar la pantalla.

## Cambios

- El registro conserva la pregunta por ID y capa, junto con el resultado. Los registros de rondas omiten sus copias de preguntas y respuestas detalladas; el resumen sigue incluyendo los fallos por capa. Las entradas antiguas siguen siendo legibles.
- La caché conserva las entradas ya validadas y aplica solamente las nuevas cuando mantienen el orden. Si una entrada cambia, desaparece, se intercala o cambia la base, reconstruye el resultado. Los valores originales se vuelven a consultar para detectar cambios y corrupción. Cada lectura entrega una copia independiente.
- Una acción escribe una sola copia final del progreso. Los cambios pendientes por falta de espacio conservan su reintento y no suman XP dos veces.
- La compactación se solicita a partir de 128 operaciones, durante un periodo libre del navegador y también al abrir un historial antiguo. El módulo de mantenimiento se carga solo cuando hace falta.
- Con Web Locks se mantiene la coordinación existente. Sin esa API se utiliza una transacción de lectura/escritura de IndexedDB para serializar la compactación entre pestañas. No se emplea una bandera de localStorage como supuesto bloqueo.
- La compactación conserva los identificadores aplicados para resistir una eliminación interrumpida. Las lecturas posteriores recorren únicamente las claves presentes, sin consultar miles de identificadores ya eliminados.
- Los avisos de almacenamiento se agrupan durante 40 ms. Una ráfaga de 401 eventos produjo un solo redibujado en la prueba de producción. La sincronización sigue protegiendo las rondas, formularios y diálogos abiertos.

## Comparación reproducible

Chromium, perfil desechable, CPU ralentizada 4 veces mediante CDP. Se carga un registro de la versión anterior, con preguntas completas, y se mide la mediana de 20 respuestas normales. Ambos coordinadores se desactivan en esta comparación para medir el coste del guardado antes de la compactación automática. Las pruebas funcionales de mantenimiento sí utilizan IndexedDB y Web Locks reales.

| Operaciones antiguas iniciales | 3.9.4, mediana por respuesta | 3.9.5, mediana por respuesta |
| --- | ---: | ---: |
| 0 | 0,9 ms | 0,1 ms |
| 128 | 4,1 ms | 0,5 ms |
| 4.000 | 121,4 ms | 10,2 ms |

La mejora en el caso grande es aproximadamente un 92 % en el procesamiento del guardado. No representa el tiempo total de navegación o descarga, y depende del dispositivo. La primera lectura de un registro antiguo todavía debe validarlo completo: 78,2 ms antes y 74,7 ms después en esta comparación. La limpieza posterior deja las operaciones consolidadas en una base, conservando los 32.000 XP y los 4.000 intentos de la prueba.

Para repetir la medición:

```sh
npm ci --ignore-scripts
npm run dev
# En otro terminal:
node scripts/benchmark-progress-browser.mjs
```

El informe se guarda en `work/browser-performance/benchmark.json`. `--url` permite comparar otro servidor de desarrollo y `--output` conservar cada informe. El navegador de la prueba no utiliza el perfil ni el progreso personal del usuario.

## Verificación

- 155 pruebas nativas; catálogos, seguridad estática, sintaxis, formato, cobertura y build correctos.
- 13 comprobaciones nuevas de navegador: escritura simultánea de dos pestañas sin Web Locks, XP normal/difícil, migración de 4.000 entradas, recarga, juego posterior, eliminación interrumpida y agrupación de eventos en producción.
- 691 comprobaciones de las suites de juego, clases, aprendizaje, historia, accesibilidad y prioridades.
- Suites de producción, estilos, interfaz, PWA y actualización offline: 157 comprobaciones. La carga inicial conserva tres recursos y 53.804 bytes gzip estimados, por debajo del presupuesto de 55 KiB.
- 135 comprobaciones de auditoría, 72 intentos de comprobación de lecciones y las 103 regresiones de la entrega 3.9.3.
- 100 rondas y 600 navegaciones de estabilidad: sin crecimiento de listeners ni nodos al terminar, sin errores de ejecución. Capturas y estado del cliente de minijuegos inspeccionados.

Las nuevas regresiones forman parte del workflow de GitHub. CI remoto no ejecutado durante esta entrega. El ZIP se valida desde una extracción limpia antes de publicar.

Si no están disponibles ni Web Locks ni IndexedDB, se conserva el registro y se evita una compactación sin coordinación. Si el navegador rechaza IndexedDB, las respuestas compactas y la caché siguen funcionando; el mantenimiento puede reintentarse más adelante.

Los puntos A1 (filtro del radar en colores forzados), N2 (límite de notas y Unicode) y N3 (fecha local de la copia) de la revisión previa quedan fuera de esta corrección de rendimiento y continúan pendientes. N1 se aborda con registros más pequeños y compactación coordinada sin Web Locks.
