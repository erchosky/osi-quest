export const networkLesson = {
  introduction:
    'Red permite direccionar y encaminar paquetes entre redes distintas. La idea central es separar el destino final del siguiente salto: conocer dónde quieres llegar no significa tener una ruta disponible ni que su servicio responda.',
  sections: [
    {
      title: 'La dirección y el mapa entre redes',
      paragraphs: [
        'Una red doméstica y la red de un servidor pueden estar separadas por muchos enlaces. IP proporciona direcciones lógicas para los paquetes. Los routers consultan sus rutas y deciden a qué siguiente salto reenviarlos; no necesitan comprender la página, foto o mensaje que contienen.',
        'En la analogía del reparto, Red es la dirección y el mapa que permiten avanzar hacia el destino. Enlace organiza la entrega de cada tramo. Transporte distingue al proceso destinatario final. La dirección de un edificio, el siguiente centro de reparto y el departamento receptor no son intercambiables.',
      ],
    },
    {
      title: 'Decidir si el destino es local',
      paragraphs: [
        'Tu equipo tiene 192.168.1.20/24. En este ejemplo sencillo, /24 señala que los primeros 24 bits identifican la red; 192.168.1.50 pertenece a esa misma subred. Para hablar con él, no necesitas encaminar el paquete por la puerta de enlace por el mero hecho de que sea otro equipo.',
        '203.0.113.40 está fuera de esa subred de ejemplo. El equipo consulta su configuración de rutas y normalmente usa la puerta de enlace para ese destino. El paquete lleva la IP remota, mientras la trama local se entrega al router correspondiente.',
        'El prefijo ayuda a decidir qué direcciones forman la subred. No significa que cualquier equipo de ella esté encendido, tenga permisos o atienda un servicio. Además de pertenecer a una red, la comunicación necesita que las otras funciones colaboren.',
      ],
    },
    {
      title: 'Qué decide cada router',
      paragraphs: [
        'Una tabla de rutas relaciona prefijos de destino con una salida o un siguiente salto. Si varias rutas encajan, se selecciona la más específica entre las aplicables. La ruta por defecto sirve cuando no hay una ruta más específica adecuada.',
        'El router no suele elegir de una vez todos los pasos del viaje: decide el siguiente, y el siguiente router hace su propia decisión. IPv4 usa TTL e IPv6 Hop Limit para limitar la vida del paquete al reenviarlo; no son contadores de puertos TCP ni medidas de velocidad.',
      ],
      items: [
        'Paquete IP: unidad que transporta datos hacia un destino lógico.',
        'Prefijo y ruta: información para decidir dónde y por dónde enviar.',
        'Puerta de enlace: siguiente salto usado para ciertos destinos, no sinónimo de servidor DNS.',
      ],
    },
    {
      title: 'Direcciones, nombres y puertos',
      paragraphs: [
        'DNS es un servicio de Aplicación que puede resolver un nombre a una IP. Que su respuesta contenga una dirección no transforma DNS en el encaminamiento de Red. Del mismo modo, DHCP puede proporcionar configuración IP sin ser el protocolo IP.',
        'La IP tampoco selecciona por sí sola uno de varios servicios TCP del equipo: el puerto de destino ayuda a distinguirlos. NAT puede modificar direcciones, y a menudo también puertos, al atravesar una red. Por eso una dirección no debe tratarse como identidad permanente de una persona.',
      ],
    },
    {
      title: 'Un caso de diagnóstico con límites',
      paragraphs: [
        'Tu portátil alcanza un equipo local, pero no un destino de otra red. Eso permite investigar configuración IP, prefijo, puerta de enlace, rutas y filtrado. No demuestra por sí solo que el router esté averiado: compara más de un destino y conserva qué prueba usaste.',
        'Un ping comprueba un intercambio ICMP si recibe respuesta. No verifica el servicio web. Si no responde, puede existir filtrado o un destino que no conteste; no convierte automáticamente la observación en «cable roto».',
      ],
      items: [
        'Observa dirección y prefijo propios.',
        'Compara destino local y remoto con la misma clase de prueba.',
        'Comprueba nombres y servicios por separado de la conectividad IP.',
      ],
    },
    {
      title: 'Límites y reconstrucción del recorrido',
      paragraphs: [
        'IP no ofrece por sí solo el flujo fiable y ordenado de TCP. Llegar al equipo no equivale a que su servicio esté disponible. En TCP/IP, la capa Internet corresponde aproximadamente a esta responsabilidad de Red.',
        'Sin mirar, explica por qué un equipo puede hablar con su vecino sin una puerta de enlace útil y fallar al salir de la subred. No memorices «router = capa 3» como una etiqueta para toda su caja: un equipo doméstico puede realizar también otros servicios.',
      ],
    },
  ],
  takeaway:
    'Red usa direcciones lógicas y rutas para avanzar entre redes. El siguiente salto no sustituye al destino final del paquete.',
  teachBack:
    'Con 192.168.1.20/24 como dirección propia, explica por qué un vecino 192.168.1.50 y un servidor de otra red requieren decisiones distintas.',
  check: {
    prompt:
      'Un equipo 192.168.8.30/24 habla con 192.168.8.60, pero su puerta de enlace apunta a un equipo que no actúa como router. ¿Por qué puede funcionar la comunicación local y fallar la salida a otra red?',
    choices: [
      'El destino local puede alcanzarse en esa subred; el remoto necesita una ruta y un siguiente salto adecuados.',
      'El destino local usa un puerto TCP que reemplaza la puerta de enlace para el remoto.',
      'El prefijo /24 convierte los destinos remotos en interfaces del mismo enlace local.',
      'La resolución DNS proporciona la entrega entre redes aunque no exista un siguiente salto adecuado.',
    ],
    correctIndex: 0,
    reasons: [
      'La entrega dentro de la subred y el encaminamiento hacia otra red son decisiones diferentes.',
      'Los puertos distinguen procesos de transporte. No crean una ruta ni convierten un equipo en router.',
      'El prefijo delimita la subred. No incorpora todas las direcciones remotas al enlace local.',
      'Resolver un nombre a una IP no aporta una ruta funcional hasta esa IP.',
    ],
    explanation:
      'El resultado local no verifica la puerta de enlace. Para salir hace falta una ruta aplicable y un siguiente salto que pueda reenviar hacia el destino.',
  },
};
