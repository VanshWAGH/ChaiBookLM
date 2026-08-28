FROM node:20-slim AS base
# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 8081
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
