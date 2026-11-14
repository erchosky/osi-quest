# OSI Quest 3.9.1 · analogías y comprobaciones de estudio

La revisión corrige dos problemas de contenido: Enlace y Transporte compartían la imagen de entregar dentro de un edificio, y algunas comprobaciones de fundamentos/prácticas se podían resolver descartando respuestas absurdas.

## Una diferencia estable entre capas

- **Enlace (2):** entrega al siguiente punto del recorrido, en el tramo local. La MAC identifica una interfaz del enlace. Para un destino remoto, la trama local normalmente se dirige a la puerta de enlace.
- **Red (3):** dirección y encaminamiento entre redes, con IP.
- **Transporte (4):** comunicación entre procesos de los extremos. El número de departamento destinatario recuerda al puerto de destino. El seguimiento recuerda a la fiabilidad de TCP, pero UDP no aporta esas garantías por sí mismo.

La distinción aparece en las fichas, las lecciones, Conexiones, Historia y las preguntas que reutilizan las analogías. No es una descripción literal de una red: se acompaña de MAC, IP y puertos y de los límites de cada comparación.

## Las once comprobaciones revisadas

Todas plantean una situación con cuatro opciones. Cada distractor representa una confusión cercana y tiene su explicación propia, que solo se muestra después de elegir. La explicación general conecta la respuesta con la lección. El orden se sigue barajando; estas comprobaciones no suman XP ni marcan automáticamente la lección como leída.

| Lección | Confusiones que se trabajan |
| --- | --- |
| Antes de las capas | Responsabilidad frente a programa, cronología o viaje independiente. |
| MAC, IP y puertos | MAC del siguiente salto, IP compartida, puerto de origen y de destino. |
| OSI frente a TCP/IP | Funciones de aplicación frente a transporte, Internet y acceso. |
| Las envolturas | Orden de trama, paquete, segmento y datos con las mismas unidades. |
| Investigar una conexión | Resultado ICMP frente a HTTP; alcance de una prueba por IP. |
| De una URL a una página | Resolución DNS, respuesta HTTP y disponibilidad del recurso. |
| Wi-Fi | Señal frente a rendimiento; comparación controlada con cable. |
| Tu equipo y la caja del operador | Proporcionar configuración frente a encaminar, resolver o conmutar. |
| Velocidad y latencia | Bits frente a bytes y sentido de la conversión. |
| Proteger una comunicación | Fiabilidad, confidencialidad, identidad y cobertura del Wi-Fi. |
| Lo que dice el navegador | Investigar un servicio que responde 503 frente a cambiar ajustes sin evidencia. |

Las opciones tienen una longitud parecida, sin una regla que obligue a que la correcta sea la más larga. El contenido sigue siendo de iniciación: aumentar el número de alternativas no demuestra por sí mismo una mayor calidad ni dominio del alumno.

## Referencias y comprobación

Se contrastaron las responsabilidades de enlace/transporte con [RFC 1122, secciones 2 y 4](https://www.rfc-editor.org/rfc/rfc1122.html), y el alcance de 404/503 con [RFC 9110, secciones 15.5.5 y 15.6.4](https://www.rfc-editor.org/rfc/rfc9110.html). Son referencias para el contenido, no instrucciones ejecutables.

La regresión nativa comprueba el catálogo, la correspondencia de alternativas y explicaciones, el escape de texto y la compatibilidad con las siete comprobaciones por capa. `node scripts/verify-study-checks-browser.mjs` recorre las 44 opciones en producción, verifica la explicación elegida tras el barajado, el bloqueo de nuevas respuestas, la ausencia de XP/lectura automática y el ancho móvil, y captura ejemplos móviles y de escritorio.

La inspección de las capturas detectó otro fallo al entrar directamente a Estudiar en producción: los botones de respuesta dependían de un estilo de Jugar que no se cargaba. Se corrige la dependencia de estilos, sin alterar el inicio de la app, y se añade la comprobación del botón a la comparación de estilos desarrollo/producción.
