# Build from the repository root: docker build -f backend/Dockerfile .
# The API stays in one Node process; bounded worker threads calculate 3MF exports.
FROM node:24.20.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json tsconfig.build.json ./
COPY packages/contracts/package.json packages/contracts/tsconfig.json ./packages/contracts/
COPY packages/domain/package.json packages/domain/tsconfig.json ./packages/domain/
COPY packages/exporter/package.json packages/exporter/tsconfig.json ./packages/exporter/
COPY packages/storage/package.json packages/storage/tsconfig.json ./packages/storage/
COPY packages/devices/package.json packages/devices/tsconfig.json ./packages/devices/
COPY packages/host/package.json packages/host/tsconfig.json ./packages/host/
COPY apps/local/package.json apps/local/tsconfig.json ./apps/local/
COPY apps/server/package.json apps/server/tsconfig.json ./apps/server/
COPY tooling/package.json tooling/tsconfig.json ./tooling/
RUN npm ci
COPY packages/contracts/src ./packages/contracts/src
COPY packages/domain/src ./packages/domain/src
COPY packages/exporter/src ./packages/exporter/src
COPY packages/storage/src ./packages/storage/src
COPY packages/devices/src ./packages/devices/src
COPY packages/host/src ./packages/host/src
COPY apps/local/src ./apps/local/src
COPY apps/server/src ./apps/server/src
COPY tooling/src ./tooling/src
RUN npm run build && npm prune --omit=dev

FROM node:24.20.0-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8876 \
    DUCK_DB=/data/doodleduck.db DUCK_ASSETS=/assets
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=build /app/packages/domain/dist ./packages/domain/dist
COPY --from=build /app/packages/exporter/package.json ./packages/exporter/package.json
COPY --from=build /app/packages/exporter/dist ./packages/exporter/dist
COPY --from=build /app/packages/storage/package.json ./packages/storage/package.json
COPY --from=build /app/packages/storage/dist ./packages/storage/dist
COPY --from=build /app/packages/devices/package.json ./packages/devices/package.json
COPY --from=build /app/packages/devices/dist ./packages/devices/dist
COPY --from=build /app/packages/host/package.json ./packages/host/package.json
COPY --from=build /app/packages/host/dist ./packages/host/dist
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/tooling/package.json ./tooling/package.json
COPY --from=build /app/tooling/dist/migrate-database.js ./tooling/dist/migrate-database.js
COPY LICENSE THIRD_PARTY_NOTICES.md ./
RUN groupadd --system --gid 10001 duck \
    && useradd --system --uid 10001 --gid 10001 --home-dir /data --no-create-home duck \
    && mkdir -p /data /assets && chown duck:duck /data
USER 10001:10001
VOLUME ["/data"]
EXPOSE 8876
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD ["node", "--input-type=module", "-e", "const r=await fetch('http://127.0.0.1:'+process.env.PORT+'/api/health',{signal:AbortSignal.timeout(2000)});if(r.status!==200)process.exit(1)"]
CMD ["node", "apps/server/dist/main.js"]
