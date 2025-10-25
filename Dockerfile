FROM oven/bun:1.3.0 AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.3.0

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/email-templates ./dist/email-templates
COPY --from=builder /app/public ./public

CMD ["bun", "dist/src/entry.js", "start"]
