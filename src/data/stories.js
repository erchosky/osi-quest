export const stories = [
  {
    layer: 1,
    title: 'La carretera de tu pedido',
    paragraphs: [
      'Pides una pizza desde el móvil. Antes de que un mensaje pueda viajar, sus bits necesitan convertirse en señales. Si usas Wi-Fi, viajan como ondas de radio; en una fibra se usan pulsos de luz.',
      'Esta capa no sabe qué pizza elegiste ni cuál es la dirección IP del restaurante. Su tarea es representar y transmitir bits sobre un medio. Sin señal, ninguna de las funciones superiores puede completar el intercambio por ese enlace.',
    ],
    takeaway:
      'Recuerda: bits y señales. Comprueba un cable, un conector o la cobertura antes de atribuir la ausencia de enlace al navegador.',
  },
  {
    layer: 2,
    title: 'La entrega del siguiente tramo',
    paragraphs: [
      'Tu mensaje no aparece por arte de magia en el restaurante. En un enlace local se organiza en una trama. Las MAC ayudan a dirigir esa trama en el salto que toca, como una entrega entre dos puntos cercanos de un recorrido.',
      'Un switch de capa 2 aprende por qué puerto ve las MAC y decide cómo conmutar tramas. Cuando el mensaje cruza un router hacia otra red, se prepara una nueva envoltura de enlace para ese nuevo tramo. No viaja una única trama intacta por todo Internet.',
    ],
    takeaway:
      'Recuerda: trama, MAC y enlace local. El FCS de Ethernet detecta errores; detectar no significa corregirlos automáticamente.',
  },
  {
    layer: 3,
    title: 'El mapa hasta el restaurante',
    paragraphs: [
      'El restaurante está en otra red. Una dirección IP proporciona un destino lógico y los routers consultan rutas para reenviar los paquetes hacia él. Piensa en ir eligiendo los siguientes tramos de una ruta de reparto.',
      'El router no necesita entender el sabor de la pizza. Se centra en el paquete y su encaminamiento. Llegar a una IP es una comprobación de conectividad con ese destino, no una prueba de que todos sus servicios estén funcionando.',
    ],
    takeaway:
      'Recuerda: paquete, IP y rutas entre redes. Si lo local funciona pero lo remoto no, revisa la configuración IP, las rutas y la puerta de enlace.',
  },
  {
    layer: 4,
    title: 'La ventanilla correcta del edificio',
    paragraphs: [
      'La misma máquina puede atender una web y otros servicios. Los puertos de transporte ayudan a distinguir qué proceso debe recibir los datos. Son números lógicos; no son los conectores que ves en el equipo.',
      'En una conexión TCP se usan números de secuencia, confirmaciones y retransmisiones para entregar un flujo fiable y ordenado. UDP envía datagramas sin esas garantías propias. Una aplicación puede elegir un transporte según sus necesidades y añadir sus mecanismos.',
    ],
    takeaway:
      'Recuerda: puertos, TCP y UDP. Fiabilidad no significa cifrado ni disponibilidad absoluta: una conexión puede fallar.',
  },
  {
    layer: 5,
    title: 'Mantener la conversación',
    paragraphs: [
      'Imagínate una conversación con el restaurante: abrís el diálogo, os coordináis y lo cerráis cuando termina. La capa de sesión representa la organización de ese intercambio y sus posibles puntos de sincronización.',
      'Es una explicación de responsabilidades, no la afirmación de que una app de pedidos tenga un programa separado llamado «capa 5». En TCP/IP, esas funciones suelen estar integradas con las aplicaciones y sus protocolos.',
    ],
    takeaway:
      'Recuerda: gestionar el diálogo. El botón «iniciar sesión» de una cuenta es una operación de aplicación; compartir la palabra no lo convierte en capa 5.',
  },
  {
    layer: 6,
    title: 'Hablar el mismo idioma',
    paragraphs: [
      'Quieres mandar un texto o una imagen del pedido y el receptor debe interpretar su representación. Es parecido a ponerse de acuerdo en el idioma de una carta. Codificación, traducción de formatos y compresión ayudan a que los datos tengan sentido.',
      'Comprimir reduce la representación de los datos; cifrar busca proteger su confidencialidad. No son lo mismo. En OSI, estas funciones se asocian conceptualmente a presentación, pero el cifrado real puede realizarse en distintos puntos de una comunicación.',
    ],
    takeaway:
      'Recuerda: formato y representación. Presentación no significa diseñar la pantalla; tampoco es exacto encerrar todo TLS en una única capa OSI.',
  },
  {
    layer: 7,
    title: 'La petición que tiene sentido para ti',
    paragraphs: [
      'La app puede pedir un recurso a un servidor mediante HTTP y consultar nombres con DNS. Es aquí donde hablamos de servicios como web, correo o transferencia de archivos, cercanos a lo que el usuario quiere conseguir.',
      'La aplicación completa usa muchas funciones de la red. HTTP es un protocolo de aplicación, pero sus datos pueden viajar sobre transporte e IP. DNS también es aplicación aunque use UDP o TCP para transportar sus mensajes.',
    ],
    takeaway:
      'Recuerda: servicios y protocolos de aplicación. Un error HTTP 404 es una respuesta del servicio; no demuestra que el cable esté cortado.',
  },
];
