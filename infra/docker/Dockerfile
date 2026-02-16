##### BUILD #####

FROM oven/bun:1.3.9 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build && bun run db:gen-client


##### RUN #####

FROM base AS runner
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/generated ./generated
COPY ./infra/docker/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bun", "run", "start:dev"]
