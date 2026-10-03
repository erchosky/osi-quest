// Structured prose keeps educational content separate from its HTML renderer.
export const lessons = {
  basics: {
    introduction:
      'Una red es un conjunto de dispositivos que intercambian información. Tu móvil, el router y un servidor pueden participar en la misma conversación, aunque estén a miles de kilómetros.',
    sections: [
      {
        title: 'Empieza por tres ideas',
        items: [
          'Mensaje: lo que quieres comunicar, como una foto o una petición de una página.',
          'Protocolo: reglas compartidas para entenderse. Igual que acordar un idioma y cuándo puede hablar cada persona.',
          'Red: las conexiones y dispositivos que permiten que el mensaje llegue. Internet conecta muchas redes.',
        ],
      },
      {
        title: 'OSI es un mapa de responsabilidades',
        paragraphs: [
          'El modelo OSI divide la comunicación en siete capas. Cada una resuelve una parte del problema y utiliza los servicios de la capa inferior. Es una herramienta para explicar y diagnosticar redes.',
          'Los protocolos reales de Internet se organizan normalmente con el modelo TCP/IP. OSI no es una lista de siete programas que tu ordenador tenga que ejecutar: algunas funciones se combinan en la práctica.',
        ],
      },
      {
        title: 'Piensa en pedir una pizza',
        paragraphs: [
          'Tú eliges la pizza, alguien entiende el pedido, se coordina la conversación, se organiza la entrega, se decide una ruta y el repartidor recorre las calles. Son tareas distintas para cumplir una única petición.',
          'Esta comparación te ayudará a recordar funciones. Una pizza no describe todos los detalles de una red; usaremos también ejemplos reales.',
        ],
      },
      {
        title: 'Dos direcciones, el mismo orden',
        items: [
          'Numeración: 1 Física → 2 Enlace → 3 Red → 4 Transporte → 5 Sesión → 6 Presentación → 7 Aplicación.',
          'Envío: el mensaje baja de la capa 7 a la 1.',
          'Recepción: el destino lo interpreta subiendo de la 1 a la 7.',
        ],
      },
    ],
    takeaway: 'No memorices solo los nombres: pregunta qué problema resuelve cada capa.',
    check: {
      prompt: '¿Para qué sirve el modelo OSI?',
      choices: [
        'Para organizar y entender las funciones de una comunicación.',
        'Para garantizar que Internet nunca falle.',
        'Para sustituir todos los protocolos.',
      ],
      correctIndex: 0,
      explanation:
        'OSI es un modelo de referencia: ayuda a comprender responsabilidades y a investigar problemas.',
    },
  },
  addresses: {
    introduction:
      'MAC, IP y puerto aparecen en la misma comunicación, pero contestan preguntas diferentes. Confundirlos es una de las trampas más habituales.',
    sections: [
      {
        title: 'MAC · ¿A quién entrego en este enlace?',
        paragraphs: [
          'Una dirección MAC identifica una interfaz dentro del enlace. Un switch de capa 2 utiliza direcciones MAC para reenviar tramas.',
          'Para llegar a un servidor fuera de tu red, tu ordenador envía normalmente la trama a la MAC de la puerta de enlace, no a la MAC del servidor remoto.',
        ],
      },
      {
        title: 'IP · ¿Qué destino hay entre redes?',
        paragraphs: [
          'Una dirección IP permite direccionar paquetes. Los routers consultan sus rutas y deciden el siguiente salto hacia el destino.',
          'Piensa en la dirección del edificio. Puede cambiar y no es una identidad permanente de una persona o dispositivo. NAT puede modificar direcciones al atravesar una red.',
        ],
      },
      {
        title: 'Puerto · ¿Qué proceso recibe los datos?',
        paragraphs: [
          'TCP y UDP usan números de puerto para distinguir comunicaciones entre procesos. Un mismo equipo puede navegar y hacer una videollamada a la vez.',
          'Piensa en una ventanilla dentro del edificio: la IP te lleva al destino y el puerto ayuda a identificar el servicio o proceso. Un puerto de transporte no es el conector físico del router.',
        ],
      },
      {
        title: 'Un ejemplo completo',
        items: [
          'Tu navegador abre una conexión TCP hacia 203.0.113.20, puerto 443, desde un puerto temporal.',
          'En la red local, el paquete viaja en una trama dirigida a la MAC del router.',
          'Al cambiar de enlace, cambia la envoltura de capa 2. El destino IP guía la comunicación entre redes. La dirección del ejemplo está reservada para documentación.',
        ],
      },
    ],
    takeaway:
      'MAC: entrega local. IP: direccionamiento entre redes. Puerto: comunicación con un proceso.',
    check: {
      prompt:
        'Para elegir una aplicación receptora en una comunicación TCP, ¿qué dato es relevante?',
      choices: ['El color del cable.', 'El puerto de transporte.', 'Solo la MAC.'],
      correctIndex: 1,
      explanation:
        'Los puertos permiten diferenciar comunicaciones entre procesos. La MAC y la IP cumplen otras funciones.',
    },
  },
  tcpip: {
    introduction:
      'OSI te ayuda a pensar en siete responsabilidades. TCP/IP describe la arquitectura usada en Internet. No necesitas forzar cada protocolo real a encajar en una única caja.',
    sections: [
      {
        title: 'La comparación habitual de cuatro capas',
        items: [
          'Aplicación TCP/IP agrupa funciones que OSI explica en Aplicación, Presentación y Sesión (7, 6 y 5).',
          'Transporte TCP/IP corresponde a Transporte OSI (4): TCP y UDP.',
          'Internet TCP/IP corresponde aproximadamente a Red OSI (3): IP.',
          'Acceso a la red agrupa Enlace y Física OSI (2 y 1). Algunos materiales separan estas dos y presentan cinco capas.',
        ],
      },
      {
        title: 'Una página web de verdad',
        paragraphs: [
          'HTTP expresa una petición. DNS resuelve un nombre. TCP puede transportar los datos; IP permite que crucen redes y Ethernet o Wi-Fi cubren funciones del enlace y del medio físico.',
          'Una aplicación también puede elegir otros protocolos. HTTP/3 usa QUIC sobre UDP. Por eso “la web siempre usa TCP” sería una generalización incorrecta.',
        ],
      },
      {
        title: 'Cuidado con los atajos',
        paragraphs: [
          'TLS ofrece seguridad a protocolos como HTTP. Es habitual asociar el cifrado con Presentación al estudiar OSI, pero TLS no se deja describir de forma completa como una única capa OSI.',
          'Sesión no significa necesariamente iniciar sesión con contraseña. La autenticación de una web y el control del diálogo del modelo OSI son conceptos diferentes.',
        ],
      },
    ],
    takeaway: 'Usa OSI para comprender funciones y TCP/IP para conectar esas ideas con Internet.',
    check: {
      prompt:
        '¿Dónde se agrupan normalmente las funciones de OSI 5, 6 y 7 en el modelo TCP/IP de cuatro capas?',
      choices: ['En Internet.', 'En Acceso a la red.', 'En Aplicación.'],
      correctIndex: 2,
      explanation:
        'La capa de Aplicación TCP/IP agrupa esas funciones. La correspondencia es una simplificación útil.',
    },
  },
  encapsulation: {
    introduction:
      'Encapsular significa envolver datos con información de control. Cada capa añade lo que necesita para hacer su trabajo. El destino procesa esas envolturas en sentido inverso.',
    sections: [
      {
        title: 'Como preparar un envío',
        paragraphs: [
          'Escribes una carta, la metes en un sobre con una dirección y después en un embalaje adecuado para un tramo del viaje. El contenido sigue ahí; se añaden instrucciones para transportarlo.',
          'En una comunicación HTTP sobre TCP, los datos de aplicación van dentro de un segmento TCP. El segmento se transporta dentro de un paquete IP y este, dentro de una trama Ethernet.',
        ],
      },
      {
        title: 'Qué aporta cada envoltura',
        items: [
          'TCP añade, entre otros datos, puertos y números de secuencia. UDP tiene una cabecera distinta y no aporta las mismas garantías.',
          'IP añade direcciones y datos para encaminar el paquete.',
          'Ethernet añade direcciones MAC y un control de errores para esa trama.',
          'Física transmite los bits mediante señales. No es otra caja con una dirección.',
        ],
      },
      {
        title: 'Al llegar',
        paragraphs: [
          'El receptor interpreta la trama, procesa el paquete IP, entrega el segmento al transporte y finalmente los datos a la aplicación.',
          'Los routers procesan la información necesaria para reenviar paquetes y preparan una nueva trama para el siguiente enlace. No abren tu mensaje como lo haría la aplicación destinataria.',
        ],
      },
    ],
    takeaway:
      'Datos → segmento TCP → paquete IP → trama → bits. La recepción recorre el camino inverso.',
    check: {
      prompt: 'En este ejemplo TCP/IP/Ethernet, ¿qué contiene una trama?',
      choices: [
        'Un paquete IP, que contiene un segmento TCP con datos.',
        'Solo una dirección MAC, sin datos.',
        'Siete tramas idénticas.',
      ],
      correctIndex: 0,
      explanation:
        'Las unidades se anidan. Cada envoltura tiene una responsabilidad y transporta lo que viene de arriba.',
    },
  },
  troubleshoot: {
    introduction:
      'Que una página no cargue es un síntoma. Todavía no es un diagnóstico. OSI te ayuda a organizar las preguntas y a buscar pruebas antes de concluir.',
    sections: [
      {
        title: 'Una investigación ordenada',
        items: [
          'Observa: ¿falla una página, todas las aplicaciones o todos los dispositivos?',
          'Comprueba el medio: cable, señal y estado de enlace.',
          'Comprueba la red: dirección IP, puerta de enlace y rutas.',
          'Comprueba nombres y servicios: ¿resuelve DNS? ¿Responde el servicio esperado?',
          'Cambia una cosa cada vez y comprueba el resultado.',
        ],
      },
      {
        title: 'El caso de la pizza que no llega',
        paragraphs: [
          'Si no recibes el pedido, no sabes aún si la carretera está cortada, la dirección es incorrecta o el restaurante no lo preparó. Necesitas separar esas posibilidades.',
          'Igual en redes: una respuesta HTTP 404 demuestra que hubo una respuesta de un servidor HTTP. Revisar primero el cable por ese dato no sería la mejor hipótesis.',
        ],
      },
      {
        title: 'Una prueba tiene límites',
        paragraphs: [
          'Un ping sin respuesta puede deberse a filtros o a un destino que no responde a ICMP. No demuestra por sí solo que el cable esté roto.',
          'Una IP correcta no prueba que DNS funcione. Un enlace activo no prueba que Internet esté disponible. Cada prueba respalda una conclusión concreta.',
        ],
      },
    ],
    takeaway:
      'Síntoma → hipótesis → prueba → conclusión. Evita diagnosticar a partir de una sola señal.',
    check: {
      prompt: 'Un ping no responde. ¿Qué puedes concluir con ese único dato?',
      choices: [
        'El cable está roto.',
        'No has recibido respuesta; hace falta investigar.',
        'DNS está siempre mal.',
      ],
      correctIndex: 1,
      explanation:
        'Puede haber varias causas. No atribuyas el fallo a una capa sin pruebas adicionales.',
    },
  },
};
