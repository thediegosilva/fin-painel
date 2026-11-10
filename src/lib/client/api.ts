export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface UploadResult {
  blob: Blob;
  headers: (name: string) => string | null;
}

/**
 * Envia um formulário com XMLHttpRequest para reportar o progresso do upload,
 * retornando o arquivo processado ou lançando ApiClientError com a mensagem do servidor.
 */
export function postForm(
  url: string,
  form: FormData,
  opts: { onUploadProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "blob";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onUploadProgress?.(e.loaded / e.total);
    };
    xhr.onload = async () => {
      const blob = xhr.response as Blob;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ blob, headers: (n) => xhr.getResponseHeader(n) });
        return;
      }
      let message = "O servidor não conseguiu processar o arquivo.";
      let code: string | undefined;
      try {
        const json = JSON.parse(await blob.text());
        message = json?.error?.message ?? message;
        code = json?.error?.code;
      } catch {
        if (xhr.status === 413) message = "O arquivo é grande demais para o servidor.";
      }
      reject(new ApiClientError(message, xhr.status, code));
    };
    xhr.onerror = () => reject(new ApiClientError("Falha de conexão com o servidor. Verifique sua internet.", 0));
    xhr.ontimeout = () => reject(new ApiClientError("O servidor demorou demais para responder.", 0));
    opts.signal?.addEventListener("abort", () => {
      xhr.abort();
      reject(new ApiClientError("Envio cancelado.", 0, "aborted"));
    });
    xhr.send(form);
  });
}
