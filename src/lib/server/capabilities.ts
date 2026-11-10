import "server-only";
import { serverConfig } from "./config";
import { run } from "./exec";

export interface Capabilities {
  ghostscript: { available: boolean; version?: string };
  libreoffice: { available: boolean; version?: string };
}

let cached: { value: Capabilities; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

async function probe(file: string, args: string[]): Promise<{ available: boolean; version?: string }> {
  try {
    const { stdout } = await run(file, args, { timeoutMs: 20_000 });
    const version = stdout.trim().split("\n")[0]?.slice(0, 80);
    return { available: true, version };
  } catch {
    return { available: false };
  }
}

/** Detecta (com cache de 5 min) quais binários de servidor estão instalados. */
export async function getCapabilities(): Promise<Capabilities> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const [ghostscript, libreoffice] = await Promise.all([
    probe(serverConfig.ghostscriptPath, ["--version"]),
    probe(serverConfig.libreofficePath, ["--headless", "--version"]),
  ]);
  const value = { ghostscript, libreoffice };
  cached = { value, at: Date.now() };
  return value;
}
