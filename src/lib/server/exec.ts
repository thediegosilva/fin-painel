import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serverConfig } from "./config";

export class ExecError extends Error {
  constructor(
    message: string,
    readonly stderr: string,
    readonly timedOut: boolean,
  ) {
    super(message);
    this.name = "ExecError";
  }
}

/** Ambiente mínimo para processos filhos: não repassa segredos do servidor. */
export function minimalEnv(home: string): NodeJS.ProcessEnv {
  return { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: home, LANG: "C.UTF-8" } as unknown as NodeJS.ProcessEnv;
}

/**
 * Executa um binário SEM shell (argumentos em array, imunes a injeção),
 * com timeout e limite de saída.
 */
export function run(
  file: string,
  args: string[],
  opts: { timeoutMs?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      {
        timeout: opts.timeoutMs ?? serverConfig.jobTimeoutMs,
        killSignal: "SIGKILL",
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
        env: opts.env ?? minimalEnv(tmpdir()),
      },
      (err, stdout, stderr) => {
        if (err) {
          const timedOut = (err as NodeJS.ErrnoException & { killed?: boolean }).killed === true;
          reject(new ExecError(err.message, String(stderr ?? ""), timedOut));
          return;
        }
        resolve({ stdout: String(stdout), stderr: String(stderr) });
      },
    );
  });
}

/** Cria um diretório temporário exclusivo e garante sua remoção ao final. */
export async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "finpainel-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Limite de concorrência (por instância)
// ---------------------------------------------------------------------------

let active = 0;
const queue: Array<() => void> = [];

export class BusyError extends Error {
  constructor() {
    super("Servidor ocupado");
    this.name = "BusyError";
  }
}

/** Executa `fn` respeitando MAX_CONCURRENT_JOBS; enfileira no máximo 4× esse valor. */
export async function withJobSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= serverConfig.maxConcurrentJobs) {
    if (queue.length >= serverConfig.maxConcurrentJobs * 4) throw new BusyError();
    await new Promise<void>((resolve) => queue.push(resolve));
  } else {
    active++;
  }
  try {
    return await fn();
  } finally {
    const next = queue.shift();
    if (next) next();
    else active--;
  }
}
