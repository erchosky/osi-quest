# Rendimiento 3.7

La medición comprime cada recurso con gzip localmente. Son tamaños estimados, no latencia ni resultados en un móvil físico.

Inicio usa tres peticiones JS/CSS (dos módulos JS y un CSS): **162.015 bytes sin comprimir y 47.431 bytes gzip estimados** en el recorrido real, con un presupuesto de 55 KiB gzip. El informe preciso de la compilación se genera en work/build/report.json; dist-test usa report-test.json para no reemplazarlo.

## Pantallas diferidas

Los siguientes tamaños son incrementales respecto al arranque e incluyen sus dependencias estáticas y CSS. No se descargan todos al iniciar.

| Pantalla | Gzip estimado | Presupuesto |
| --- | ---: | ---: |
| play | 14.162 bytes | 30 KiB |
| study | 19.897 bytes | 32 KiB |
| setup | 17.553 bytes | 40 KiB |
| quiz | 27.430 bytes | 40 KiB |
| order | 24.131 bytes | 40 KiB |
| matching | 27.028 bytes | 40 KiB |
| packet | 30.242 bytes | 40 KiB |
| survival | 27.294 bytes | 40 KiB |
| duel | 12.117 bytes | 40 KiB |
| flashcards | 9.877 bytes | 40 KiB |
| progress | 18.959 bytes | 40 KiB |
| class | 9.127 bytes | 40 KiB |
| explore | 5.887 bytes | 40 KiB |

Mi progreso pasó de necesitar unos 55,9 KB a unos 19 KB y Clase de 54,2 KB a unos 9,1 KB al usar los metadatos y la huella generada. Los datos del banco siguen cargándose al practicar. La huella se verifica contra el contenido completo, sin cambiar semillas ni códigos.

## CSS

Cada archivo tiene un único propietario: grupo inicial, juego compartido o una función específica. Las capas siguen el mismo orden explícito en desarrollo y producción. La ruta espera la carga CSS; el cargador comparte enlaces ya montados y borra entradas fallidas para permitir reintentar. Veinte navegaciones entre pantallas ya visitadas no descargan estilos otra vez ni añaden enlaces.

La versión 3.6 tenía CSS descartado en cinco pantallas. Su menor tamaño no constituye una mejora comparable: la 3.7 restaura esas reglas y añade cobertura visual.

## Precarga y coste visible

Inicio precarga Jugar ante intención de foco/puntero; Jugar prepara Configurar y Configurar prepara JS/CSS del modo elegido. Se respeta saveData, 2G/slow-2g y el fallback de idle. Se cancelan esperas al salir. No se aplazan los controles esenciales de salida ni los relojes.

Las actividades usan content-visibility, tarjetas compactas y detalles cerrados. La importación sigue en Worker y la búsqueda conserva debounce de 150 ms. No se introduce una caché global de HTML cambiante ni se reemplaza el sanitizador por una API sin comprobar la misma protección.

## Evidencia y límites

build-report.mjs conserva metafile, dependencias, mayores entradas y tamaños, y comprueba presupuestos. CI publica ese informe, la regresión visual, la caché y la estabilidad como artefactos. No hay publicación automática de comentarios en un repositorio inexistente.

La estabilidad se verifica en 100 rondas y 600 navegaciones por entorno, con GC tras calentamiento y presupuesto de crecimiento de 4 MiB. La matriz visual usa cinco anchuras de Chromium. Lighthouse 4G/CPU, CLS medido, Firefox, Safari y Android físico quedan como tareas explícitas en PRIORIDADES-3.7.md.
