# Correcciones de OSI Quest 3.9.3

## Los siete puntos

1. **Supervivencia:** perder las tres vidas muestra «SIN VIDAS» y «Te has quedado sin vidas». Se conservan los intentos, las explicaciones y el repaso de fallos. Una ronda superada mantiene su mensaje de reto completado.
2. **Sprint:** solo el reloj termina la ronda. Al recorrer el banco vuelve a barajar preguntas y opciones sin repetir inmediatamente la última pregunta, salvo un banco de una sola pregunta. Cada respuesta nueva conserva su intento, XP, cadena, bonificación y explicación; un doble clic no suma nada. El progreso muestra intentos y los últimos ocho puntos. La versión actual contiene 61 preguntas normales, frente a las 54 de la observación anterior.
3. **Unidades de datos:** las siete tarjetas explican bits, tramas, paquetes, segmentos/datagramas y datos. Las frases sobre otras funciones se han sustituido por explicaciones de la unidad y su encapsulación. Se conservan los IDs y el calendario de las tarjetas.
4. **Red de casa:** instrucciones para ChromeOS y Linux, incluidos ajustes gráficos, consulta con `nmcli device show` y alternativas cuando NetworkManager no está disponible. Se diferencian IP, prefijo, puerta de enlace, DNS y MAC.
5. **Wi-Fi:** banda de 6 GHz, Wi-Fi 6E/7, compatibilidad del dispositivo/punto de acceso/sistema y disponibilidad regional. Se aclara que Wi-Fi 6 no implica 6 GHz y que una banda nueva no garantiza más cobertura.
6. **Enlaces:** componente compartido para las referencias del diccionario y del inspector. El nombre accesible incluye «se abre en otra pestaña». El sanitizador conserva únicamente `target="_blank"` en enlaces y fuerza `noopener noreferrer`; elimina ventanas con nombre y destinos en otros elementos.
7. **Idiomas:** idioma visible en cada referencia, aviso de la combinación de español e inglés y versiones oficiales en español de las introducciones de Cloudflare e IBM. Las RFC siguen identificadas como inglés.

## Validación local

Node.js 22.23.2 y Chromium de Playwright 1.62.1, con perfiles aislados. No se ha ejecutado CI remoto.

- `npm run verify`: catálogos, sanitizador, sintaxis, **150 pruebas nativas** y build. Regresiones nuevas: tres ciclos en normal/difícil, semilla, final del reloj, pausa, XP acumulados, doble clic, banco unitario y resultados de supervivencia.
- `node scripts/verify-release-393-browser.mjs`: **103 comprobaciones de producción**, incluyendo **68 respuestas correctas** que atraviesan el banco normal, **544 XP**, final por reloj, 68 explicaciones, las siete tarjetas de unidad, contenido de las lecciones y los 15 enlaces de ambas pantallas. Comprueba una pestaña real sin `opener` con la respuesta externa simulada, sin depender del servidor de la referencia.
- Axe sin infracciones en los resultados de supervivencia, Sprint reciclado, diccionario e inspector. Nombres accesibles comprobados automáticamente; no equivale a una sesión manual con cada lector de pantalla.
- App: **187** comprobaciones; aprendizaje y partidas: **136**; estudio: **72** alternativas de las **18** lecciones en producción.
- Producción real: **28** comprobaciones, incluidos CSP/Trusted Types, sanitización de contenido ejecutable y protección de pestañas. Carga inicial estimada: **53.488 bytes gzip**, dentro del presupuesto de 55 KiB.
- Funciones/offline: **32**; actualización del Service Worker: **6**. Formato e integridad del diff correctos.
- Cliente de minijuegos ejecutado y capturas de partida, pérdida de vidas, Sprint tras el reciclado y referencias inspeccionadas.

Las regresiones nuevas están incluidas en el workflow de GitHub. El ZIP incluye fuentes modulares, lockfile, tests, scripts, documentación y build, sin dependencias instaladas, credenciales ni datos del usuario. La entrega se comprueba también desde una extracción limpia antes de publicarla.

## Referencias

Los cambios de contenido se apoyan en [Google para ChromeOS](https://support.google.com/chromebook/answer/1047420?hl=es), [NetworkManager](https://www.networkmanager.dev/docs/api/latest/nmcli.html) e [Intel para 6 GHz](https://www.intel.com/content/www/us/en/support/articles/000099711/wireless.html). Los enlaces y sus idiomas están en `src/data/sources.js` y [Fuentes](FUENTES.md).
