import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { PIX, PIX_PAYLOAD } from "@/lib/donation";
import { buildPixPayload, crc16 } from "@/lib/pix";

/** Lê os campos EMV (ID + tamanho + valor) do payload. */
function parseEmv(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < s.length) {
    const id = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    out[id] = s.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

describe("Pix BR Code", () => {
  it("CRC16/CCITT-FALSE confere com o vetor de teste padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("payload estático válido, sem valor e com CRC correto", () => {
    const f = parseEmv(PIX_PAYLOAD);
    expect(f["00"]).toBe("01");
    expect(f["01"]).toBe("11");
    expect(parseEmv(f["26"])).toEqual({ "00": "br.gov.bcb.pix", "01": PIX.key });
    expect(f["53"]).toBe("986");
    expect(f["54"]).toBeUndefined(); // valor livre
    expect(f["58"]).toBe("BR");
    expect(f["59"]).toBe("Diego Oliveira da Silva");
    expect(f["60"]).toBe("Rio de Janeiro");
    expect(parseEmv(f["62"])).toEqual({ "05": "***" });
    expect(f["63"]).toBe(crc16(PIX_PAYLOAD.slice(0, -4)));
    expect(PIX_PAYLOAD.endsWith(f["63"])).toBe(true);
  });

  it("remove acentos e respeita limites de nome (25) e cidade (15)", () => {
    const f = parseEmv(buildPixPayload({ key: "x", name: "José Ângelo de Assunção Júnior Filho", city: "São João de Meriti" }));
    expect(f["59"]).toBe("Jose Angelo de Assuncao J");
    expect(f["60"]).toBe("Sao Joao de Mer");
  });

  it("o QR Code gerado decodifica exatamente para o payload", async () => {
    const png = PNG.sync.read(await QRCode.toBuffer(PIX_PAYLOAD, { errorCorrectionLevel: "M", margin: 1, scale: 6 }));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(decoded?.data).toBe(PIX_PAYLOAD);
  });
});
