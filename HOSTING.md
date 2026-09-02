# Hosting SMX KITS

The app is a single Node.js server (`server.js`) that serves the frontend,
REST API, and Socket.IO on one port. It uses MongoDB when `MONGO_URI` is
reachable and automatically falls back to a non-persistent in-memory demo
store when it isn't.

## Environment variables

| Variable     | Required | Description                                                                 |
|--------------|----------|-----------------------------------------------------------------------------|
| `PORT`       | no       | Port to listen on (default `5000`). Hosting platforms usually set this.     |
| `MONGO_URI`  | no       | MongoDB connection string. Without it, data is lost on every restart.       |
| `JWT_SECRET` | yes*     | Secret for signing auth tokens. *Falls back to an insecure default — always set it in production (`openssl rand -hex 32`). |

Health check: `GET /health` returns `200` with `{"status":"ok","db":"mongodb"|"in-memory"}`.

Default demo accounts (created on first boot): `admin/admin123`,
`instructor/instructor123`, `student/student123`. Change these passwords
immediately on any internet-facing deployment.

## Option 1 — Docker Compose (self-hosted, recommended)

Everything (app + MongoDB + nginx reverse proxy) in one command:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

Then open `http://localhost` (nginx on port 80, or the app directly on 5000).
MongoDB data, uploads, and submissions persist in named Docker volumes.

## Option 2 — Render (free cloud hosting)

The repo includes `render.yaml` as a Blueprint:

1. Create a free MongoDB Atlas cluster and copy its connection string.
2. On [render.com](https://render.com): **New → Blueprint**, point it at this
   repository. `JWT_SECRET` is generated automatically.
3. Set `MONGO_URI` to the Atlas connection string when prompted (skipping it
   works, but runs the non-persistent demo store — free-tier instances also
   restart on idle, wiping in-memory data).

Note: uploaded files are ephemeral on Render's free tier; use a paid plan
with a persistent disk mounted at `/opt/render/project/src/uploads` if
uploads must survive deploys.

## Option 3 — Bare Node.js (VPS, on-prem)

```bash
npm install
cp .env.example .env   # then edit MONGO_URI and JWT_SECRET
npm start              # or: npx pm2 start server.js --name smxkits
```

Requires Node.js ≥ 18 and (optionally) a local MongoDB at
`mongodb://localhost:27017/smxkits`.
