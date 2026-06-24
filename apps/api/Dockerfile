# syntax=docker/dockerfile:1

FROM node:22.23.0-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY packages/shared-config/package.json packages/shared-config/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile --filter @repo/api...

FROM deps AS build
COPY apps/api apps/api
COPY packages packages
RUN pnpm --filter @repo/shared-types build \
  && pnpm --filter @repo/shared-utils build \
  && pnpm --filter @repo/api-client build \
  && pnpm --filter @repo/api exec prisma generate \
  && pnpm --filter @repo/api build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
