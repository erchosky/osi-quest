import { hardQuestion as q } from './hard-authoring.js';

export const hardScenarioQuestions = [
  q(
    'scenario',
    1,
    1,
    'Tu portátil por Wi-Fi tiene una señal muy débil y mejora al acercarlo al punto de acceso. ¿Qué observación orientarías primero?',
    [
      [
        'La propagación y calidad de la señal de radio',
        'La variación con la distancia es una pista del medio físico; después pueden comprobarse interferencias y otras causas.',
      ],
      [
        'La traducción del nombre DNS de una única web',
        'DNS no explica por sí mismo que la señal recibida mejore al acercarte.',
      ],
      [
        'La contraseña de tu cuenta del servicio web',
        'La autenticación de la web no determina la calidad de la señal Wi-Fi.',
      ],
      [
        'El formato de las fotos que envías',
        'La representación de la foto no cambia la potencia de radio recibida.',
      ],
    ],
    'La pista apunta a física: señal y medio. No basta para demostrar una avería concreta y Wi-Fi también tiene funciones de enlace.',
    'Relaciona la prueba de acercarte con la señal medida.',
    ['wifi'],
  ),
  q(
    'scenario',
    1,
    2,
    'Un enlace de fibra deja de recibir luz y la interfaz informa pérdida de señal. ¿Cuál es el primer ámbito de comprobación?',
    [
      [
        'Fibra, conectores y emisor o receptor óptico',
        'Esos elementos permiten que la señal llegue al receptor.',
      ],
      [
        'La tabla de rutas IP del servidor web',
        'Las rutas no restauran una señal óptica ausente en ese enlace.',
      ],
      [
        'El puerto TCP que utiliza el navegador',
        'El puerto lógico no produce la luz del medio físico.',
      ],
      [
        'La codificación del texto de la página',
        'La codificación se interpreta después de recibir datos; no arregla la señal ausente.',
      ],
    ],
    'Hay evidencia concreta de pérdida de señal física. Se revisa ese enlace sin asumir que toda la red solo utiliza capa 1.',
    'La interfaz ha medido la señal del medio.',
    ['ethernet'],
  ),
  q(
    'scenario',
    1,
    3,
    'Ping falla, pero todavía no has observado el enlace. ¿Qué dato daría evidencia física más directa?',
    [
      [
        'El estado del enlace y una comprobación del cable o señal',
        'Observa directamente elementos del medio físico en vez de inferirlos de ping.',
      ],
      [
        'La ausencia de una respuesta ICMP por sí sola',
        'ICMP puede filtrarse o perderse por varias causas; no demuestra un cable roto.',
      ],
      [
        'Un HTTP 404 de otra web',
        'Es una respuesta del servicio de aplicación, no una medición del cable investigado.',
      ],
      [
        'El nombre de usuario usado para acceder a la web',
        'Las credenciales no indican si el enlace recibe una señal.',
      ],
    ],
    'Un diagnóstico debe separar evidencia e hipótesis. Ping es útil, pero su silencio no localiza de forma única un fallo físico.',
    'Busca una medida del enlace, no la ausencia de otra prueba.',
  ),
  q(
    'scenario',
    2,
    1,
    'Un switch de capa 2 aprende que una MAC está en el puerto 3 y reenvía allí una trama. ¿Qué explica la decisión?',
    [
      ['Su tabla de conmutación del enlace', 'Relaciona MAC y puertos para la entrega de tramas.'],
      [
        'Una consulta DNS del nombre del destinatario',
        'Un switch de capa 2 no necesita resolver nombres para esa decisión.',
      ],
      [
        'La secuencia de bytes de una conexión TCP',
        'La conmutación descrita se basa en MAC, no en secuencias TCP.',
      ],
      [
        'La sintaxis de la página web transportada',
        'El formato de la página no determina la tabla MAC.',
      ],
    ],
    'La decisión pertenece a enlace. Un equipo con capacidades adicionales podría también encaminar, pero aquí se describe conmutación MAC.',
    'Clasifica la decisión concreta que has observado.',
    ['ethernet'],
  ),
  q(
    'scenario',
    2,
    2,
    'Un receptor Ethernet descarta una trama cuyo FCS no coincide. ¿Qué interpretación es correcta?',
    [
      [
        'Ha detectado un daño en la trama, sin repararla necesariamente',
        'El FCS permite detectar errores; descartar no reconstruye los datos.',
      ],
      [
        'Ha corregido automáticamente todos los bits dañados',
        'Detección y corrección son distintas; el descarte no garantiza reparación.',
      ],
      [
        'Ha demostrado que el servidor DNS no funciona',
        'Un daño de trama no localiza el fallo del servicio DNS.',
      ],
      [
        'Ha confirmado que el mensaje llegó al proceso destino',
        'Una trama descartada no confirma una entrega de transporte.',
      ],
    ],
    'Es una comprobación de enlace. Si se necesita recuperar información, deberá intervenir el mecanismo pertinente del protocolo utilizado.',
    'Detectar, corregir y retransmitir son acciones distintas.',
    ['ethernet'],
  ),
  q(
    'scenario',
    2,
    3,
    'Un router recibe un paquete en Ethernet y lo envía por otro enlace Ethernet. Sin NAT, ¿qué envoltura reconstruye para el nuevo tramo?',
    [
      [
        'La trama, con las MAC pertinentes del nuevo enlace',
        'La entrega de enlace se prepara para los nodos del siguiente tramo.',
      ],
      [
        'El contenido HTTP de la petición del usuario',
        'Reenviar el paquete no requiere reescribir la operación HTTP.',
      ],
      [
        'Los puertos TCP para crear una aplicación distinta',
        'En este reenvío sin traducción, los puertos de extremo a extremo no se cambian por cambiar de enlace.',
      ],
      [
        'La foto original, para darle otro formato',
        'La representación de la foto no se reconstruye en cada salto.',
      ],
    ],
    'El paquete continúa dentro de una trama nueva. No afirmamos que toda la cabecera IP permanezca idéntica: TTL o Hop Limit pueden cambiar.',
    'Distingue el paquete viajero de su envoltura local.',
    ['ethernet', 'ip'],
  ),
  q(
    'scenario',
    3,
    1,
    'Tu equipo alcanza destinos locales, pero su configuración no tiene puerta de enlace para llegar a otra red. ¿Qué función investigarías?',
    [
      [
        'El encaminamiento y la configuración IP',
        'La puerta de enlace da el siguiente salto para destinos que no son locales.',
      ],
      ['La compresión del archivo que vas a enviar', 'Comprimir no crea una ruta hacia otra red.'],
      [
        'La contraseña del servicio remoto',
        'No poder encaminar hacia el destino se analiza antes de autenticar en ese servicio.',
      ],
      [
        'El orden de confirmaciones TCP como única causa',
        'TCP necesita un recorrido IP; sin ruta, sus confirmaciones no aportan esa ruta.',
      ],
    ],
    'La pista concreta es una configuración de red incompleta. Tener enlace local no basta para llegar a otras redes.',
    '¿Quién indica dónde enviar un paquete que sale de la red local?',
    ['ip'],
  ),
  q(
    'scenario',
    3,
    2,
    'Un router decrementa el Hop Limit de IPv6 y descarta un paquete cuando alcanza cero al reenviarlo. ¿Qué está evitando?',
    [
      [
        'Que un paquete siga recorriendo saltos indefinidamente',
        'El límite de saltos acota su recorrido, incluso si existen bucles.',
      ],
      ['Que una contraseña se envíe sin cifrar', 'Hop Limit no aporta confidencialidad.'],
      [
        'Que dos textos tengan codificaciones diferentes',
        'El límite de saltos no convierte formatos de texto.',
      ],
      [
        'Que TCP tenga que confirmar una entrega',
        'La confirmación TCP es una función distinta de limitar el recorrido IP.',
      ],
    ],
    'El dato pertenece a red y no es un reloj del usuario ni una garantía de entrega. El comportamiento del destino final tiene reglas propias.',
    'Un «salto» es un paso de encaminamiento.',
    ['ip'],
  ),
  q(
    'scenario',
    3,
    3,
    'Una tabla no contiene ninguna ruta utilizable hacia la IP de destino. ¿Qué afirmación está mejor respaldada?',
    [
      [
        'Falta una decisión de encaminamiento utilizable hacia ese destino',
        'La evidencia observada afecta a cómo enviar el paquete hacia su destino.',
      ],
      ['El cable está roto con certeza', 'Una ruta ausente no demuestra un defecto físico.'],
      ['El servidor rechazó la contraseña', 'No se ha observado una operación de autenticación.'],
      [
        'TCP ha descifrado mal el mensaje',
        'TCP no descifra el contenido por sí mismo y esa no es la evidencia observada.',
      ],
    ],
    'La tabla aporta una pista de red. Hay que examinar rutas y configuración sin convertirla en conclusiones sobre otras funciones.',
    'Concluye solo lo que permite la observación.',
    ['ip'],
  ),
  q(
    'scenario',
    4,
    1,
    'DNS devuelve una IP, pero la conexión al puerto TCP del servicio es rechazada. ¿Qué comprobarías ahora?',
    [
      [
        'Si el proceso escucha en ese puerto y qué reglas de acceso se aplican',
        'El rechazo orienta a comprobar el extremo de transporte y el servicio o filtro correspondiente.',
      ],
      [
        'Si el nombre DNS necesariamente no existe',
        'Ya has recibido una respuesta con IP; el rechazo del puerto es otra observación.',
      ],
      [
        'Si TCP ha cifrado el contenido de la petición',
        'TCP no aporta ese cifrado y el rechazo ocurre al intentar conectar.',
      ],
      [
        'Si la dirección MAC es igual en todos los saltos',
        'Las direcciones de enlace no tienen que permanecer iguales en todo el recorrido.',
      ],
    ],
    'Un rechazo no demuestra una única causa. Se revisan escucha y reglas de acceso; no se confunde resolver un nombre con tener un servicio disponible.',
    'La pista es un puerto lógico al intentar conectar.',
    ['tcp'],
  ),
  q(
    'scenario',
    4,
    2,
    'Un vídeo utiliza UDP y su aplicación detecta pérdidas y vuelve a pedir algunos datos. ¿Qué puedes afirmar?',
    [
      [
        'La aplicación añade recuperación; UDP no la garantiza por sí mismo',
        'Una función superior puede gestionar pérdidas sobre el servicio de UDP.',
      ],
      [
        'UDP garantiza ahora entrega y orden a cualquier aplicación',
        'Las acciones de esta aplicación no cambian las garantías de UDP para todas las demás.',
      ],
      [
        'UDP pasa a ser el protocolo de aplicación del vídeo',
        'El transporte y el protocolo que pide recuperar datos siguen siendo funciones distintas.',
      ],
      [
        'Toda recuperación exige que UDP se convierta en TCP',
        'Una aplicación puede implementar mecanismos propios sin sustituir UDP por TCP.',
      ],
    ],
    'Clasifica cada responsabilidad: UDP realiza transporte y la aplicación agrega mecanismos de recuperación según sus necesidades.',
    'Distingue lo que ofrece el transporte de lo que añade su usuario.',
    ['udp'],
  ),
  q(
    'scenario',
    4,
    3,
    'El receptor TCP anuncia una ventana más pequeña porque tiene poco espacio disponible. ¿Qué está ajustando?',
    [
      [
        'El control de flujo hacia ese receptor',
        'La ventana indica cuántos datos adicionales puede aceptar el receptor.',
      ],
      [
        'La ruta IP hacia una red alternativa',
        'La ventana no indica el siguiente salto de encaminamiento.',
      ],
      [
        'La codificación de los caracteres del mensaje',
        'El espacio del receptor TCP no negocia la representación del texto.',
      ],
      [
        'La intensidad de la señal Wi-Fi recibida',
        'La ventana es información lógica de transporte, no una medida de radio.',
      ],
    ],
    'TCP limita datos pendientes según la capacidad anunciada del receptor. El control de flujo y el de congestión están relacionados, pero tienen objetivos distintos.',
    '¿El límite describe al receptor o el camino de la red?',
    ['tcp'],
  ),
  q(
    'scenario',
    5,
    1,
    'En un diálogo OSI se acuerda retomar desde un punto de sincronización tras una interrupción. ¿Qué función se está modelando?',
    [
      [
        'La coordinación y recuperación del diálogo de sesión',
        'Un punto de sincronización del diálogo es una función conceptual de sesión.',
      ],
      [
        'La retransmisión de bytes perdida realizada por TCP',
        'Aquí se describe un punto del diálogo; TCP recupera su propio flujo mediante secuencias.',
      ],
      [
        'La selección del siguiente salto IP',
        'Retomar una conversación no decide la ruta de un paquete.',
      ],
      [
        'La conversión de codificaciones de texto',
        'Sincronizar el diálogo no transforma la representación del contenido.',
      ],
    ],
    'El ejemplo modela sesión, sin afirmar que toda aplicación real utilice un protocolo OSI separado de capa 5.',
    'La unidad conceptual es el diálogo acordado.',
    ['session'],
  ),
  q(
    'scenario',
    5,
    2,
    'Un diálogo OSI de turno alterno concede a una parte el derecho a enviar. ¿Qué describe ese derecho?',
    [
      [
        'Control del diálogo de sesión',
        'Se coordina qué participante puede enviar dentro del diálogo.',
      ],
      [
        'El acceso de una estación Wi-Fi al medio de radio',
        'Ese acceso MAC organiza tramas en un medio; el enunciado habla de un diálogo por encima del transporte.',
      ],
      [
        'Una contraseña de la cuenta personal',
        'El derecho del diálogo no es necesariamente autenticación de un usuario.',
      ],
      [
        'Una dirección IP para encaminar paquetes',
        'Un turno de diálogo no proporciona direccionamiento de red.',
      ],
    ],
    'Dos «turnos» pueden parecerse y pertenecer a funciones distintas: acceso al medio en enlace y control de diálogo en sesión.',
    'El enunciado sitúa el diálogo por encima del transporte.',
    ['session'],
  ),
  q(
    'scenario',
    5,
    3,
    'Una aplicación TCP/IP guarda el estado de una conversación y coordina su cierre. ¿Cómo relacionas esa función con OSI?',
    [
      [
        'Puede realizar funciones de sesión integradas en la aplicación',
        'TCP/IP suele agrupar funciones OSI superiores sin exigir capas 5 y 6 independientes.',
      ],
      [
        'Debe existir obligatoriamente un proceso separado llamado capa 5',
        'OSI modela funciones; la implementación no tiene que repartirlas en procesos con esos nombres.',
      ],
      [
        'Toda la aplicación cambia a transporte al guardar estado',
        'Guardar estado de diálogo no convierte todo el programa en TCP o UDP.',
      ],
      [
        'Las funciones de sesión desaparecen porque TCP/IP agrupa capas',
        'Agrupar responsabilidades no significa que los sistemas dejen de realizarlas.',
      ],
    ],
    'OSI ayuda a explicar responsabilidades. Su separación conceptual no obliga a que Internet implemente siete módulos idénticos.',
    'Modelo y organización real del código no son lo mismo.',
  ),
  q(
    'scenario',
    6,
    1,
    'El texto recibido muestra caracteres extraños porque el emisor y receptor interpretan codificaciones diferentes. ¿Qué investigarías?',
    [
      [
        'La representación y codificación del texto',
        'Diferentes reglas de interpretación de bytes pueden cambiar los caracteres mostrados.',
      ],
      [
        'El siguiente salto elegido por el router como única explicación',
        'La ruta no decide por sí sola qué caracteres representan esos bytes.',
      ],
      [
        'La tabla MAC del switch como convertidor de caracteres',
        'La tabla MAC sirve a la entrega de tramas, no a traducir texto.',
      ],
      [
        'La contraseña usada para autenticar al servidor',
        'La autenticación no convierte entre las codificaciones del texto.',
      ],
    ],
    'Es una pista de representación, asociada conceptualmente a presentación. Comprueba la codificación concreta sin atribuir todo error visual a capa 6.',
    'Los bytes pueden llegar y, aun así, interpretarse con reglas distintas.',
  ),
  q(
    'scenario',
    6,
    2,
    'Una foto comprimida se envía por HTTP sin TLS. ¿Qué afirmación sobre la compresión es correcta?',
    [
      [
        'Puede reducir su tamaño, pero no protege por sí misma su confidencialidad',
        'La reducción de tamaño y la protección frente a lectores son objetivos distintos.',
      ],
      [
        'La foto queda cifrada por estar comprimida',
        'Comprimir no exige una clave secreta ni proporciona confidencialidad por sí mismo.',
      ],
      [
        'La compresión obliga a TCP a retransmitir sin pérdidas para siempre',
        'La representación de la foto no cambia las garantías ni los límites del transporte.',
      ],
      [
        'La compresión decide qué router es el siguiente salto',
        'La elección de rutas pertenece a red, no al formato de la imagen.',
      ],
    ],
    'La compresión trata la representación; el cifrado necesita su mecanismo propio. Si quieres proteger una web, utiliza la comunicación segura pertinente.',
    'Pequeño y secreto no significan lo mismo.',
    ['tls'],
  ),
  q(
    'scenario',
    6,
    3,
    'Al estudiar TLS, alguien dibuja una caja en presentación. ¿Qué matiz añadirías?',
    [
      [
        'El cifrado se relaciona con esa función, pero todo TLS no encaja rígidamente en una capa OSI',
        'La asociación es didáctica: el protocolo real tiene negociación, protección de registros y otras responsabilidades.',
      ],
      [
        'TLS es exactamente toda la capa 6 en cualquier sistema',
        'Un modelo de funciones no permite identificar todo un protocolo real con toda una capa universal.',
      ],
      [
        'TLS sustituye las direcciones IP y elimina la capa de red',
        'TLS necesita servicios para que sus mensajes lleguen entre extremos; no sustituye el encaminamiento IP.',
      ],
      [
        'La palabra Transport obliga a clasificar cualquier función TLS como TCP',
        'Los nombres de protocolos no sustituyen un análisis de sus funciones; TLS y TCP son distintos.',
      ],
    ],
    'Distingue una asociación conceptual del encaje real del protocolo. Es más preciso que memorizar una correspondencia absoluta TLS = capa 6.',
    'Clasifica funciones sin forzar los protocolos reales dentro de una caja.',
    ['tls'],
  ),
  q(
    'scenario',
    7,
    1,
    'La web responde HTTP 503 Service Unavailable. ¿Qué observación sí tienes?',
    [
      [
        'Ha llegado una respuesta HTTP que indica indisponibilidad del servicio',
        'El código expresa una condición del servicio que respondió a esa petición.',
      ],
      [
        'No circuló ninguna señal por el enlace',
        'La respuesta recibida demuestra un intercambio; no demuestra ausencia total de señal.',
      ],
      [
        'DNS no pudo devolver ninguna dirección en absoluto',
        'El código HTTP no es una prueba de que la resolución DNS fallara.',
      ],
      [
        'TCP garantiza que el servicio aceptará la siguiente petición',
        'TCP no garantiza la disponibilidad futura de una aplicación.',
      ],
    ],
    'Es evidencia de aplicación: un participante HTTP ha respondido. Puede ser el servidor o un intermediario; no prueba que todos los componentes funcionen bien.',
    'Interpreta la respuesta concreta, no el estado de toda la red.',
    ['http'],
  ),
  q(
    'scenario',
    7,
    2,
    'El servicio DNS responde NXDOMAIN para un nombre. ¿Qué comprobarías primero?',
    [
      [
        'El nombre consultado y la respuesta del servicio de nombres',
        'NXDOMAIN informa de inexistencia del nombre según esa respuesta DNS.',
      ],
      [
        'Si la foto necesita otra compresión',
        'El formato de una foto no hace existir el nombre DNS consultado.',
      ],
      [
        'Si el puerto TCP del servicio web garantiza la existencia del dominio',
        'El servicio web y la resolución de nombres son comprobaciones distintas.',
      ],
      [
        'Si todo el cableado está roto necesariamente',
        'Has obtenido una respuesta DNS; ese resultado no demuestra una rotura física.',
      ],
    ],
    'DNS define el significado de su respuesta. Comprueba escritura, configuración y contexto antes de concluir que cualquier otra función está averiada.',
    'La evidencia viene del servicio que interpreta el nombre.',
    ['dns'],
  ),
  q(
    'scenario',
    7,
    3,
    'Un cliente obtiene una dirección por DHCP. ¿Cómo clasificas el protocolo que presta ese servicio?',
    [
      [
        'Aplicación, aunque configure parámetros que utiliza IP',
        'DHCP presta un servicio de configuración y usa UDP para sus mensajes.',
      ],
      [
        'Red obligatoriamente, porque su respuesta contiene una IP',
        'La información entregada no determina la capa del protocolo que presta el servicio.',
      ],
      [
        'Transporte, porque sus mensajes usan puertos UDP',
        'UDP transporta los mensajes de DHCP; son funciones distintas.',
      ],
      [
        'Física, porque el cliente acaba conectado por un cable',
        'El medio que lleva los mensajes no transforma DHCP en señalización física.',
      ],
    ],
    'Clasifica por función: DHCP es un servicio de aplicación que configura parámetros de red. Sus vehículos y su resultado pertenecen a otras responsabilidades.',
    'Un servicio puede configurar otra capa sin convertirse en ella.',
    ['dhcp'],
  ),
];
