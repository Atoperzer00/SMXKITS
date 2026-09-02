FROM node:20-alpine

WORKDIR /app

# Install production dependencies first so the layer is cached
# independently of application code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Uploaded videos and student submissions are written at runtime;
# mount volumes over these paths to persist them across restarts.
RUN mkdir -p uploads submissions

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:${PORT:-5000}/health || exit 1

CMD ["node", "server.js"]
