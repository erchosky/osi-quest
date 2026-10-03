// Daily examples extend the conceptual route; examples describe evidence, not automatic diagnoses.
const check = (prompt, choices, correctIndex, explanation) => ({
  prompt,
  choices,
  correctIndex,
  explanation,
});
export const practicalLessons = {
  url: {
    introduction:
      'Escribes una dirección y aparece una página. Ese gesto reúne varias funciones. Seguiremos una conexión nueva HTTPS sobre TCP, sin datos guardados en caché; HTTP/3 sigue otra ruta de transporte.',
    sections: [
      {
        title: '1. Encontrar el destino',
        paragraphs: [
          'El navegador interpreta la URL: esquema, nombre, puerto si se indica y ruta. DNS puede resolver el nombre a una dirección. Si ya existe información válida en caché, no siempre se realiza una nueva consulta.',
          'DNS ofrece un servicio de Aplicación (7), aunque su respuesta contenga una IP. Obtener una dirección no demuestra que el servidor vaya a responder.',
        ],
      },
      {
        title: '2. Preparar una comunicación',
        paragraphs: [
          'En este ejemplo, el cliente establece una conexión TCP con SYN, SYN-ACK y ACK. TCP organiza un flujo fiable y ordenado (Transporte, 4); una conexión establecida no demuestra que el contenido esté cifrado.',
          'IP guía paquetes entre redes (3). En cada salto, Ethernet o Wi-Fi realizan trabajo local (2) y transmiten mediante señales (1). Estos trabajos colaboran: no ocurren como siete viajes separados.',
        ],
      },
      {
        title: '3. Proteger y pedir',
        paragraphs: [
          'TLS negocia protección. Cuando el cliente valida correctamente el certificado, comprueba la identidad del extremo con el que se comunica. Después HTTP expresa la petición y la respuesta. HTTPS no significa que TCP haya empezado a cifrar.',
          'Presentación (6) ayuda a pensar en representación y transformación de datos; Sesión (5), en gestión del diálogo. TCP/IP agrupa normalmente estas funciones con Aplicación. No asignamos TLS entero a una única caja OSI.',
        ],
      },
      {
        title: '4. Interpretar la respuesta',
        items: [
          'HTTP 200 indica éxito de esa petición; 404 significa que el participante HTTP no encuentra el recurso o no quiere revelar que existe, y 500 señala un error del servidor que respondió.',
          'El navegador interpreta contenido y puede pedir más recursos. Recibir HTML no garantiza que todas las imágenes o scripts funcionen.',
          'Regla útil: nombre → comunicación protegida → petición → respuesta. Comprueba qué evidencia tienes antes de cambiar ajustes.',
        ],
      },
    ],
    takeaway:
      'DNS encuentra información de destino; TCP entrega; TLS protege; HTTP expresa el servicio. Son trabajos diferentes.',
    check: check(
      'DNS responde y el servidor devuelve HTTP 404. ¿Qué puedes concluir?',
      [
        'La señal física necesariamente está rota.',
        'Recibiste una respuesta HTTP que no ofrece el recurso solicitado.',
        'TCP cifró automáticamente la página.',
      ],
      1,
      'La respuesta aporta evidencia de un participante HTTP accesible para esa petición. 404 puede indicar que no encuentra el recurso o que no quiere revelar su existencia; no demuestra una avería física.',
    ),
  },
  wifi: {
    introduction:
      'Wi-Fi conecta tu dispositivo con una red local mediante radio. Estar conectado a esa red no garantiza acceso a Internet ni una velocidad concreta.',
    sections: [
      {
        title: 'Señal y entrega local',
        paragraphs: [
          'La radio corresponde a funciones físicas (1). Acceso al medio, tramas y direcciones MAC describen funciones de enlace (2). El estándar Wi-Fi incluye ambas; clasifica el trabajo concreto, no una marca o una caja.',
          'El SSID es el nombre de la red inalámbrica. El punto de acceso une el tramo inalámbrico con la red local. El router encamina entre redes: en casa ambos suelen estar en el mismo equipo.',
        ],
      },
      {
        title: 'Cobertura no es velocidad',
        paragraphs: [
          'En general, 2,4 GHz alcanza mejor a través de obstáculos pero tiene menos canales no solapados y puede sufrir más interferencias. 5 GHz suele ofrecer más capacidad disponible a corta distancia. El resultado depende de entorno, estándar, canal y equipos; no es una promesa de velocidad.',
          'Las barras indican una estimación de señal, no la latencia ni la congestión. Puedes tener buena señal y compartir un canal saturado. Muros, distancia, interferencia y tráfico compiten con tu comunicación.',
        ],
      },
      {
        title: 'Una prueba cotidiana',
        items: [
          'Prueba cerca del punto de acceso y compara con la misma tarea lejos. Cambia una variable cada vez.',
          'Si el equipo funciona por cable pero no por Wi-Fi, la comparación acota el tramo inalámbrico; no identifica por sí sola una causa única.',
          'Si hay Wi-Fi pero ninguna web abre, comprueba configuración IP, puerta de enlace, DNS y servicio. No concluyas que «Wi-Fi está roto» por cualquier fallo de Internet.',
        ],
      },
    ],
    takeaway:
      'Wi-Fi cubre radio y entrega local. Señal, capacidad y acceso a Internet son cosas distintas.',
    check: check(
      'Hay cuatro barras de Wi-Fi y una descarga lenta. ¿Qué afirmación encaja?',
      [
        'La señal buena garantiza máxima velocidad.',
        'Puede haber congestión o un límite en otro tramo; las barras no miden toda la conexión.',
        'Más barras sustituyen DNS.',
      ],
      1,
      'La señal es solo una parte. Capacidad, tráfico, servidor y otros tramos también afectan al resultado.',
    ),
  },
  'home-network': {
    introduction:
      'La caja de tu operador puede reunir varias funciones. Entenderlas evita atribuir una capa entera a un dispositivo por su nombre.',
    sections: [
      {
        title: 'Qué hace cada pieza',
        items: [
          'ONT: termina una conexión de fibra de la red del operador. Un módem adapta una tecnología de acceso como cable o DSL. No son sinónimos universales de router.',
          'Router: encamina paquetes entre redes. Switch: reenvía tramas en un enlace local. Punto de acceso: conecta clientes inalámbricos a la red local.',
          'Una caja doméstica puede contener router, switch, punto de acceso, servicio DHCP, DNS y cortafuegos. Clasifica la acción que estudias, no toda la caja.',
        ],
      },
      {
        title: 'Cómo se configura tu equipo',
        paragraphs: [
          'DHCP puede proporcionar dirección IP, máscara, puerta de enlace y servidores DNS. Es un protocolo de aplicación (7); entregar parámetros de IP no lo transforma en capa 3.',
          'La máscara o prefijo ayuda a decidir si un destino está en la red local. La puerta de enlace es la salida apropiada hacia otras redes. DNS permite consultar nombres: no es la puerta de enlace, aunque ambos servicios puedan estar en el mismo aparato.',
        ],
      },
      {
        title: 'Mira tu configuración sin cambiarla',
        items: [
          'Windows: en una terminal, ipconfig muestra direcciones, máscara y puerta de enlace. macOS: consulta los detalles de la conexión en los ajustes de Red, como TCP/IP y DNS; los nombres pueden variar por versión.',
          'En Android e iOS, busca la información de la conexión Wi-Fi en Ajustes. Los campos disponibles y su ubicación dependen de la versión y del fabricante; consulta la ayuda del dispositivo si no aparecen. Observar la configuración no requiere modificarla.',
          'Identifica tres trabajos: IP (destino entre redes), MAC (interfaz del enlace) y puerto de transporte (proceso). Una MAC privada de Wi-Fi puede cambiar; no es una identidad permanente.',
        ],
      },
    ],
    takeaway:
      'Una caja, muchas funciones. Dirección propia, salida y nombres responden preguntas distintas.',
    check: check(
      'DHCP te entrega una dirección IP. ¿Cómo clasificas el protocolo DHCP?',
      [
        'Como una señal de capa 1.',
        'Como un servicio de aplicación que proporciona configuración.',
        'Como el cable que une dos puertos.',
      ],
      1,
      'Clasificas el servicio por lo que hace. Configurar parámetros IP no convierte DHCP en el protocolo IP.',
    ),
  },
  speed: {
    introduction:
      'Una conexión puede transportar muchos datos y aun así responder tarde. Velocidad de transferencia y tiempo de respuesta no son la misma medida.',
    sections: [
      {
        title: 'Bits, bytes y una cuenta útil',
        paragraphs: [
          'Un byte contiene ocho bits. Mb/s o Mbps expresa megabits por segundo; MB/s expresa megabytes por segundo. En unidades decimales, 100 Mb/s equivale como máximo teórico a 12,5 MB/s antes de sobrecargas y límites.',
          'Una descarga de 12 MB/s en una conexión de 100 Mb/s puede estar cerca de ese límite. No compares los números sin comprobar las unidades. La tasa anunciada no garantiza la tasa efectiva de toda aplicación.',
        ],
      },
      {
        title: 'Cuatro preguntas distintas',
        items: [
          'Capacidad o ancho de banda: cuántos bits por segundo puede transportar un tramo bajo determinadas condiciones.',
          'Latencia: cuánto tarda la comunicación. Un RTT mide ida y vuelta; no es una velocidad en MB/s.',
          'Jitter: variación del retardo. Pérdida: datos que no llegan. Afectan especialmente a conversaciones en directo.',
          'Rendimiento observado: datos útiles transferidos por tiempo. Puede estar limitado por Wi-Fi, congestión, servidor, equipo o protocolo.',
        ],
      },
      {
        title: 'Juego online, llamada y descarga',
        paragraphs: [
          'Una descarga tolera cierto retraso y quiere datos completos. Una conversación en directo necesita datos a tiempo; retransmitir audio viejo puede llegar demasiado tarde. La aplicación decide qué recuperar o descartar según su objetivo y los mecanismos disponibles.',
          'UDP no garantiza entrega ni orden por sí mismo, pero una aplicación puede construir mecanismos encima. QUIC utiliza UDP y añade su propio servicio de transporte, con flujos fiables y mecanismos de seguridad: no es simplemente UDP con otro nombre.',
          'No es correcto concluir que todo lo que usa UDP es necesariamente más rápido o que nunca comprueba errores. Evalúa las necesidades de la tarea y el protocolo concreto.',
        ],
      },
    ],
    takeaway:
      'MB/s describe transferencia; milisegundos describen retardo. Lee las unidades y la tarea que importa.',
    check: check(
      '¿Cuál es la conversión decimal teórica de 100 Mb/s antes de sobrecargas?',
      ['100 MB/s.', '12,5 MB/s.', '800 MB/s.'],
      1,
      'Divide entre ocho porque un byte son ocho bits. La tasa efectiva puede ser menor.',
    ),
  },
  security: {
    introduction:
      'Entregar datos de forma fiable y protegerlos son objetivos diferentes. Para comprender una defensa, pregunta qué protege, dónde actúa y qué deja fuera.',
    sections: [
      {
        title: 'Fiabilidad, confidencialidad e identidad',
        paragraphs: [
          'TCP ofrece un flujo fiable y ordenado; no cifra automáticamente su contenido. TLS puede proporcionar confidencialidad, integridad y autenticación del servidor, según la configuración y comprobación de certificados.',
          'Un aviso de certificado requiere investigar identidad, validez, nombre y configuración. Que una conexión esté cifrada no demuestra que una página sea honesta ni que su contenido sea seguro.',
        ],
      },
      {
        title: 'Defensas que se complementan',
        items: [
          'Protección Wi-Fi protege el tramo inalámbrico según su configuración. HTTPS protege una comunicación de aplicación hasta su extremo TLS. No son la misma cobertura.',
          'Un cortafuegos puede filtrar por direcciones, puertos, estado o información de aplicación; no se reduce a una sola capa para todos sus usos.',
          'Una VPN puede encapsular tráfico hacia otro extremo y proteger ese tramo. No garantiza anonimato absoluto ni sustituye el cuidado con cuentas, navegador o contenido.',
        ],
      },
      {
        title: 'Un ejemplo del día a día',
        paragraphs: [
          'Un repartidor puede entregar una carta completa sin que vaya cerrada. Fiabilidad sería que llegue; confidencialidad, limitar quién puede leerla; autenticación, comprobar con quién hablas. Las tres preguntas ayudan a separar TCP, TLS y el servicio.',
          'En OSI, Presentación permite razonar sobre representación y transformaciones; Sesión sobre diálogo. No clasifiques TLS entero como «solo capa 6» ni cualquier inicio con contraseña como «capa 5».',
        ],
      },
    ],
    takeaway:
      'TCP entrega; TLS protege una comunicación; ninguna etiqueta de capa garantiza seguridad de toda la experiencia.',
    check: check(
      'Una aplicación envía datos usando TCP sin TLS. ¿Qué puedes afirmar?',
      [
        'La fiabilidad de TCP implica cifrado.',
        'Puede tener entrega fiable sin confidencialidad del contenido.',
        'No necesita dirección IP.',
      ],
      1,
      'Fiabilidad y confidencialidad son propiedades diferentes. TCP no aporta cifrado de contenido por sí mismo.',
    ),
  },
  'browser-errors': {
    introduction:
      'Un mensaje de error es una pista sobre una prueba, no una etiqueta que demuestre una avería única. Primero interpreta lo observado y después elige la siguiente comprobación.',
    sections: [
      {
        title: 'Nombre, conexión y certificado',
        items: [
          'Un nombre inexistente o fallo de resolución orienta hacia DNS o su configuración. No demuestra que el cable esté roto.',
          'Un tiempo de espera puede implicar conectividad, filtrado, servicio, carga u otros problemas. No permite escoger una capa única sin más pruebas.',
          'Un aviso de certificado orienta hacia la comprobación TLS: nombre, fecha, confianza o configuración, entre otras causas. No atribuyas el cifrado a TCP.',
        ],
      },
      {
        title: 'Una respuesta HTTP ya es información',
        items: [
          '200: éxito de esa petición. 301: redirección permanente.',
          '403: el servidor entiende la petición y rechaza atenderla. 404: no encuentra el recurso solicitado o no quiere revelar que existe; no significa que nunca existiera ni que todo el servidor esté caído.',
          '500: error interno del servidor. 503: servicio temporalmente no disponible.',
          'Los códigos pertenecen al servicio de aplicación. La respuesta puede proceder del servidor o de un intermediario. Recibirla demuestra ese intercambio HTTP, no que todas las funciones o recursos estén bien.',
        ],
      },
      {
        title: 'Diagnostica con comparaciones',
        paragraphs: [
          'Si solo falla una web, compara otro recurso y otro dispositivo. Si falla el portátil y el móvil funciona en la misma red, compara sus conexiones y configuración. Cada resultado acota una parte; todavía puede haber varias explicaciones.',
          'Anota síntoma → prueba → observación → siguiente prueba. Evita cambiar DNS, reiniciar el router y desactivar protecciones a la vez: así no sabrás qué cambio importó.',
        ],
      },
    ],
    takeaway:
      'Una prueba solo demuestra lo que comprueba. Usa OSI para ordenar hipótesis, no para adivinar la causa.',
    check: check(
      'Solo una web responde HTTP 503 y otras funcionan. ¿Qué harías primero?',
      [
        'Dar por roto el cable de todas las redes.',
        'Investigar la disponibilidad de ese servicio y comparar, sin cambiar toda la configuración.',
        'Concluir que TCP tiene una MAC incorrecta.',
      ],
      1,
      'Una respuesta 503 es evidencia del servicio HTTP. Conviene investigar su disponibilidad y conservar lo que ya funciona.',
    ),
  },
};
