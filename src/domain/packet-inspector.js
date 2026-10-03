/** Bounded Ethernet II / IPv4 / TCP decoder. No live traffic or packet execution. */
export function parseHex(text) {
  if (typeof text !== 'string' || text.length > 16384)
    throw new Error('Pega una trama de hasta 4096 bytes.');
  const hex = text.replace(/\s/g, '');
  if (!hex.length || hex.length > 8192 || hex.length % 2 || !/^[0-9a-f]+$/i.test(hex))
    throw new Error('Usa pares hexadecimales (00–ff), separados por espacios o saltos de línea.');
  return Uint8Array.from(hex.match(/../g), (pair) => parseInt(pair, 16));
}
export function checksum(bytes) {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) sum += (bytes[i] << 8) | (bytes[i + 1] ?? 0);
  while (sum >>> 16) sum = (sum & 65535) + (sum >>> 16);
  return ~sum & 65535;
}
export function inspectPacket(bytes) {
  const fields = [],
    segments = [],
    warnings = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const need = (end) => {
    if (bytes.length < end)
      throw new Error('Trama truncada: faltan bytes de la cabecera o de los datos.');
  };
  const hex = (a, b) =>
    Array.from(bytes.slice(a, b), (n) => n.toString(16).padStart(2, '0')).join(':');
  const ip = (a) => Array.from(bytes.slice(a, a + 4)).join('.');
  const field = (name, start, end, value, why, layer) =>
    fields.push({ name, start, end, value: String(value), why, layer });
  need(14);
  field(
    'MAC destino',
    0,
    6,
    hex(0, 6),
    'Identifica la interfaz del siguiente salto en este enlace, no el servidor remoto.',
    2,
  );
  field('MAC origen', 6, 12, hex(6, 12), 'Interfaz que envía esta trama en el enlace local.', 2);
  const ether = view.getUint16(12);
  field(
    'EtherType',
    12,
    14,
    '0x' + ether.toString(16),
    '0x0800 indica que la carga contiene IPv4.',
    2,
  );
  segments.push({ name: 'Ethernet', start: 0, end: 14, layer: 2 });
  if (ether !== 0x0800)
    throw new Error('Este laboratorio decodifica Ethernet II con IPv4 (EtherType 0800).');
  const start = 14;
  need(start + 20);
  const ihl = (bytes[start] & 15) * 4;
  if (bytes[start] >>> 4 !== 4 || ihl < 20) throw new Error('Cabecera IPv4 inválida.');
  need(start + ihl);
  const total = view.getUint16(start + 2);
  if (total < ihl + 20) throw new Error('Longitud IPv4 incompatible con TCP.');
  need(start + total);
  const fragment = view.getUint16(start + 6);
  if (fragment & 0x3fff)
    throw new Error('La trama está fragmentada. Reensambla IPv4 antes de inspeccionar TCP.');
  if (bytes[start + 9] !== 6) throw new Error('Este ejemplo necesita TCP (protocolo IPv4 6).');
  field(
    'Versión / IHL',
    14,
    15,
    `IPv4 · ${ihl} bytes`,
    'El tamaño de cabecera no es siempre 20: las opciones ocupan bytes extra.',
    3,
  );
  field(
    'Longitud IPv4',
    16,
    18,
    total + ' bytes',
    'Incluye la cabecera IP, la cabecera TCP y sus datos; excluye Ethernet.',
    3,
  );
  field(
    'TTL',
    22,
    23,
    bytes[22],
    'Número de saltos restante. Los routers lo reducen para evitar bucles.',
    3,
  );
  field('Protocolo', 23, 24, '6 · TCP', 'Indica qué protocolo lleva IP dentro.', 3);
  field(
    'Checksum IPv4',
    24,
    26,
    '0x' + view.getUint16(24).toString(16).padStart(4, '0'),
    'Comprueba únicamente la cabecera IPv4; no cifra nada.',
    3,
  );
  field('IP origen', 26, 30, ip(26), 'Dirección del equipo que originó este paquete IP.', 3);
  field('IP destino', 30, 34, ip(30), 'Dirección IP del destino final.', 3);
  segments.push({ name: 'IPv4', start, end: start + ihl, layer: 3 });
  if (checksum(bytes.slice(start, start + ihl)) !== 0)
    warnings.push('El checksum de IPv4 no coincide.');
  const tcp = start + ihl,
    end = start + total;
  need(tcp + 20);
  const header = (bytes[tcp + 12] >>> 4) * 4;
  if (header < 20 || tcp + header > end) throw new Error('Tamaño de cabecera TCP inválido.');
  field(
    'Puerto origen',
    tcp,
    tcp + 2,
    view.getUint16(tcp),
    'Identifica el proceso local junto con la IP y el protocolo.',
    4,
  );
  field(
    'Puerto destino',
    tcp + 2,
    tcp + 4,
    view.getUint16(tcp + 2),
    '80 es el puerto habitual de HTTP sin TLS; el número por sí solo no demuestra el protocolo.',
    4,
  );
  field(
    'Secuencia TCP',
    tcp + 4,
    tcp + 8,
    view.getUint32(tcp + 4),
    'Sitúa los bytes dentro del flujo para ordenar y detectar pérdidas.',
    4,
  );
  field(
    'ACK',
    tcp + 8,
    tcp + 12,
    view.getUint32(tcp + 8),
    'Indica el siguiente byte esperado, cuando está activada la bandera ACK.',
    4,
  );
  field(
    'Cabecera / banderas',
    tcp + 12,
    tcp + 14,
    `${header} bytes · 0x${bytes[tcp + 13].toString(16)}`,
    'Las banderas controlan la conexión. TCP entrega datos fiables, no los cifra.',
    4,
  );
  field(
    'Ventana',
    tcp + 14,
    tcp + 16,
    view.getUint16(tcp + 14),
    'Control de flujo: cuántos bytes puede recibir el otro extremo.',
    4,
  );
  segments.push({ name: 'TCP', start: tcp, end: tcp + header, layer: 4 });
  const pseudo = new Uint8Array(12 + end - tcp);
  pseudo.set(bytes.slice(26, 34));
  pseudo[9] = 6;
  pseudo[10] = (end - tcp) >>> 8;
  pseudo[11] = (end - tcp) & 255;
  pseudo.set(bytes.slice(tcp, end), 12);
  if (checksum(pseudo) !== 0) warnings.push('El checksum de TCP no coincide.');
  const payload = new TextDecoder().decode(bytes.slice(tcp + header, end));
  if (payload.length) {
    const isHTTP =
      /^(GET|POST|HEAD|PUT|DELETE|OPTIONS|PATCH) \S+ HTTP\/1\.[01]\r\n|^HTTP\/1\.[01] /.test(
        payload,
      );
    segments.push({ name: isHTTP ? 'HTTP' : 'Datos TCP', start: tcp + header, end, layer: 7 });
    field(
      isHTTP ? 'Petición HTTP' : 'Datos de aplicación',
      tcp + header,
      end,
      payload,
      isHTTP
        ? 'HTTP expresa qué pide el cliente. En HTTPS estos bytes viajarían cifrados por TLS; TCP seguiría sin cifrar.'
        : 'No se reconoce HTTP en claro. Puede ser otro protocolo o solo una parte del flujo TCP.',
      7,
    );
  }
  if (bytes.length > end)
    warnings.push(
      'Hay bytes posteriores al paquete IP: posible relleno Ethernet o FCS. No se interpreta el FCS.',
    );
  return { bytes, fields, segments, warnings };
}
/** Authored, standards-valid HTTP frame with documentation addresses; not a private capture. */
export function examplePacket() {
  const body = new TextEncoder().encode('GET / HTTP/1.1\r\nHost: example.com\r\n\r\n');
  const b = new Uint8Array(54 + body.length),
    v = new DataView(b.buffer);
  b.set([2, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 2, 8, 0, 0x45, 0]);
  v.setUint16(16, 40 + body.length);
  v.setUint16(18, 1);
  v.setUint16(20, 0x4000);
  b[22] = 64;
  b[23] = 6;
  b.set([192, 0, 2, 10, 198, 51, 100, 20], 26);
  v.setUint16(24, checksum(b.slice(14, 34)));
  v.setUint16(34, 49152);
  v.setUint16(36, 80);
  v.setUint32(38, 1);
  v.setUint32(42, 1);
  b[46] = 0x50;
  b[47] = 0x18;
  v.setUint16(48, 64240);
  b.set(body, 54);
  const pseudo = new Uint8Array(12 + 20 + body.length);
  pseudo.set(b.slice(26, 34));
  pseudo[9] = 6;
  v.setUint16(50, 0);
  pseudo[10] = (20 + body.length) >>> 8;
  pseudo[11] = (20 + body.length) & 255;
  pseudo.set(b.slice(34), 12);
  v.setUint16(50, checksum(pseudo));
  return b;
}
export const hexText = (bytes) =>
  Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join(' ');
