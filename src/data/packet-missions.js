/** A deliberately bounded example: clear-text HTTP over TCP, IPv4 and wired Ethernet. */
export const packetScenario = {
  title: 'Abre una web desde tu portátil',
  description:
    'Tu portátil pide /aprender a un servidor de otra red. Vas a construir lo que cada función necesita para enviarlo.',
  sourceIP: '192.0.2.10',
  serverIP: '203.0.113.20',
  gatewayIP: '192.0.2.1',
  protocol: 'HTTP · TCP · IPv4 · Ethernet por cable',
  note: 'Direcciones reservadas para documentación. Es una simulación conceptual: no envía tráfico real ni representa todos los campos de una trama.',
};

export const packetMissions = [
  {
    id: 'request',
    layer: 7,
    label: 'La petición',
    verb: 'Crear petición',
    title: 'Primero, di qué quieres pedir.',
    description:
      'Quieres leer /aprender en el servidor web. Añade el mensaje que expresa esa petición.',
    support: 'HTTP es el protocolo de aplicación de este ejemplo. GET sirve para pedir un recurso.',
    hint: 'Busca la pieza que contiene GET y el recurso /aprender. Una dirección por sí sola no expresa lo que quieres pedir.',
    correctId: 'http',
    packetLabel: 'HTTP: GET /aprender',
    explanation:
      'Aplicación define el mensaje del servicio: aquí, pedir un recurso con HTTP. Al recibirlo, el servidor entenderá qué página se ha solicitado.',
    choices: [
      { id: 'http', label: 'GET /aprender', detail: 'Petición HTTP' },
      {
        id: 'ip-only',
        label: '203.0.113.20',
        detail: 'Dirección IP',
        why: 'La IP identifica el destino de red. Todavía necesitas un mensaje que diga qué recurso quieres pedir.',
      },
      {
        id: 'bits-only',
        label: '0101…',
        detail: 'Señales del medio',
        why: 'Los bits se representarán con señales al final. Ahora estás construyendo el significado de la petición.',
      },
      {
        id: 'dns',
        label: 'Consultar un nombre',
        detail: 'Petición DNS',
        hardOnly: true,
        why: 'DNS ayuda a resolver nombres. En esta misión ya conoces la IP del servidor y quieres pedir un recurso con HTTP.',
      },
    ],
  },
  {
    id: 'port',
    layer: 4,
    label: 'El servicio',
    verb: 'Añadir puerto',
    title: 'La IP te lleva al servidor. ¿A qué servicio?',
    description:
      'En esta misión, el servidor escucha HTTP en el puerto TCP habitual. Añade el puerto de destino.',
    support:
      'El puerto de destino identifica el servicio. HTTP suele usar 80; HTTPS suele usar 443.',
    hint: 'Aquí usamos HTTP sin TLS, con su puerto habitual: 80. No estamos abriendo HTTPS.',
    correctId: 'http-port',
    packetLabel: 'TCP → puerto 80',
    explanation:
      'TCP incluye puertos para que el sistema entregue los datos al servicio correcto. En este ejemplo HTTP escucha en 80; un servicio puede configurarse para usar otro puerto.',
    choices: [
      { id: 'http-port', label: '80', detail: 'Puerto de destino HTTP' },
      {
        id: 'https-port',
        label: '443',
        detail: 'Puerto habitual HTTPS',
        why: '443 es el puerto habitual de HTTPS. El escenario usa HTTP en su puerto habitual: 80.',
      },
      {
        id: 'gateway-port',
        label: '192.0.2.1',
        detail: 'IP del router local',
        why: 'Eso es una dirección IP, no un puerto. El puerto responde a qué servicio recibe los datos.',
      },
      {
        id: 'dns-port',
        label: '53',
        detail: 'Puerto habitual DNS',
        hardOnly: true,
        why: '53 se usa habitualmente para DNS. Esta petición es HTTP, y el puerto de destino del ejemplo es 80.',
      },
    ],
  },
  {
    id: 'reliability',
    layer: 4,
    label: 'La entrega',
    verb: 'Activar entrega',
    title: 'Las piezas de la página deben llegar en orden.',
    description: 'Añade la función que aporta TCP cuando hay pérdida o desorden durante el envío.',
    support:
      'TCP ofrece un flujo de bytes fiable y ordenado mediante mecanismos como confirmaciones y retransmisiones.',
    hint: 'Busca confirmaciones y retransmisiones. TCP se ocupa de la entrega del flujo; no cifra el contenido por sí solo.',
    correctId: 'reliable',
    packetLabel: 'TCP: orden y reenvío',
    explanation:
      'TCP reconstruye un flujo de bytes ordenado y retransmite datos cuando es necesario. No promete que una conexión nunca falle y no cifra por sí solo. Aquí HTTP permanece sin cifrar.',
    choices: [
      { id: 'reliable', label: 'Confirmar y retransmitir', detail: 'Flujo fiable y ordenado' },
      {
        id: 'route',
        label: 'Elegir rutas entre redes',
        detail: 'Trabajo de red',
        why: 'El enrutamiento pertenece a la función de red. TCP se ocupa del flujo entre los extremos, con puertos, orden y entrega fiable.',
      },
      {
        id: 'encrypt',
        label: 'Cifrar todo con TCP',
        detail: '¿Entrega = privacidad?',
        why: 'Entrega fiable y privacidad son cosas diferentes. TCP no cifra; HTTPS añade TLS. Este escenario usa HTTP sin TLS.',
      },
      {
        id: 'perfect',
        label: 'Impedir cualquier fallo',
        detail: 'Garantía absoluta',
        hardOnly: true,
        why: 'Una conexión TCP puede fallar si el destino o la red dejan de funcionar. Su fiabilidad no es una garantía de disponibilidad absoluta.',
      },
    ],
  },
  {
    id: 'address',
    layer: 3,
    label: 'El destino',
    verb: 'Añadir destino',
    title: 'Ahora, marca el destino final de red.',
    description:
      'El servidor está en otra red. ¿Qué dirección debe aparecer como IP de destino de este paquete?',
    support:
      'La IP de destino identifica el extremo al que va el paquete. El router local es un paso del camino.',
    hint: 'La IP final es la del servidor: 203.0.113.20. El siguiente salto local se tratará después, en Ethernet.',
    correctId: 'server',
    packetLabel: 'IPv4 → 203.0.113.20',
    explanation:
      'El paquete lleva la IP del servidor como destino. Los routers lo encaminan hacia esa red. En esta simulación omitimos NAT y otros mecanismos para centrarnos en la diferencia entre destino final y siguiente salto.',
    choices: [
      { id: 'server', label: '203.0.113.20', detail: 'Servidor web' },
      {
        id: 'gateway',
        label: '192.0.2.1',
        detail: 'Router local',
        why: 'El router local es el siguiente salto, pero el destino IP de esta petición sigue siendo el servidor 203.0.113.20.',
      },
      {
        id: 'self',
        label: '192.0.2.10',
        detail: 'Tu portátil',
        why: 'Esa es la IP de origen. Estás construyendo una petición que sale del portátil hacia el servidor.',
      },
      {
        id: 'port-as-ip',
        label: '80',
        detail: 'Servicio HTTP',
        hardOnly: true,
        why: '80 es el puerto del servicio. La IP identifica el extremo de red; el puerto identifica el servicio dentro de ese extremo.',
      },
    ],
  },
  {
    id: 'next-hop',
    layer: 2,
    label: 'El salto local',
    verb: 'Cerrar trama',
    title: 'La primera entrega ocurre dentro de tu red local.',
    description:
      'Tu portátil llega al servidor a través del router local. Elige la MAC de destino de la primera trama Ethernet.',
    support:
      'La trama Ethernet llega al siguiente salto del enlace. Para salir a otra red, aquí ese salto es el router local.',
    hint: 'Selecciona la MAC del router local. La IP sigue apuntando al servidor remoto, pero esta trama no cruza Internet entera.',
    correctId: 'router-mac',
    packetLabel: 'Ethernet → MAC del router',
    explanation:
      'El primer enlace entrega la trama al router local, por eso usa su MAC como destino. Un router extrae el paquete y lo prepara para el siguiente enlace. Las direcciones de enlace pueden cambiar en cada salto.',
    choices: [
      { id: 'router-mac', label: 'MAC del router local', detail: 'Siguiente salto' },
      {
        id: 'server-mac',
        label: 'MAC del servidor remoto',
        detail: 'Destino al otro lado de Internet',
        why: 'Una trama Ethernet no viaja intacta a través de todos los routers. En este primer enlace la MAC de destino es la del router local, no la del servidor remoto.',
      },
      {
        id: 'laptop-mac',
        label: 'MAC de tu portátil',
        detail: 'Equipo de origen',
        why: 'La MAC del portátil sirve como origen de esta trama. El destino es el equipo al que se entrega en el primer enlace: el router.',
      },
      {
        id: 'ip-mac',
        label: 'La IP convertida en MAC',
        detail: '¿Misma dirección?',
        hardOnly: true,
        why: 'IP y MAC no son la misma dirección ni se convierten por una fórmula. En IPv4, ARP puede ayudar a conocer la MAC de un vecino del enlace.',
      },
    ],
  },
  {
    id: 'signals',
    layer: 1,
    label: 'El medio',
    verb: 'Transmitir',
    title: 'Convierte el envío en algo que pueda viajar por el cable.',
    description:
      'En esta misión usas Ethernet por un cable de cobre. Elige cómo se representan físicamente los bits.',
    support:
      'El medio elegido es cobre: los bits se codifican en señales eléctricas. En fibra se usan señales ópticas.',
    hint: 'Para el cable de cobre de esta misión, selecciona señales eléctricas. Una URL o una IP no es una señal física.',
    correctId: 'electrical',
    packetLabel: 'Señales eléctricas en cobre',
    explanation:
      'Física representa y transporta bits mediante señales adecuadas al medio. Ethernet también incluye funciones de enlace: una tecnología puede abarcar más de una capa. Ya construiste la trama; ahora la transmites.',
    choices: [
      { id: 'electrical', label: 'Señales eléctricas', detail: 'Ethernet sobre cobre' },
      {
        id: 'optical',
        label: 'Señales ópticas',
        detail: 'Fibra',
        why: 'La fibra usa señales ópticas, pero el medio elegido en esta misión es un cable de cobre.',
      },
      {
        id: 'url',
        label: 'La dirección de la web',
        detail: 'Significado de la petición',
        why: 'La dirección web tiene significado para el servicio. El cable necesita señales que representen los bits.',
      },
      {
        id: 'router-only',
        label: 'Una decisión de ruta',
        detail: 'Elegir una red',
        hardOnly: true,
        why: 'Elegir una ruta ayuda a decidir por dónde enviar el paquete. La transmisión física necesita señales sobre un medio.',
      },
    ],
  },
];
