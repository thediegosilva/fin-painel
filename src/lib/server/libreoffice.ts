import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { serverConfig } from "./config";
import { minimalEnv, run, withJobSlot, withTempDir } from "./exec";

/**
 * Converte um documento Office/ODF/RTF para PDF com o LibreOffice em modo headless.
 * Cada conversão usa um perfil de usuário isolado no diretório temporário,
 * permitindo conversões simultâneas sem conflito de lock.
 */
export async function officeToPdf(input: Uint8Array, ext: string): Promise<Uint8Array> {
  return withJobSlot(() =>
    withTempDir(async (dir) => {
      const inPath = join(dir, `documento.${ext}`);
      const outDir = join(dir, "out");
      const profile = join(dir, "profile");
      await mkdir(outDir);
      await mkdir(profile);
      await writeFile(inPath, input);
      await run(
        serverConfig.libreofficePath,
        [
          `-env:UserInstallation=${pathToFileURL(profile).href}`,
          "--headless",
          "--norestore",
          "--nolockcheck",
          "--nodefault",
          "--nologo",
          "--convert-to",
          "pdf",
          "--outdir",
          outDir,
          inPath,
        ],
        { env: minimalEnv(dir) },
      );
      const out = await readFile(join(outDir, "documento.pdf")).catch(() => null);
      if (!out || out.length === 0) throw new Error("LibreOffice não gerou o PDF");
      return new Uint8Array(out);
    }),
  );
}
