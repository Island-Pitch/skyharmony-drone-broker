FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/db/seed.ts ./src/db/seed.ts
COPY --from=build /app/node_modules/.drizzle ./node_modules/.drizzle 2>/dev/null || true
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1
CMD ["node", "dist/index.js"]
