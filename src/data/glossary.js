export const glossary = [
  {
    term: 'Red',
    definition: 'Conjunto de dispositivos que pueden intercambiar información.',
    category: 'Fundamentos',
  },
  {
    term: 'Protocolo',
    definition: 'Reglas para formar e intercambiar mensajes: por ejemplo, HTTP o TCP.',
    category: 'Fundamentos',
  },
  {
    term: 'Bit',
    definition: 'Unidad binaria que puede valer 0 o 1.',
    category: 'Capa 1',
  },
  {
    term: 'Medio físico',
    definition: 'Soporte de transmisión: cobre, fibra o radio.',
    category: 'Capa 1',
  },
  {
    term: 'Trama',
    definition: 'Unidad del enlace que transporta información sobre un salto.',
    category: 'Capa 2',
  },
  {
    term: 'MAC',
    definition:
      'Dirección que participa en la entrega dentro del enlace. No es una identidad infalible: puede cambiar o suplantarse.',
    category: 'Capa 2',
  },
  {
    term: 'Switch',
    definition:
      'Un switch de capa 2 conmuta tramas usando direcciones MAC; uno multicapa puede hacer más.',
    category: 'Capa 2',
  },
  {
    term: 'Paquete',
    definition: 'Unidad de la capa de red; un paquete IP contiene su cabecera y una carga útil.',
    category: 'Capa 3',
  },
  {
    term: 'IP',
    definition: 'Protocolo y direccionamiento lógico para comunicar redes. Una IP puede cambiar.',
    category: 'Capa 3',
  },
  {
    term: 'Router',
    definition: 'Dispositivo que encamina paquetes hacia otras redes.',
    category: 'Capa 3',
  },
  {
    term: 'Puerta de enlace',
    definition:
      'Siguiente salto que un equipo usa para llegar a destinos externos cuando corresponde esa ruta.',
    category: 'Capa 3',
  },
  {
    term: 'Máscara de red',
    definition:
      'Información que permite distinguir qué parte de una dirección IP identifica la red.',
    category: 'Capa 3',
  },
  {
    term: 'Puerto',
    definition:
      'Número lógico de TCP o UDP que permite distinguir procesos. No es una toma física.',
    category: 'Capa 4',
  },
  {
    term: 'Segmento',
    definition: 'Nombre habitual de la unidad de datos de TCP.',
    category: 'Capa 4',
  },
  {
    term: 'Datagrama UDP',
    definition: 'Unidad de datos de UDP. El protocolo no garantiza llegada ni orden.',
    category: 'Capa 4',
  },
  {
    term: 'TCP',
    definition:
      'Transporte orientado a conexión que ofrece una entrega fiable y ordenada. No cifra por sí mismo.',
    category: 'Capa 4',
  },
  {
    term: 'UDP',
    definition:
      'Transporte de datagramas sin confirmación, retransmisión u orden garantizados por el propio protocolo.',
    category: 'Capa 4',
  },
  {
    term: 'Sesión OSI',
    definition: 'Función que organiza y sincroniza el diálogo entre aplicaciones.',
    category: 'Capa 5',
  },
  {
    term: 'Codificación',
    definition: 'Forma de representar información, como caracteres de texto.',
    category: 'Capa 6',
  },
  {
    term: 'Compresión',
    definition: 'Reduce la representación de datos; en OSI se asocia a presentación.',
    category: 'Capa 6',
  },
  {
    term: 'Cifrado',
    definition:
      'Protege la confidencialidad transformando los datos con mecanismos criptográficos. Puede operar en varias capas.',
    category: 'Conceptos',
  },
  {
    term: 'HTTP',
    definition: 'Protocolo de aplicación para intercambiar solicitudes y respuestas de la web.',
    category: 'Capa 7',
  },
  {
    term: 'DNS',
    definition: 'Servicio para consultar información de nombres, como sus direcciones IP.',
    category: 'Capa 7',
  },
  {
    term: 'SMTP',
    definition: 'Protocolo de aplicación para transferir correo electrónico.',
    category: 'Capa 7',
  },
  {
    term: 'Encapsulación',
    definition: 'Añadir información de control a los datos de la capa superior.',
    category: 'Conceptos',
  },
  {
    term: 'Desencapsulación',
    definition: 'Procesar y retirar envolturas al recibir datos.',
    category: 'Conceptos',
  },
  {
    term: 'PDU',
    definition: 'Protocol Data Unit: nombre general de una unidad de datos de protocolo.',
    category: 'Conceptos',
  },
  {
    term: 'TCP/IP',
    definition:
      'Familia de protocolos de Internet; su modelo habitual de cuatro capas agrupa funciones de OSI.',
    category: 'Conceptos',
  },
];
