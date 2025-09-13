# Deployment Handoff (API + Client + Live Sessions)

This app runs on Node.js (Express + Socket.IO) with MongoDB. Single server works; scale later with Redis.

## 1) Server prerequisites
- Node.js LTS
- MongoDB connection (MongoDB Atlas recommended)
- (Optional later) Redis for scaling live sessions across multiple instances

## 2) Environment (.env)
- PORT=5000
- MONGO_URI=...
- JWT_SECRET=...
- CORS_ORIGIN=https://your-domain.com
- UPLOADS_DIR=/srv/madrassa-play/uploads
- SCAN_UPLOADS=false
- (Later, for scale) REDIS_URL=redis://...

## 3) Start API with PM2
- pm2 start server/server.js --name madrassa-api
- NODE_ENV=production

## 4) Nginx (core)
- Serve client build at /
- Proxy /api to Node (http://127.0.0.1:5000)
- Proxy /socket.io with WebSocket upgrade
- Serve /uploads from disk or proxy via Node

## 5) Client
- Build with Vite (npm run build) and copy dist/ to web root

## 6) Scaling (when needed)
- Run multiple Node instances (PM2 cluster or multiple VMs/containers)
- Add Redis and socket.io-redis adapter
- Enable sticky sessions on load balancer
- Move uploads to shared storage (S3) or shared volume

## 7) Health & Monitoring
- GET /api/health should return 200
- Use PM2 logs; add Sentry for error tracking (optional)

This setup requires no code changes for a single server; add Redis + shared storage only when scaling.