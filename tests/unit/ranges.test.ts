import { describe, expect, it } from "vitest";
import { formatRange, parseRangeGroups, parseRangeSet } from "@/lib/pdf/ranges";

describe("parseRangeGroups", () => {
  it("interpreta páginas e intervalos", () => {
    expect(parseRangeGroups("1-3, 5, 8-10", 10)).toEqual([[0, 1, 2], [4], [7, 8, 9]]);
  });
  it("aceita intervalo aberto e decrescente", () => {
    expect(parseRangeGroups("8-", 10)).toEqual([[7, 8, 9]]);
    expect(parseRangeGroups("3-1", 5)).toEqual([[2, 1, 0]]);
    expect(parseRangeGroups("2–3", 5)).toEqual([[1, 2]]);
  });
  it("rejeita páginas inexistentes e sintaxe inválida", () => {
    expect(() => parseRangeGroups("0", 5)).toThrow(/não existe/);
    expect(() => parseRangeGroups("6", 5)).toThrow(/não existe/);
    expect(() => parseRangeGroups("abc", 5)).toThrow(/inválido/);
    expect(() => parseRangeGroups("  ", 5)).toThrow(/Informe/);
  });
});

describe("parseRangeSet / formatRange", () => {
  it("remove duplicatas preservando ordem", () => {
    expect(parseRangeSet("3, 1-3", 5)).toEqual([2, 0, 1]);
  });
  it("compacta índices", () => {
    expect(formatRange([0, 1, 2, 4, 7, 8])).toBe("1-3, 5, 8-9");
    expect(formatRange([])).toBe("");
  });
});

import { sequenceName } from "@/lib/format";

describe("sequenceName", () => {
  it("numera com 4 dígitos a partir de 0000", () => {
    expect([0, 1, 2, 3].map((i) => sequenceName(i, 4, "jpg"))).toEqual(["0000.jpg", "0001.jpg", "0002.jpg", "0003.jpg"]);
    expect(sequenceName(9999, 10_000, "png")).toBe("9999.png");
  });
  it("amplia os dígitos acima de 10.000 arquivos, mantendo a ordem alfabética", () => {
    expect(sequenceName(5, 10_001, "jpg")).toBe("00005.jpg");
    const names = Array.from({ length: 12 }, (_, i) => sequenceName(i, 12, "jpg"));
    expect([...names].sort()).toEqual(names);
  });
});
