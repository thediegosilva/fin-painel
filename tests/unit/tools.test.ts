import { describe, expect, it } from "vitest";
import { CATEGORIES, TOOLS, popularFirst, searchTools } from "@/lib/tools";

describe("registro de ferramentas", () => {
  it("slugs são únicos e em formato URL", () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
  it("toda categoria possui ferramentas", () => {
    for (const c of CATEGORIES) expect(TOOLS.some((t) => t.category === c.id)).toBe(true);
  });
  it("ferramentas de servidor declaram a capacidade exigida", () => {
    for (const t of TOOLS.filter((t) => t.mode === "servidor")) expect(t.capability).toBeTruthy();
  });
  it("busca ignora acentos e filtra por categoria", () => {
    expect(searchTools("pagina").map((t) => t.slug)).toContain("numeros-de-pagina");
    expect(searchTools("senha").map((t) => t.slug)).toEqual(["proteger-pdf", "desbloquear-pdf"]);
    expect(searchTools("", "otimizar").map((t) => t.slug)).toEqual(["comprimir-pdf"]);
    expect(searchTools("xyz-inexistente")).toEqual([]);
  });
  it("ferramentas mais usadas vêm primeiro, sem perder nenhuma", () => {
    const ordered = popularFirst(TOOLS);
    expect(ordered.slice(0, 2).map((t) => t.slug)).toEqual(["pdf-para-jpg", "jpg-para-pdf"]);
    expect(ordered).toHaveLength(TOOLS.length);
    expect(popularFirst(searchTools("", "converter"))[0].slug).toBe("pdf-para-jpg");
  });
});
