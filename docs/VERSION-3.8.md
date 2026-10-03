# OSI Quest 3.8

## Las cinco novedades

- **Instalable y sin conexión.** Manifest, iconos y Service Worker incluidos en el build. El perfil muestra «Contenido listo sin conexión» solo después de almacenar todo el contenido. Una primera visita con Internet es necesaria. Safari en iPhone/iPad usa Compartir → Añadir a pantalla de inicio; en Android/escritorio la instalación depende del navegador. Los enlaces externos a fuentes necesitan Internet.
- **Temas.** Automático según el sistema, claro, oscuro y contraste elevado en el perfil. La selección se guarda localmente; el tema automático responde a los cambios del sistema sin recargar. Se respeta movimiento reducido y el modo de colores forzados.
- **Inspector hexadecimal.** Explorar → Inspector de paquetes. Selecciona Ethernet, IPv4, TCP y HTTP; los campos resaltan sus bytes y su capa. Tres comprobaciones explican MAC, IP y puerto. Permite pegar una trama Ethernet II/IPv4/TCP de hasta 4096 bytes; valida longitudes, opciones, fragmentación y checksums. El ejemplo está construido según formatos reales con direcciones de documentación: no es una captura privada ni captura tráfico. No decodifica Wi-Fi, VLAN, IPv6, UDP, TLS ni reensambla flujos TCP.
- **Sprint OSI.** Jugar → Sprint OSI. Comienza con 60 segundos; aciertos sin ayuda suman 2 s (cadena 1–2), 3 s (3–4) o 4 s (5+). Un error o una pista corta la cadena y no añade tiempo. El reloj es global e incluye leer la explicación; pausa, ocultar la pestaña y el panel de salida suspenden el reloj. Normal otorga 8 XP y difícil 20 XP por acierto sin ayuda. Se revisan las respuestas al terminar.
- **Práctica por capa.** El mapa de Explorar abre la configuración de la capa elegida. También está en Jugar. Las rondas seleccionan exclusivamente preguntas de esa capa; difícil prioriza sus preguntas difíciles. La media histórica compara rondas de la misma capa y dificultad.

## Correcciones y estructura

El inspector separa vista, controlador y decodificador. Las sesiones no conocen el DOM ni el almacenamiento. Los temas usan variables; se corrigieron cinco expresiones CSS anidadas inválidas detectadas durante la revisión. La compilación mantiene nombres virtuales distintos para cada grupo CSS y pruebas de estilos calculados entre desarrollo y producción.

Se acotaron las escrituras del marcador de estudio, se aisló practiceOnly también en juegos interactivos, se añadió alternativa de importación cuando no puede crearse el Worker, se adjunta el enlace de descarga al DOM, se usa Shift+F para pantalla completa, se corrigió el espacio inferior móvil y se pasa el generador sembrado al repaso adaptativo usando la fecha real del calendario. Los repasos consultan evidencia de su dificultad; los datos antiguos sin desglose se conservan para normal. La comprobación de versión empieza tras el arranque y se repite cada 15 minutos.

## Revisión del informe de Antigravity

Las etiquetas «grave» del informe no se aceptaron sin reproducir o trazar el código. Los puntos 4, 5, 6, 9–12 y 14–16 tienen correcciones o controles concretos en esta entrega. El enlace de salto (1), las rutas malformadas (18) y repetir Historia (19) ya tenían protección; sus pruebas se mantienen. El punto 17 describe el contrato intencionado de composición: html escapa datos y raw incorpora fragmentos revisados, con sanitizador central.

El checksum opcional (7) detecta corrupción accidental, no autentica resultados. Anonimizar nombres de duelo (8) es una decisión de privacidad y ahora la documentación coincide. No se fuerza una correspondencia ficticia entre protocolos de Internet y las capas 5/6 (13): el estudio explica la diferencia OSI/TCP-IP. Los diálogos no se sustituyen mientras hay otro abierto (20), y los flujos de salida/importación se verifican. La instalación de dependencias sin scripts conserva paquetes opcionales de plataforma en el lockfile; no se añade un binario Linux como dependencia de todos los sistemas (3).

