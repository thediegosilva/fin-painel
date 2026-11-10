/**
 * Geração do "BR Code" Pix estático (padrão EMV® QRCPS do Banco Central).
 * Sem valor definido: o aplicativo do banco pergunta quanto a pessoa quer enviar.
 * Referência: Manual de Padrões para Iniciação do Pix (BCB), Anexo I.
 */

function field(id: string, value: string): string {
  if (value.length > 99) throw new Error(`Campo ${id} excede 99 caracteres`);
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF), exigido pelo padrão. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do conjunto aceito pelos bancos. */
function sanitize(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .-]/g, "")
    .trim()
    .slice(0, max);
}

export interface PixStatic {
  key: string;
  name: string;
  city: string;
  /** Identificador da transação; "***" = sem identificador (padrão para QR estático). */
  txid?: string;
}

export function buildPixPayload({ key, name, city, txid = "***" }: PixStatic): string {
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", key);
  const body =
    field("00", "01") + // Payload Format Indicator
    field("01", "11") + // Point of Initiation: estático (reutilizável)
    field("26", merchantAccount) +
    field("52", "0000") + // Merchant Category Code
    field("53", "986") + // Moeda: BRL
    field("58", "BR") +
    field("59", sanitize(name, 25)) +
    field("60", sanitize(city, 15)) +
    field("62", field("05", txid)) +
    "6304";
  return body + crc16(body);
}
