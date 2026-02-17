FROM oven/bun:1.3.9-slim AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build && bun run db:gen-client
COPY ./infra/docker/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bun", "run", "start"]
