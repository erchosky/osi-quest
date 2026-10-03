/** Concrete functions, with alternative situations for every layer and difficulty. */
export const matchingTasks = [
  {
    id: 'normal-physical-cable',
    difficulty: 'normal',
    layer: 1,
    title: 'El mensaje viaja por el cable',
    prompt: 'Convertir los bits en señales eléctricas que recorren un cable.',
    hint: 'Piensa en el medio que transporta la señal: cable, luz u ondas.',
    explanation:
      'Física transmite señales. Como la carretera por la que circula un reparto, aporta el medio para que la información pueda moverse.',
  },
  {
    id: 'normal-physical-light',
    difficulty: 'normal',
    layer: 1,
    title: 'Un destello cuenta como un bit',
    prompt: 'Enviar pulsos de luz por una fibra óptica para representar información.',
    hint: 'Aquí todavía hablamos de señales, antes de leer direcciones.',
    explanation:
      'Física representa bits como señales. La fibra usa luz; otros medios usan electricidad u ondas de radio.',
  },
  {
    id: 'normal-link-mac',
    difficulty: 'normal',
    layer: 2,
    title: 'Una entrega dentro de la red local',
    prompt: 'Usar direcciones MAC para entregar una trama al siguiente equipo de la misma red.',
    hint: 'Trama y MAC son dos pistas de la entrega local.',
    explanation:
      'Enlace organiza la entrega en el enlace local. Es como localizar el buzón concreto dentro del edificio.',
  },
  {
    id: 'normal-link-switch',
    difficulty: 'normal',
    layer: 2,
    title: 'El switch elige una puerta',
    prompt: 'Un switch Ethernet consulta una dirección MAC para elegir el puerto de salida.',
    hint: 'Este equipo mueve tramas en la red local, no calcula rutas IP.',
    explanation:
      'Enlace trabaja con tramas y direcciones MAC. Un switch Ethernet habitual utiliza la MAC de destino para decidir por dónde reenviar.',
  },
  {
    id: 'normal-network-route',
    difficulty: 'normal',
    layer: 3,
    title: 'De una red a otra',
    prompt: 'Elegir por dónde debe avanzar un paquete usando su dirección IP de destino.',
    hint: 'Piensa en las rutas entre redes, como el mapa entre ciudades.',
    explanation:
      'Red permite que un paquete cruce redes distintas. La IP identifica el destino y los routers eligen el siguiente salto.',
  },
  {
    id: 'normal-network-router',
    difficulty: 'normal',
    layer: 3,
    title: 'El router consulta su mapa',
    prompt: 'Consultar una tabla de rutas para enviar un paquete hacia otra red.',
    hint: 'Ruta, paquete e IP describen el viaje entre redes.',
    explanation:
      'Red se encarga del direccionamiento lógico y el enrutamiento. Cada router decide un siguiente salto, no necesariamente el recorrido completo.',
  },
  {
    id: 'normal-transport-tcp',
    difficulty: 'normal',
    layer: 4,
    title: 'Falta una parte del mensaje',
    prompt: 'TCP detecta datos sin confirmar y los vuelve a enviar entre los extremos.',
    hint: 'TCP y UDP viven aquí; los puertos distinguen las aplicaciones.',
    explanation:
      'Transporte lleva datos entre aplicaciones de los extremos. TCP ofrece entrega fiable y ordenada; eso no significa que los datos estén cifrados.',
  },
  {
    id: 'normal-transport-port',
    difficulty: 'normal',
    layer: 4,
    title: 'Cada conversación llega a su aplicación',
    prompt: 'Usar un puerto TCP o UDP para distinguir el servicio que recibirá los datos.',
    hint: 'La IP localiza el equipo; el puerto ayuda a localizar el servicio.',
    explanation:
      'Transporte utiliza puertos para distinguir comunicaciones. Es como indicar la extensión después de llamar a la centralita de un edificio.',
  },
  {
    id: 'normal-session-dialog',
    difficulty: 'normal',
    layer: 5,
    title: 'Mantener una conversación organizada',
    prompt: 'En el modelo OSI, coordinar el inicio, mantenimiento y cierre de un diálogo.',
    hint: 'Piensa en quién organiza la conversación lógica, no en quién envía paquetes.',
    explanation:
      'Sesión organiza el diálogo entre aplicaciones en el modelo OSI. En Internet estas funciones suelen estar integradas en las aplicaciones.',
  },
  {
    id: 'normal-session-checkpoint',
    difficulty: 'normal',
    layer: 5,
    title: 'Continuar el diálogo desde una marca',
    prompt: 'En el modelo OSI, establecer puntos de sincronización de una conversación.',
    hint: 'Una marca de la conversación no es una confirmación de un segmento TCP.',
    explanation:
      'Sesión contempla sincronización y control del diálogo. La analogía es guardar el punto de una conversación larga para poder retomarla.',
  },
  {
    id: 'normal-presentation-format',
    difficulty: 'normal',
    layer: 6,
    title: 'Hablar el mismo idioma de datos',
    prompt: 'Acordar cómo representar un texto para que ambos lados interpreten los caracteres.',
    hint: 'No cambia la ruta: cambia la representación de la información.',
    explanation:
      'Presentación trata la representación de los datos. Como acordar un idioma, permite interpretar correctamente lo que se recibe.',
  },
  {
    id: 'normal-presentation-compress',
    difficulty: 'normal',
    layer: 6,
    title: 'La misma información en menos espacio',
    prompt:
      'Transformar la representación de los datos mediante compresión, como función del modelo OSI.',
    hint: 'La tarea transforma los datos; no elige por dónde se envían.',
    explanation:
      'Presentación incluye funciones de transformación de la representación, como compresión. Las implementaciones reales pueden repartirlas de otra manera.',
  },
  {
    id: 'normal-application-http',
    difficulty: 'normal',
    layer: 7,
    title: 'Pedir una página',
    prompt: 'HTTP expresa una petición para obtener un recurso web.',
    hint: 'Es el servicio de red que entiende la petición del usuario.',
    explanation:
      'Aplicación define servicios y mensajes de alto nivel. HTTP permite pedir recursos; el navegador es el programa que usa ese protocolo.',
  },
  {
    id: 'normal-application-dns',
    difficulty: 'normal',
    layer: 7,
    title: 'Buscar la dirección de un nombre',
    prompt: 'DNS consulta qué dirección corresponde a un nombre de dominio.',
    hint: 'Aquí se interpreta una consulta, no se calcula una ruta.',
    explanation:
      'Aplicación incluye DNS, el servicio que resuelve nombres. Su trabajo se parece a consultar una agenda para encontrar una dirección.',
  },
  {
    id: 'hard-physical-wifi',
    difficulty: 'hard',
    layer: 1,
    title: 'Wi-Fi, pero fíjate en la acción',
    prompt:
      'Una antena representa bits modulando una onda de radio. La tarea descrita es únicamente generar la señal.',
    hint: 'Wi-Fi abarca varias funciones. Aquí se ha aislado el transporte físico de la señal.',
    explanation:
      'La modulación de la señal es Física. Wi-Fi también tiene funciones de Enlace, pero la acción descrita no trata tramas ni direcciones MAC.',
  },
  {
    id: 'hard-physical-fiber',
    difficulty: 'hard',
    layer: 1,
    title: 'Hay una IP dentro, pero todavía es luz',
    prompt:
      'Una fibra lleva pulsos luminosos que representan bits de un paquete IP. Clasifica la generación de esos pulsos.',
    hint: 'Clasifica lo que se hace, no el tipo de información que acaba viajando.',
    explanation:
      'Generar pulsos luminosos es Física. Que la carga contenga IP no convierte la transmisión de la señal en una función de Red.',
  },
  {
    id: 'hard-link-ip-payload',
    difficulty: 'hard',
    layer: 2,
    title: 'El paquete IP va dentro de una trama',
    prompt:
      'Un switch Ethernet reenvía una trama usando su MAC de destino, aunque la carga contiene un paquete IP.',
    hint: '¿Qué dirección está consultando realmente el switch para decidir?',
    explanation:
      'La decisión por MAC pertenece a Enlace. El paquete IP es la carga de la trama; esta decisión no consulta su ruta IP.',
  },
  {
    id: 'hard-link-error',
    difficulty: 'hard',
    layer: 2,
    title: 'Se detectó una trama dañada',
    prompt:
      'El receptor Ethernet comprueba el FCS de una trama y la descarta porque la comprobación falla.',
    hint: 'Se comprueba una trama de un enlace, no la entrega completa entre aplicaciones.',
    explanation:
      'La comprobación FCS de la trama corresponde a Enlace. Detectar un error local no implica que Ethernet garantice retransmisión fiable de extremo a extremo.',
  },
  {
    id: 'hard-network-tcp-payload',
    difficulty: 'hard',
    layer: 3,
    title: 'TCP está dentro, pero manda la ruta',
    prompt:
      'Un router consulta la IP de destino para elegir el siguiente salto de un paquete que transporta TCP.',
    hint: 'La carga puede ser TCP. Clasifica la elección del siguiente salto mediante IP.',
    explanation:
      'Elegir el siguiente salto mediante la IP es Red. Transportar TCP como carga no cambia la función que realiza esa decisión.',
  },
  {
    id: 'hard-network-hop',
    difficulty: 'hard',
    layer: 3,
    title: 'El destino sigue lejos',
    prompt:
      'En el camino, un router reduce el TTL de un paquete IPv4 y decide reenviarlo según su tabla de rutas.',
    hint: 'Se está gestionando el recorrido de un paquete entre redes.',
    explanation:
      'TTL y enrutamiento de IPv4 son funciones de Red. La MAC del siguiente salto puede cambiar, pero la decisión descrita usa IP.',
  },
  {
    id: 'hard-transport-not-encryption',
    difficulty: 'hard',
    layer: 4,
    title: 'Fiable no significa secreto',
    prompt:
      'TCP pone los bytes en orden y retransmite pérdidas. Clasifica esta fiabilidad, aunque la conexión no use cifrado.',
    hint: 'No confundas entrega fiable con protección del contenido.',
    explanation:
      'La fiabilidad y el orden de TCP corresponden a Transporte. TCP por sí mismo no cifra los datos ni garantiza que una persona ajena no pueda leerlos.',
  },
  {
    id: 'hard-transport-dns-payload',
    difficulty: 'hard',
    layer: 4,
    title: 'No clasifiques la consulta DNS',
    prompt:
      'UDP usa el puerto de destino para entregar a un servicio una consulta DNS. Clasifica el uso del puerto, no DNS.',
    hint: 'Se ha aislado la función de distinguir servicios mediante puertos.',
    explanation:
      'El uso de puertos UDP es Transporte. Interpretar la consulta DNS sería Aplicación; son acciones diferentes en el mismo intercambio.',
  },
  {
    id: 'hard-session-not-ack',
    difficulty: 'hard',
    layer: 5,
    title: 'Una marca del diálogo',
    prompt:
      'En el modelo OSI, se fija un punto de sincronización del diálogo para retomarlo. No se confirma un segmento TCP.',
    hint: 'Distingue el control de una conversación lógica de la entrega fiable de bytes.',
    explanation:
      'Los puntos de sincronización del diálogo son una función de Sesión en OSI. Las confirmaciones de TCP pertenecen a Transporte.',
  },
  {
    id: 'hard-session-not-login',
    difficulty: 'hard',
    layer: 5,
    title: 'Sesión no equivale a iniciar sesión',
    prompt:
      'En OSI, controlar turnos y mantener el diálogo entre dos aplicaciones. No se está validando una contraseña.',
    hint: 'Busca la función del modelo, sin asociar automáticamente la palabra a una cuenta de usuario.',
    explanation:
      'El control del diálogo es una función de Sesión. La autenticación de una cuenta no se clasifica automáticamente aquí por llamarse “iniciar sesión”.',
  },
  {
    id: 'hard-presentation-characters',
    difficulty: 'hard',
    layer: 6,
    title: 'Llega todo, pero el texto se interpreta mal',
    prompt:
      'En el modelo OSI, transformar una representación de caracteres en otra para que ambos extremos interpreten el texto.',
    hint: 'La entrega ya funciona. La tarea cambia cómo se representan los datos.',
    explanation:
      'La representación y conversión de datos corresponde a Presentación en el modelo OSI. No se está reparando una ruta ni retransmitiendo bytes.',
  },
  {
    id: 'hard-presentation-representation',
    difficulty: 'hard',
    layer: 6,
    title: 'No basta con recibir los mismos bytes',
    prompt:
      'Dos sistemas acuerdan cómo representar los valores de sus datos. Clasifica esta función abstracta de OSI, no una implementación concreta.',
    hint: 'Un valor necesita una representación que los dos lados entiendan.',
    explanation:
      'Acordar la representación de los datos es Presentación. OSI describe funciones; los protocolos de Internet no siempre separan cada una en una capa propia.',
  },
  {
    id: 'hard-application-over-udp',
    difficulty: 'hard',
    layer: 7,
    title: 'Viaja por UDP, pero ¿qué se interpreta?',
    prompt:
      'Un servidor lee una consulta DNS y responde a una pregunta sobre un dominio. Clasifica DNS, aunque el mensaje llegue por UDP.',
    hint: 'Un protocolo no hereda la capa del protocolo que lo transporta.',
    explanation:
      'Interpretar y responder consultas DNS es Aplicación. UDP presta el transporte, pero no entiende el significado del nombre consultado.',
  },
  {
    id: 'hard-application-http-response',
    difficulty: 'hard',
    layer: 7,
    title: 'La conexión funciona; el recurso no existe',
    prompt:
      'Un servidor HTTP interpreta la ruta solicitada y devuelve una respuesta 404. Clasifica esa respuesta del servicio.',
    hint: 'La entrega de datos puede funcionar y el servicio responder con un error propio.',
    explanation:
      'HTTP y sus respuestas pertenecen a Aplicación. Un 404 indica que el recurso no se encuentra; por sí solo no demuestra un fallo del cable o de TCP.',
  },
];
