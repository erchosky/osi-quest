import { hardQuestion as q } from './hard-authoring.js';

export const hardProtocolQuestions = [
  q(
    'protocol',
    1,
    1,
    '1000BASE-T especifica una forma de transmitir Ethernet por cobre. ¿Qué parte estás identificando?',
    [
      [
        'Una especificación PHY de señalización física',
        'BASE-T identifica aquí una especificación del medio y su señalización.',
      ],
      [
        'Un protocolo para resolver nombres DNS',
        'Resolver nombres es otro servicio; 1000BASE-T no define consultas DNS.',
      ],
      [
        'La entrega fiable de un flujo TCP',
        'La señalización del medio no es el mecanismo de secuencias y retransmisiones TCP.',
      ],
      [
        'Toda la tecnología Ethernet exclusivamente como capa 1',
        'Ethernet incluye también funciones MAC de enlace; identificar un PHY no reduce toda la tecnología a física.',
      ],
    ],
    'La parte PHY se asocia a física. Ethernet completo reúne funciones físicas y MAC de enlace: clasifica la parte que se nombra.',
    'PHY abrevia Physical Layer.',
    ['ethernet'],
  ),
  q(
    'protocol',
    1,
    2,
    'IEEE 802.11 incluye MAC y PHY. ¿Qué trabajo corresponde a su parte PHY de radio?',
    [
      [
        'Representar bits mediante señales y recibirlas por el medio',
        'Es la función de señalización física.',
      ],
      [
        'Definir la respuesta HTTP de una página',
        'HTTP es un servicio de aplicación distinto de IEEE 802.11 PHY.',
      ],
      [
        'Elegir el destino MAC de una trama a partir de su cabecera',
        'La dirección y el tratamiento MAC pertenecen a la función de enlace.',
      ],
      [
        'Garantizar por sí sola la entrega ordenada de TCP',
        'La señal de radio no realiza las garantías del flujo TCP.',
      ],
    ],
    'Wi-Fi no es solo capa 1. Al separar PHY y MAC puedes relacionar radio con física y tramas con enlace.',
    'Se pregunta por PHY, no por toda la norma.',
    ['wifi'],
  ),
  q(
    'protocol',
    1,
    3,
    '1000BASE-SX y 1000BASE-T son ejemplos de especificaciones físicas Ethernet. ¿Qué tipo de decisión describen?',
    [
      [
        'Cómo enviar señales mediante un medio compatible',
        'La especificación física establece las características pertinentes para transmitir en su medio.',
      ],
      [
        'Qué recurso devuelve una petición HTTP',
        'Una especificación física no define recursos ni respuestas de una web.',
      ],
      [
        'Qué puerto lógico distingue dos procesos',
        'Los puertos TCP o UDP pertenecen a transporte, no a BASE-SX o BASE-T.',
      ],
      [
        'Qué ruta IP elige cada router',
        'Las rutas se calculan en red y no las fija el nombre de un PHY Ethernet.',
      ],
    ],
    'No hace falta memorizar todas las variantes para entender OSI: reconoce que el PHY explica el envío de señales, no el servicio transportado.',
    'Distingue el medio por el que viaja algo del significado de lo que viaja.',
    ['ethernet'],
  ),
  q(
    'protocol',
    2,
    1,
    'Una cabecera MAC de Ethernet lleva direcciones de enlace. ¿Para qué sirve esa función?',
    [
      [
        'Para identificar origen y destino de la trama en ese enlace',
        'Las direcciones MAC se aplican a la entrega de la trama por el enlace pertinente.',
      ],
      [
        'Para conservar la misma dirección local en todos los enlaces de Internet',
        'Al cambiar de enlace, la trama y sus direcciones pertinentes pueden cambiar.',
      ],
      [
        'Para seleccionar directamente el proceso web mediante un puerto TCP',
        'Un puerto lógico identifica el proceso de transporte; no es una MAC.',
      ],
      [
        'Para traducir un nombre de dominio en una respuesta DNS',
        'DNS presta un servicio de nombres distinto de la entrega MAC.',
      ],
    ],
    'La función MAC pertenece a enlace. Un destino IP remoto suele enviarse en la red local mediante la MAC del siguiente salto, no la del servidor remoto.',
    'La trama tiene una entrega local aunque transporte un destino IP lejano.',
    ['ethernet'],
  ),
  q(
    'protocol',
    2,
    2,
    'En IEEE 802.11, la parte MAC coordina el acceso al medio compartido. ¿Cómo la clasificas?',
    [
      [
        'Enlace de datos: organiza el uso del medio para tramas',
        'El control de acceso al medio es una responsabilidad MAC de enlace.',
      ],
      [
        'Física exclusivamente: toda coordinación es una onda',
        'Emitir la señal es físico; las reglas MAC para usar el medio son otra función.',
      ],
      [
        'Sesión OSI: cualquier turno pertenece a capa 5',
        'Un turno para acceder a un canal local es distinto del control del diálogo por encima del transporte.',
      ],
      [
        'Aplicación: porque un usuario está utilizando Wi-Fi',
        'Que el usuario utilice la tecnología no convierte su MAC en un servicio de aplicación.',
      ],
    ],
    'IEEE 802.11 tiene PHY y MAC. Analiza la función concreta para evitar clasificar toda Wi-Fi como una sola capa.',
    'El turno para emitir una trama se organiza en el enlace.',
    ['wifi'],
  ),
  q(
    'protocol',
    2,
    3,
    'En una trama Ethernet, el FCS se utiliza para…',
    [
      [
        'Comprobar posibles daños de la trama recibida',
        'Se compara el resultado para detectar una trama dañada.',
      ],
      [
        'Cifrar automáticamente la carga útil',
        'Un control de errores no proporciona confidencialidad.',
      ],
      [
        'Confirmar que la aplicación final ya leyó el mensaje',
        'Comprobar la trama en un enlace no verifica la lectura de la aplicación.',
      ],
      [
        'Elegir el siguiente salto de una dirección IP',
        'La decisión de ruta IP corresponde a red.',
      ],
    ],
    'Es una función de enlace de datos. Detectar un daño mediante FCS no implica corregirlo ni garantizar entrega de extremo a extremo.',
    'Una comprobación de integridad de trama no es cifrado ni confirmación de aplicación.',
    ['ethernet'],
  ),
  q(
    'protocol',
    3,
    1,
    'IPv6 incluye direcciones de origen y destino. ¿Cuál es su responsabilidad principal aquí?',
    [
      [
        'Direccionamiento y encaminamiento de paquetes entre redes',
        'Son responsabilidades de red.',
      ],
      [
        'Entrega fiable y ordenada de todos los bytes de una aplicación',
        'IP no aporta por sí solo las garantías del flujo TCP.',
      ],
      [
        'Identificar solo el puerto del proceso que recibe datos',
        'Los puertos pertenecen a protocolos de transporte; IPv6 direcciona destinos de red.',
      ],
      [
        'Interpretar el significado de una respuesta HTTP',
        'HTTP define su propio servicio y la semántica de sus respuestas en aplicación.',
      ],
    ],
    'IPv6 se asocia a red. El transporte y la aplicación añaden sus responsabilidades sobre ese servicio.',
    'Distingue llegar a un destino de red de entregar a su proceso.',
    ['ip'],
  ),
  q(
    'protocol',
    3,
    2,
    'ICMPv6 comunica información y errores relacionados con IPv6. ¿Qué clasificación funcional es más adecuada?',
    [
      [
        'Red, como parte de las funciones de control relacionadas con IP',
        'Sus mensajes informan sobre aspectos del funcionamiento de IPv6.',
      ],
      [
        'Transporte, porque contiene la palabra mensaje',
        'Tener mensajes no significa ofrecer el servicio de procesos propio de un transporte.',
      ],
      [
        'Aplicación exclusivamente, porque ping lo puede utilizar',
        'Una herramienta utiliza protocolos; su uso no cambia la responsabilidad del protocolo.',
      ],
      [
        'Física, porque un error siempre significa cable roto',
        'Un error de IP no prueba un fallo físico y el protocolo no representa señales.',
      ],
    ],
    'ICMPv6 acompaña a IPv6 en funciones de red. Las pruebas que lo utilizan no verifican automáticamente servicios como HTTP.',
    'Clasifica el protocolo y su función, no solo la herramienta que lo utiliza.',
    ['icmp'],
  ),
  q(
    'protocol',
    3,
    3,
    'El campo Next Header de IPv6 puede indicar TCP. ¿Qué relación muestra?',
    [
      [
        'Un paquete de red puede llevar la información de un transporte',
        'IPv6 indica el tipo de cabecera que sigue; si es TCP, contiene su segmento.',
      ],
      [
        'IPv6 pasa a ser TCP y desaparece su cabecera de red',
        'El protocolo indicado se transporta dentro; las cabeceras mantienen responsabilidades distintas.',
      ],
      [
        'TCP se convierte en una dirección MAC',
        'El segmento TCP y una dirección de enlace son conceptos distintos.',
      ],
      [
        'Todo paquete IPv6 debe llevar necesariamente TCP',
        'Next Header puede identificar distintas cabeceras, no solo TCP.',
      ],
    ],
    'La encapsulación conserva funciones distintas: IP proporciona red y TCP transporte. Next Header también puede señalar otras cabeceras.',
    'Un contenedor no se transforma en el contenido que lleva.',
    ['ip'],
  ),
  q(
    'protocol',
    4,
    1,
    'TCP ofrece un flujo de bytes fiable y ordenado. ¿Qué función NO añade por sí mismo?',
    [
      [
        'Cifrado del contenido para su confidencialidad',
        'La especificación TCP no incorpora por sí misma cifrado de la carga útil.',
      ],
      [
        'Números de puerto para distinguir servicios y flujos',
        'Los puertos sí forman parte de TCP.',
      ],
      [
        'Mecanismos de retransmisión ante pérdidas',
        'Las retransmisiones sí participan en su fiabilidad.',
      ],
      [
        'Números de secuencia para ordenar el flujo',
        'Las secuencias sí forman parte de la gestión TCP.',
      ],
    ],
    'La opción solicitada es la que TCP no aporta. La fiabilidad del transporte y la confidencialidad son objetivos distintos.',
    'La pregunta pide la función ausente, no una característica correcta.',
    ['tcp'],
  ),
  q(
    'protocol',
    4,
    2,
    'UDP envía datagramas entre procesos. ¿Cuál es la descripción más precisa de sus garantías propias?',
    [
      [
        'No garantiza por sí mismo entrega ni orden',
        'UDP no incorpora las confirmaciones y recuperación de TCP.',
      ],
      [
        'Garantiza entrega ordenada si el destino utiliza un puerto conocido',
        'El número de puerto no añade mecanismos de fiabilidad.',
      ],
      [
        'Impide que una aplicación pueda recuperar datos perdidos',
        'Una aplicación puede implementar su propia recuperación sobre UDP.',
      ],
      [
        'Cifra los datos porque tiene una cabecera más pequeña',
        'El tamaño de la cabecera no proporciona cifrado.',
      ],
    ],
    'UDP es transporte. Su sencillez no obliga a que todas las aplicaciones que lo usan tengan las mismas garantías o resultados.',
    'Separa las garantías del protocolo de las funciones que se pueden añadir encima.',
    ['udp'],
  ),
  q(
    'protocol',
    4,
    3,
    'QUIC viaja en datagramas UDP y ofrece flujos a las aplicaciones. ¿Qué enseña este ejemplo?',
    [
      [
        'Un protocolo de transporte puede añadir funciones usando UDP como vehículo',
        'QUIC aporta su propio servicio de transporte sobre datagramas UDP.',
      ],
      [
        'UDP adquiere automáticamente todas las funciones de QUIC para cualquier aplicación',
        'Las funciones añadidas por QUIC no pasan a ser garantías universales de UDP.',
      ],
      [
        'Todo lo que viaja sobre UDP solo puede ser DNS',
        'Muchas aplicaciones y protocolos distintos pueden utilizar UDP.',
      ],
      [
        'QUIC elimina la necesidad de IP para llegar entre redes',
        'Los datagramas todavía necesitan el servicio de red pertinente.',
      ],
    ],
    'Los protocolos reales pueden superponer servicios sin seguir una correspondencia rígida de uno por capa. QUIC es un transporte con mecanismos propios y utiliza UDP.',
    'Un vehículo puede transportar otro protocolo con responsabilidades propias.',
    ['quic', 'udp'],
  ),
  q(
    'protocol',
    5,
    1,
    'X.225 es el protocolo de sesión orientado a conexión de OSI. ¿Qué lo distingue de un formulario de acceso web?',
    [
      [
        'Coordina el servicio de sesión, no define por su nombre la autenticación de cuentas',
        'Es un protocolo OSI del servicio de sesión; un formulario de acceso realiza una operación de aplicación.',
      ],
      [
        'Toda contraseña de una web es obligatoriamente un mensaje X.225',
        'Las aplicaciones web no usan X.225 por el mero hecho de autenticar a una persona.',
      ],
      [
        'Solo transmite señales sobre un cable',
        'Señalizar bits corresponde a física, no a la coordinación de sesión.',
      ],
      [
        'Sustituye la ruta IP de cualquier paquete',
        'Coordinar un diálogo no determina el siguiente salto de red.',
      ],
    ],
    'X.225 es un ejemplo explícito de protocolo OSI de sesión. Conocer su función basta aquí; no necesitas memorizar su código para diagnosticar una red doméstica.',
    'El nombre cotidiano «iniciar sesión» no obliga a usar este protocolo.',
    ['session'],
  ),
  q(
    'protocol',
    5,
    2,
    'X.225 contempla sincronización y resincronización. ¿Qué función OSI ilustra?',
    [
      [
        'Coordinar puntos del diálogo que permitan retomarlo',
        'La sincronización de sesión organiza la continuidad del diálogo.',
      ],
      [
        'Convertir cada carácter a una señal de radio',
        'Eso mezcla representación y transmisión física; no es resincronización del diálogo.',
      ],
      [
        'Resolver nombres mediante DNS',
        'El servicio DNS tiene otra responsabilidad de aplicación.',
      ],
      [
        'Usar una MAC como destino de extremo a extremo por Internet',
        'Las MAC sirven a enlaces pertinentes y no son el punto de sincronización de sesión.',
      ],
    ],
    'Esta sincronización conceptual de capa 5 es distinta de la secuencia de bytes que controla TCP en capa 4.',
    'Piensa en un punto de una conversación acordado entre participantes.',
    ['session'],
  ),
  q(
    'protocol',
    5,
    3,
    '¿Qué asociación describe correctamente X.225 frente a TCP?',
    [
      [
        'X.225 describe un protocolo OSI de sesión; TCP ofrece transporte',
        'Ambos pueden gestionar estado, pero ofrecen responsabilidades distintas.',
      ],
      [
        'TCP pertenece a capa 5 siempre que alguien diga «sesión TCP»',
        'La expresión informal no cambia la clasificación de TCP como transporte.',
      ],
      [
        'X.225 y TCP son dos nombres del mismo protocolo',
        'Son especificaciones diferentes con servicios diferentes.',
      ],
      [
        'X.225 cifra por definición cualquier página HTTP',
        'La denominación sesión no aporta por sí sola esa protección a HTTP.',
      ],
    ],
    'El uso de estado o de la palabra conexión no basta para asignar una capa. Compara el servicio que define cada protocolo.',
    'Clasifica por responsabilidad y no por una palabra común.',
    ['session', 'tcp'],
  ),
  q(
    'protocol',
    6,
    1,
    'X.226 define el protocolo de presentación orientado a conexión de OSI. ¿Qué función representa?',
    [
      [
        'Negociar y usar representaciones compartidas de los datos',
        'Presentación relaciona sintaxis y representación para que los extremos interpreten los datos.',
      ],
      [
        'Dibujar obligatoriamente los botones del navegador',
        'Presentación OSI no es la presentación visual de una interfaz.',
      ],
      ['Elegir rutas entre redes usando direcciones IP', 'El encaminamiento pertenece a red.'],
      [
        'Convertir cualquier contraseña en una sesión TCP',
        'La representación de datos no cambia el significado de la autenticación ni el protocolo de transporte.',
      ],
    ],
    'Es un ejemplo explícito de protocolo OSI de capa 6. Internet puede integrar funciones parecidas en la aplicación sin utilizar X.226.',
    'Representación de datos y aspecto de la pantalla son conceptos diferentes.',
    ['presentation'],
  ),
  q(
    'protocol',
    6,
    2,
    'X.226 maneja contextos de presentación y sintaxis. ¿Qué problema ayuda a modelar?',
    [
      [
        'Que los extremos acuerden cómo representar e interpretar los datos',
        'El contexto vincula la sintaxis con la representación utilizada para intercambiarlos.',
      ],
      [
        'Que siempre exista una ruta IP hacia el servidor',
        'Acordar una representación no crea conectividad de red.',
      ],
      [
        'Que TCP garantice cifrado por cualquier número de puerto',
        'Los puertos y la fiabilidad de TCP no aportan ese cifrado.',
      ],
      [
        'Que una trama Ethernet mantenga la misma MAC en cada salto',
        'La representación de aplicación no cambia la naturaleza local de las tramas.',
      ],
    ],
    'El ejemplo trata el formato compartido, no la entrega por un enlace ni la ruta. El encaje real de protocolos TCP/IP sigue siendo aproximado.',
    'Llegar al destino e interpretar los datos son problemas distintos.',
    ['presentation'],
  ),
  q(
    'protocol',
    6,
    3,
    'TLS protege comunicaciones y negocia parámetros de seguridad. ¿Cómo relacionarlo con presentación sin enseñar una regla falsa?',
    [
      [
        'Asociar conceptualmente el cifrado a presentación y aclarar que TLS completo no encaja en una sola capa',
        'Se relaciona una función con el modelo, sin reducir el protocolo real a una equivalencia absoluta.',
      ],
      [
        'Afirmar que TLS y toda la capa 6 son exactamente lo mismo',
        'TLS no equivale a todas las posibles funciones de presentación en todos los sistemas.',
      ],
      [
        'Afirmar que TLS es TCP porque su nombre contiene Transport',
        'TLS y TCP tienen especificaciones y responsabilidades diferentes.',
      ],
      [
        'Afirmar que TLS hace innecesarias las señales físicas',
        'La protección de datos todavía necesita una comunicación que los transporte.',
      ],
    ],
    'OSI es un modelo conceptual. TLS es un protocolo real con funciones de negociación y protección: esa diferencia explica por qué los mapas son aproximados.',
    'No clasifiques un protocolo entero únicamente por una función o su nombre.',
    ['tls'],
  ),
  q(
    'protocol',
    7,
    1,
    'DNS puede usar UDP o TCP. ¿Qué función permanece igual aunque cambie el transporte?',
    [
      [
        'El servicio de información asociada a nombres',
        'DNS sigue prestando su servicio de aplicación.',
      ],
      [
        'El encaminamiento IP como responsabilidad de DNS',
        'DNS puede devolver una IP, pero no es quien decide los saltos de cada paquete.',
      ],
      [
        'La señalización de radio como función del nombre consultado',
        'Los mensajes DNS pueden viajar por distintos medios sin ser un PHY.',
      ],
      [
        'La garantía de que la web pedida existirá y funcionará',
        'Una respuesta DNS no garantiza el estado del servicio web.',
      ],
    ],
    'DNS es aplicación. UDP o TCP llevan sus mensajes y conservan sus funciones de transporte.',
    'Clasifica el servicio que consulta el nombre.',
    ['dns'],
  ),
  q(
    'protocol',
    7,
    2,
    'HTTP define peticiones y respuestas de recursos. ¿Qué expresa una respuesta 404?',
    [
      [
        'Que ese participante HTTP no ofrece o no revela el recurso solicitado',
        '404 es una respuesta de aplicación sobre el recurso; puede ocultar su existencia.',
      ],
      [
        'Que no llegó absolutamente ningún dato desde ningún participante',
        'Una respuesta 404 es información HTTP recibida.',
      ],
      [
        'Que la capa física deja de existir al solicitar ese recurso',
        'Un código de aplicación no elimina la función física.',
      ],
      [
        'Que TCP cifró automáticamente el nombre del recurso',
        'TCP no cifra por sí mismo y 404 no informa de eso.',
      ],
    ],
    '404 no localiza una avería del cable ni garantiza que toda la infraestructura esté bien. Describe lo que respondió el participante HTTP al recurso solicitado.',
    'Un error de servicio sigue siendo una respuesta.',
    ['http'],
  ),
  q(
    'protocol',
    7,
    3,
    'DHCP utiliza UDP y puede entregar dirección IP, máscara y puerta de enlace. ¿Qué capa describe su servicio?',
    [
      [
        'Aplicación: servicio de configuración para el cliente',
        'DHCP ofrece una operación de configuración mediante mensajes de aplicación.',
      ],
      [
        'Transporte: porque utiliza UDP como vehículo',
        'UDP transporta DHCP; el protocolo transportado no adquiere esa clasificación por usarlo.',
      ],
      [
        'Red: porque entrega información utilizada por IP',
        'Configurar direcciones no es la función de encaminar los paquetes IP.',
      ],
      [
        'Enlace: porque el cliente comienza en una red local',
        'El ámbito local del intercambio no determina por sí solo la capa del servicio.',
      ],
    ],
    'El protocolo de aplicación puede configurar otras funciones. Separar el servicio, su transporte y los datos entregados evita esta trampa habitual.',
    '¿Qué ofrece DHCP al cliente, y quién lleva sus mensajes?',
    ['dhcp'],
  ),
];
