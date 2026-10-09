FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV PAYLOAD_SECRET=build-only-placeholder-change-in-runtime-32 DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
RUN mkdir -p .data/media && chown -R node:node .data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
