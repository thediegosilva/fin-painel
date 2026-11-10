# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# FIN-Painel — imagem de produção (Next.js standalone + Ghostscript)
#   docker build -t fin-painel .
#   docker build -t fin-painel --build-arg WITH_LIBREOFFICE=true .   # + Office→PDF
#   docker run -p 3000:3000 -e NEXT_PUBLIC_SITE_URL=https://seu-dominio fin-painel
# -----------------------------------------------------------------------------

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
ARG WITH_LIBREOFFICE=false
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Ghostscript: comprimir, proteger e desbloquear. LibreOffice (opcional): Office→PDF.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ghostscript fonts-dejavu-core \
 && if [ "$WITH_LIBREOFFICE" = "true" ]; then \
      apt-get install -y --no-install-recommends libreoffice-writer libreoffice-calc libreoffice-impress fonts-liberation; \
    fi \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app --home /app app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
