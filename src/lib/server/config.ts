import "server-only";

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Configuração do servidor lida das variáveis de ambiente (ver .env.example). */
export const serverConfig = {
  ghostscriptPath: process.env.GHOSTSCRIPT_PATH || "gs",
  libreofficePath: process.env.LIBREOFFICE_PATH || "soffice",
  maxUploadMb: intEnv("MAX_UPLOAD_MB", 950, 1, 2048),
  jobTimeoutMs: intEnv("JOB_TIMEOUT_SECONDS", 600, 5, 3600) * 1000,
  maxConcurrentJobs: intEnv("MAX_CONCURRENT_JOBS", 2, 1, 64),
  rateLimitPerMinute: intEnv("RATE_LIMIT_PER_MINUTE", 20, 0, 10_000),
  /** Confiar em X-Forwarded-For somente atrás de um proxy reverso conhecido. */
  trustProxy: process.env.TRUST_PROXY === "true",
};

export const maxUploadBytes = () => serverConfig.maxUploadMb * 1024 * 1024;
