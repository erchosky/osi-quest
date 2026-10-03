# Fuentes del contenido educativo

Revisión de contenido: 1 de octubre de 2026. Estas referencias son normas, especificaciones y documentación de sus responsables. Las analogías de pizza, cartas y edificios son explicaciones propias; ayudan a recordar responsabilidades, sin describir literalmente una red.

## Modelo y funciones

| Referencia primaria                                                                                       | Uso en OSI Quest                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ITU-T X.200 · Modelo de referencia OSI](https://www.itu.int/rec/T-REC-X.200-199407-I/en)                 | Las siete responsabilidades y sus relaciones. La aplicación distingue el modelo conceptual de la organización real de los protocolos TCP/IP.           |
| [ITU-T X.225 · Protocolo de sesión OSI](https://www.itu.int/rec/T-REC-X.225-199511-I/en)                  | Diálogo, sincronización y recuperación de sesión. Los ejemplos no equiparan capa 5 con entrar en una cuenta ni exigen memorizar el número de la norma. |
| [ITU-T X.226 · Protocolo de presentación OSI](https://www.itu.int/rec/T-REC-X.226-199407-I/en)            | Representación y sintaxis de transferencia; distingue formato de interfaz visual.                                                                      |
| [IEEE 802.11 · MAC y PHY](https://www.ieee802.org/11/abt80211.html)                                       | Wi-Fi comprende funciones de enlace y físicas. Las preguntas identifican la función concreta.                                                          |
| [IEEE 802.3 · Publicación de especificaciones Ethernet](https://www.ieee802.org/3/publication/index.html) | MAC, tramas y variantes PHY de Ethernet. Un PHY como 1000BASE-T no convierte toda Ethernet en capa 1.                                                  |
| [ITU-T G.984.1 · Características GPON](https://www.itu.int/rec/T-REC-G.984.1-200803-I/en)                 | Diferencia la terminación óptica del abonado de la función de encaminamiento de un router.                                                             |

## Protocolos y evidencia

| Referencia primaria                                                                                | Uso en OSI Quest                                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RFC 9293 · TCP](https://www.rfc-editor.org/rfc/rfc9293.html)                                      | Flujo fiable y ordenado, secuencias, puertos y control de flujo. TCP no cifra el contenido por sí mismo.                                                      |
| [RFC 768 · UDP](https://www.rfc-editor.org/rfc/rfc768.html)                                        | Datagramas sin garantías propias de entrega y orden. Las funciones añadidas encima se distinguen de las garantías de UDP.                                     |
| [RFC 9000 · QUIC](https://www.rfc-editor.org/rfc/rfc9000.html)                                     | Transporte sobre UDP con flujos y mecanismos propios. Evita enseñar que todo uso de UDP carece de recuperación.                                               |
| [RFC 9114 · HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)                                   | HTTP/3 utiliza QUIC; la lección de una conexión HTTPS sobre TCP se presenta como un ejemplo concreto.                                                         |
| [RFC 8446 · TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)                                  | Protección y autenticación según configuración y validación. El encaje completo de TLS en OSI se presenta como aproximado.                                    |
| [RFC 8200 · IPv6](https://www.rfc-editor.org/rfc/rfc8200.html)                                     | Direcciones, Next Header y Hop Limit. Cambiar la trama del enlace no implica que toda la cabecera IP permanezca idéntica.                                     |
| [RFC 4443 · ICMPv6](https://www.rfc-editor.org/rfc/rfc4443.html)                                   | Control y diagnósticos relacionados con IP. Ping verifica un intercambio concreto, no el recurso de una web.                                                  |
| [RFC 1035 · DNS](https://www.rfc-editor.org/rfc/rfc1035.html)                                      | Servicio de nombres y uso de UDP o TCP. Resolver un nombre no comprueba que funcione el servicio HTTP.                                                        |
| [RFC 2131 · DHCP](https://www.rfc-editor.org/rfc/rfc2131.html)                                     | Servicio de configuración sobre UDP. Proporcionar parámetros IP no convierte DHCP en el protocolo que encamina.                                               |
| [RFC 9110 · Semántica HTTP](https://www.rfc-editor.org/rfc/rfc9110.html)                           | Peticiones y estados. 404 puede significar que no se encuentra el recurso o que no se revela su existencia; una respuesta puede proceder de un intermediario. |
| [RFC 5737 · IPv4 para documentación](https://www.rfc-editor.org/rfc/rfc5737.html)                  | Direcciones de ejemplo que no se presentan como destinos públicos reales para probar.                                                                         |
| [NIST · Bits, bytes y prefijos decimales/binarios](https://physics.nist.gov/cuu/Units/binary.html) | Ocho bits por byte y distinción MB/MiB. La conversión de 100 Mb/s a 12,5 MB/s usa unidades decimales y excluye sobrecargas.                                   |
| [RFC 3393 · Variación de retardo](https://www.rfc-editor.org/rfc/rfc3393.html)                     | Distingue variación de retardo, tiempo de respuesta y transferencia; no los reduce al número de barras Wi-Fi.                                                 |

## Observar tu dispositivo

| Documentación primaria                                                                                            | Uso y límite                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Microsoft · ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig) | La instrucción sin parámetros muestra configuración de direcciones, máscara y puerta de enlace. La lección propone observar, sin cambiar la configuración.             |
| [Apple · Ajustes TCP/IP del Mac](https://support.apple.com/guide/mac-help/mh14129/mac)                            | Los ajustes de conexión reúnen información TCP/IP; nombres y campos dependen de la versión y del servicio de red.                                                      |
| [Apple · Direcciones Wi-Fi privadas](https://support.apple.com/102509)                                            | Una MAC puede ser privada y cambiar. No se enseña como identidad permanente ni se recomienda desactivar esta protección para aprender.                                 |
| [Google · Ajustes de red de Android](https://support.google.com/android/answer/9654714?hl=es)                     | Google también indica variaciones según versión y fabricante. La lección orienta a buscar información de conexión sin prometer una ruta de menús o campos universales. |
| [Apple · Routers y puntos de acceso Wi-Fi](https://support.apple.com/102766)                                      | Bandas, canales e interferencias pueden afectar a capacidad y fiabilidad. Las comparaciones no prometen una velocidad fija por usar 2,4 o 5 GHz.                       |

En móviles no se ofrecen pasos universales para dirección IP, router o DNS: su disponibilidad y ubicación cambian. Ante diferencias, se remite a la ayuda del fabricante. El contenido propone comparar observaciones y cambiar una variable cada vez; no sustituye una prueba por un diagnóstico automático.
