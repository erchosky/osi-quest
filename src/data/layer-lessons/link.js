export const linkLesson = {
  introduction:
    'Enlace organiza la entrega de información dentro de un enlace. Aquí aprenderás por qué una trama usa MAC, qué decide un switch y por qué esa entrega local no es lo mismo que llegar al proceso destinatario final.',
  sections: [
    {
      title: 'Un tramo del recorrido, no el viaje completo',
      paragraphs: [
        'Física permite reconocer señales. Enlace necesita delimitar y organizar información para una entrega local: una trama. En Ethernet esa envoltura incluye direcciones MAC y un control de errores. El paquete IP que contiene puede tener como destino una red muy lejana.',
        'La analogía es un reparto hasta el siguiente punto del recorrido, tramo a tramo. Puede ser un centro de reparto intermedio, no el departamento que recibirá el envío al final. Ese departamento recuerda a los puertos de Transporte; la dirección y las rutas entre redes recuerdan a Red.',
      ],
    },
    {
      title: 'Tu portátil visita un servidor remoto',
      paragraphs: [
        'Supón que tu portátil tiene la IP 192.168.1.20/24, el router local 192.168.1.1 y quiere contactar con 203.0.113.40, una dirección de ejemplo reservada para documentación. La configuración indica que el servidor está fuera de la red local, así que el portátil usa la puerta de enlace.',
        'El paquete IPv4 lleva la IP del servidor como destino. La trama del primer enlace Ethernet se dirige a la MAC del router. No se necesita poner la MAC del servidor remoto en esa primera trama. En IPv4, ARP puede obtener la MAC del siguiente salto local.',
        'El router recibe la trama, procesa el paquete y prepara la envoltura adecuada para el siguiente enlace. La trama inicial no atraviesa intacta todos los routers. La dirección IP guía el destino entre redes y la envoltura de Enlace se adapta a cada tramo.',
      ],
    },
    {
      title: 'Lo que hace un switch de capa 2',
      paragraphs: [
        'Un switch aprende dónde aparecen las MAC de origen y consulta su tabla para reenviar tramas según la MAC de destino. Si conoce el puerto adecuado, puede limitar el envío a él; una MAC de destino desconocida puede provocar difusión por otros puertos del mismo dominio de enlace.',
        'Esto no equivale a calcular una ruta hacia una IP remota. Algunos equipos incorporan funciones adicionales, pero «switch de capa 2» describe aquí la conmutación basada en MAC. Clasifica la función concreta que observas.',
      ],
      items: [
        'Trama: unidad que organiza la entrega de ese enlace.',
        'MAC: dirección de una interfaz del enlace; no identifica un proceso de aplicación.',
        'FCS de Ethernet: detecta errores en la trama; detectar no significa reparar automáticamente los datos.',
      ],
    },
    {
      title: 'Tres preguntas que no debes mezclar',
      paragraphs: [
        'Enlace pregunta a qué interfaz entregar en este tramo. Red pregunta hacia qué destino lógico encaminar entre redes. Transporte distingue comunicaciones entre procesos en los extremos mediante puertos y otros datos.',
        'Un puerto físico del switch es un conector o una interfaz del equipo. Un puerto TCP o UDP es un número lógico. Compartir la palabra «puerto» no convierte ambas decisiones en el mismo trabajo.',
      ],
    },
    {
      title: 'Qué observaciones ayudan a investigar',
      items: [
        'Comprueba primero que el enlace físico existe. Sin señal, una tabla MAC no arregla la conexión.',
        'Si puedes observar el switch, compara la interfaz esperada con su tabla MAC y los contadores de errores.',
        'Distingue si falla la entrega local o solo el acceso a otra red. Una comunicación local correcta no verifica la ruta remota.',
      ],
      paragraphs: [
        'Los errores de trama pueden tener origen en el medio físico. El contador describe qué se observó, no una causa única. Tampoco la existencia de una MAC en una tabla demuestra que DNS o la web funcionen.',
      ],
    },
    {
      title: 'Límites y recuerdo activo',
      paragraphs: [
        'Wi-Fi también organiza tramas y acceso al medio, además de transmitir por radio. Una MAC puede cambiar por configuración o privacidad: no es una identidad permanente de una persona. En TCP/IP, estas funciones suelen agruparse con el medio como acceso a la red.',
        'Dibuja dos enlaces separados por un router. Marca la IP del destino remoto en el paquete y la MAC del siguiente salto en la primera trama. Explica qué envoltura se prepara de nuevo al pasar al otro enlace.',
      ],
    },
  ],
  takeaway:
    'Enlace entrega tramas en el tramo local. La MAC del siguiente salto y la IP del destino remoto contestan preguntas distintas.',
  teachBack:
    'Explica a quién va dirigida la primera trama cuando visitas una web fuera de tu red y qué cambia al cruzar un router.',
  check: {
    prompt:
      'Un portátil envía un paquete a un servidor fuera de su red a través del router local. En el primer enlace Ethernet, ¿qué combinación de destinos corresponde?',
    choices: [
      'MAC del servidor remoto en la trama; IP del router en el paquete.',
      'MAC del portátil en la trama; IP del servidor remoto en el paquete.',
      'MAC del router local en la trama; IP del servidor remoto en el paquete.',
      'MAC del router local en la trama; IP del router local en el paquete.',
    ],
    correctIndex: 2,
    reasons: [
      'La primera trama entrega al router local, no directamente a la interfaz remota. El destino del paquete sigue siendo el servidor.',
      'La MAC del portátil es la de origen en esta trama. El destinatario del primer tramo es el router local.',
      'La trama resuelve el tramo hasta la puerta de enlace y el paquete conserva el destino lógico remoto.',
      'Dirigir el paquete al router sería pedir algo al propio router. Aquí es el siguiente salto para alcanzar al servidor.',
    ],
    explanation:
      'La envoltura de Enlace lleva el paquete al siguiente salto local. La capa de Red proporciona el destino entre redes; no sustituyas la IP del servidor por la de la puerta de enlace.',
  },
};
