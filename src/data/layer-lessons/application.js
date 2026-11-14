export const applicationLesson = {
  introduction:
    'Aplicación ofrece servicios de red con significado para quien los utiliza: pedir un recurso, consultar un nombre o enviar correo. Aprenderás a distinguir el protocolo del servicio de la aplicación completa y a interpretar una respuesta sin atribuirle garantías que no tiene.',
  sections: [
    {
      title: 'La operación que quieres conseguir',
      paragraphs: [
        'Tu objetivo puede ser abrir una página o enviar un mensaje. Un protocolo de aplicación define cómo expresar una operación y cómo interpretar respuestas. HTTP permite intercambios de petición y respuesta; DNS ofrece consultas sobre nombres; SMTP participa en la transferencia de correo.',
        'La analogía es la ventanilla donde solicitas un servicio. No describe el trayecto del envío ni el departamento identificado por un puerto de transporte. Aquí interesa qué estás pidiendo y qué significa la contestación.',
      ],
    },
    {
      title: 'Abrir una página sin mezclar responsabilidades',
      paragraphs: [
        'Escribes una URL. El navegador identifica esquema, nombre y ruta. Puede necesitar consultar DNS para obtener información de destino, aunque una caché válida puede evitar una nueva consulta. DNS es Aplicación porque ofrece ese servicio de consulta, no Red por devolver una IP.',
        'En un ejemplo HTTPS sobre TCP se establece transporte, se negocia protección TLS y se intercambia HTTP. HTTP/3 utiliza QUIC sobre UDP: la función de pedir una página sigue existiendo aunque cambie la forma de transportarla. Por eso el servicio no debe confundirse con un único transporte.',
        'Un servidor o intermediario responde. El navegador interpreta contenido y puede pedir otros recursos. Que llegue el HTML no garantiza que también funcionen imágenes, scripts o servicios posteriores. Cada petición aporta su propia evidencia.',
      ],
    },
    {
      title: 'Una respuesta puede indicar éxito o rechazo',
      items: [
        'HTTP 200 señala éxito de esa petición según su método; no verifica toda la aplicación.',
        'HTTP 403 comunica que el participante entiende la petición y rechaza atenderla.',
        'HTTP 404 no ofrece el recurso solicitado: no lo encuentra o no quiere revelar que existe.',
        'HTTP 503 indica que el participante no puede atender la petición en ese momento, por ejemplo por sobrecarga o mantenimiento.',
      ],
      paragraphs: [
        'Estos códigos tienen significado de servicio. Un rechazo puede ser una respuesta perfectamente transmitida. La respuesta también puede proceder de un intermediario, no necesariamente del servidor final que imaginabas. Separa el éxito del intercambio del éxito de tu objetivo.',
      ],
    },
    {
      title: 'El navegador completo utiliza muchas capas',
      paragraphs: [
        'La capa de Aplicación no es una lista de todos los programas que ves en pantalla. Un navegador utiliza servicios de aplicación y mecanismos de transporte, red, enlace y medio. También interpreta formatos y mantiene estado de sus operaciones.',
        'El puerto de destino ayuda a distinguir el servicio receptor en Transporte, pero su número no contiene el significado de la petición. Una conexión TCP al puerto esperado puede establecerse y, aun así, el servicio responder con un rechazo o datos inesperados.',
        'En el modelo TCP/IP habitual, Aplicación agrupa además funciones que OSI separa como Sesión y Presentación. Puedes distinguir esas responsabilidades al explicar una operación sin exigir una implementación de siete módulos independientes.',
      ],
    },
    {
      title: 'Investigar una operación con evidencia',
      paragraphs: [
        'Si una página responde 403 y otras funcionan, empieza por comparar recurso, permisos y comportamiento del servicio. No cambies inmediatamente cable, DNS y puerta de enlace: ya sabes que hubo una respuesta para esa petición, aunque falten otras comprobaciones.',
        'Si el nombre no se resuelve, todavía no tienes la misma evidencia que al recibir un código HTTP. Si hay una espera agotada, también pueden intervenir transporte, filtrado o disponibilidad. Describe el resultado concreto antes de asignar una causa.',
      ],
      items: [
        'Anota la operación, el destino y la respuesta o ausencia de respuesta.',
        'Compara otro recurso o dispositivo sin cambiar varias variables.',
        'Distingue un error del servicio de una imposibilidad de intercambiar datos.',
      ],
    },
    {
      title: 'Reconstruye el mensaje con todas sus funciones',
      paragraphs: [
        'Una petición HTTP expresa qué quieres; su representación permite interpretar los datos; el diálogo organiza el intercambio; el transporte comunica procesos; IP encamina; Enlace organiza tramas y Física transmite señales. Es una explicación de funciones que colaboran, no de siete viajes separados.',
        'Prueba a contarlo con una reserva: pedirla, recibir una respuesta y aceptar sus condiciones son hechos diferentes. Ni una señal disponible, ni una IP alcanzable, ni una confirmación TCP demuestran por sí solas que el servicio haya aceptado la operación.',
      ],
    },
  ],
  takeaway:
    'Aplicación expresa servicios y el significado de sus respuestas. Recibir una respuesta no garantiza que tu objetivo se haya cumplido.',
  teachBack:
    'Cuenta qué sabes al recibir un rechazo HTTP y qué no puedes deducir sobre todos los demás recursos. Separa la petición del servicio de su transporte.',
  check: {
    prompt:
      'Una petición de un informe devuelve HTTP 403 y otro recurso de esa web devuelve 200. ¿Qué siguiente investigación aprovecha mejor estas dos respuestas?',
    choices: [
      'Sustituir el cable porque recibir un rechazo significa que no hubo intercambio de datos.',
      'Comparar permisos y reglas del informe, conservando la evidencia de que ambos recursos respondieron.',
      'Cambiar la puerta de enlace porque cada recurso web necesita una ruta IP independiente.',
      'Repetir la negociación TCP para convertir el código de rechazo en una confirmación de entrega.',
    ],
    correctIndex: 1,
    reasons: [
      'Los dos códigos son evidencia de respuestas HTTP. Un rechazo del servicio no equivale a ausencia de transmisión.',
      'La diferencia entre recursos orienta a investigar el servicio y sus reglas, sin descartar la evidencia de ambas respuestas.',
      'Los recursos de una web no exigen por sí mismos una puerta de enlace diferente. Las respuestas no justifican ese cambio.',
      'TCP entrega bytes; no decide los permisos ni transforma el significado de una respuesta HTTP 403.',
    ],
    explanation:
      'Las respuestas tienen significado de Aplicación. Investiga el acceso y comportamiento de ese recurso; no confundas un intercambio correcto con la autorización o éxito de la operación.',
  },
};
