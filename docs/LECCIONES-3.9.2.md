# OSI Quest 3.9.2 · siete lecciones completas por capa

Las lecciones dejan de generarse concatenando la ficha breve y una pregunta del juego. Cada una tiene un módulo de contenido propio con seis secciones, un ejemplo desarrollado, mecanismos y vocabulario, comparación con otras responsabilidades, una investigación con límites y un ejercicio para explicarlo con palabras propias.

| Capa | Palabras de lectura | Tiempo orientativo | Caso de comprobación original |
| --- | ---: | ---: | --- |
| Física | 592 | 3 min | Pérdida de enlace al mover un cable y comparación con otro. |
| Enlace | 621 | 4 min | MAC del primer salto frente a IP del destino remoto. |
| Red | 652 | 4 min | Comunicación dentro de una subred y puerta de enlace inadecuada. |
| Transporte | 637 | 4 min | Confirmación TCP frente a aceptación de una reserva. |
| Sesión | 607 | 4 min | Fase reconocida por ambos participantes de un diálogo conceptual. |
| Presentación | 597 | 3 min | Bytes UTF-8 intactos interpretados con otra codificación. |
| Aplicación | 650 | 4 min | Dos recursos que responden 403 y 200 y siguiente investigación. |

El recuento incluye introducción, párrafos y listas; excluye resumen, notas y comprobación. El tiempo se calcula a 200 palabras/minuto, sin incluir práctica. No es un objetivo de velocidad ni una medida de comprensión.

Las siete comprobaciones tienen cuatro alternativas y explicaciones específicas de sus distractores. No se limita la respuesta a elegir el nombre de la capa. La prueba nativa comprueba que los enunciados no son idénticos a los del banco de juegos, Conexiones ni las antiguas fichas. Compartir conceptos entre estudio y práctica es deliberado; repetir literalmente la pregunta no lo es.

## Carga y organización

- `src/data/layer-lessons/`: un archivo por capa y un índice para herramientas de contenido.
- `lesson-loader.js`: carga solo el módulo solicitado; comparte solicitudes pendientes, conserva contenido cargado y permite reintentar una carga fallida.
- El índice de Estudiar usa metadatos ligeros. Las fichas breves de otras pantallas siguen cumpliendo su función de referencia rápida.
- La vista conserva índice de secciones, lectura sin distracciones, notas, posición guardada y continuidad entre lecciones. Responder no concede XP ni marca automáticamente la lectura.
- Los módulos publicados se incluyen en la caché PWA. Las pruebas verifican la carga sin conexión de una lección de capa antes no visitada.

## Referencias y criterios

Las capas conceptuales se contrastaron con [ITU-T X.200](https://www.itu.int/rec/T-REC-X.200/es), con referencias específicas de [Sesión X.215](https://www.itu.int/rec/T-REC-X.215/en) y [Presentación X.216](https://www.itu.int/rec/T-REC-X.216/en). Los ejemplos de Internet se apoyan en [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122.html), [TCP RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html), [UDP RFC 768](https://www.rfc-editor.org/rfc/rfc768.html), [JSON RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html) y [HTTP RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html).

Los casos y analogías son explicaciones didácticas propias. Se mantiene la distinción entre Sesión OSI y autenticación web, y entre representación de datos y ubicación de un protocolo real como TLS. No se atribuye a TCP recuperación automática de una operación ni aceptación de una petición del servicio.

La validación incluye catálogo y sintaxis, 145 pruebas nativas, las 72 alternativas de las 18 lecciones en producción, navegación y ejercicios específicos por sección, 35 comparaciones de estilos desarrollo/producción, interacciones de la app y continuidad de lectura, producción real y pruebas de instalación/actualización PWA. Las capturas de lectura móvil y escritorio y del cliente de minijuegos se inspeccionaron visualmente.
