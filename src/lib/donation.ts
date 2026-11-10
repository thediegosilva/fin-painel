import { buildPixPayload } from "./pix";

/** Dados de recebimento das doações via Pix (chave aleatória). */
export const PIX = {
  key: "d30c1d05-eef8-49d3-968b-5c0e6ae41d29",
  name: "Diego Oliveira da Silva",
  city: "Rio de Janeiro",
} as const;

export const PIX_PAYLOAD = buildPixPayload(PIX);