CSP en HTML y sanitización existen, y Trusted Types se comprueba en Chromium. Las cabeceras _headers dependen del host; no se afirma protección HTTP efectiva de un servidor que no las aplique (2). La inspección del artefacto no sustituye comprobar la configuración de una cuenta de hosting.

## Auditoría y límites

La auditoría Standard independiente revisó todos los archivos textuales enumerados del alcance: aplicación, datos, sanitizador vendorizado, configuración, estilos, pruebas y documentación. No se validaron vulnerabilidades reportables. Se excluyeron dependencias instaladas, resultados generados, salidas temporales y metadatos Git; los PNG se inspeccionaron por formato, sin auditoría completa de sus bytes. Es una revisión del código, no una garantía de ausencia absoluta de defectos.

El informe sellado corresponde a la instantánea anterior a los ajustes finales de depuración. El servicio indicó cambios de directorio durante el escaneo (incluye resultados de pruebas generados); las correcciones finales se validan de nuevo en las suites. Consumo registrado por la herramienta: **20.075.431 tokens totales**, de ellos **18.537.600 tokens de entrada en caché**, para cinco hilos; la cifra procede del servicio y no es una estimación manual.

Se comprueban el build real con prefijo, primera carga completa, recarga sin conexión, pantallas no visitadas previamente, actualizaciones entre varias pestañas y conservación de una versión funcional si falla la caché nueva. No hay certificación física iOS/Android ni pruebas completas de todos los navegadores. El progreso continúa siendo local al navegador; una partida en curso no sobrevive a recargar.

## Herramientas opcionales del navegador

Cuando document.modelContext está disponible se registran read_learning_progress (solo lectura, sin nombres) y configure_focused_practice (abre configuración; no comienza ni abandona una partida). Se validan parámetros, se rechaza cambiar durante una ronda y se usa el mismo modelo/ruta que la interfaz. Los contratos se prueban con un registro simulado; no hay un contexto WebMCP nativo habilitado en el navegador de pruebas, por lo que su validación nativa se declara **no disponible**. Los navegadores sin esta API usan la app normalmente.

## Reproducir la verificación

Resultados de la entrega local del 2 de octubre de 2026:

| Comprobación | Resultado |
| --- | --- |
| Dominio, contenido, persistencia y contratos | 131 pruebas pasan |
| Juego, clase, aprendizaje, historia, accesibilidad e interfaz | 690 comprobaciones pasan |
| Build instrumentado y producción sin hooks | 21 + 26 comprobaciones pasan |
| Estilos calculados desarrollo/producción | 30 pares, cero diferencias |
| Preferencias, configuración, navegación y caché CSS | 24 comprobaciones pasan |
| Nuevas funciones y actualización PWA | 32 + 6 comprobaciones pasan |
| Navegación prolongada | 100 rondas y 600 navegaciones; sin crecimiento de listeners/DOM, heap +1.06 MiB |
| Carga inicial JS/CSS real | 3 peticiones, estimación gzip 53.999 bytes, por debajo del presupuesto de 55 KiB |
| Dependencias de producción | npm audit: cero vulnerabilidades conocidas; 8 firmas y 4 attestations verificadas |

Las pruebas de fallos de carga bloquean el Service Worker para que la caché no esconda la petición que se intercepta. Las suites PWA usan el trabajador real y un prefijo de ruta. La prueba de actualización espera la recarga efectivamente terminada y respeta el límite de frecuencia del comprobador de versión; no usa esperas arbitrarias para fingir éxito.

Con Node 22 o posterior:

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run verify
npm run test:production
```

Con la vista de desarrollo abierta, indica su URL en OSI_TEST_URL y ejecuta npm run test:browser y npm run test:stability. Los informes y capturas quedan en work; no se publican. npm run test:v38 verifica las cinco funciones nuevas y los casos de actualización offline. El ZIP contiene fuente modular y dist; no incluye credenciales, .openai, .git, dependencias instaladas ni perfiles de pruebas.
