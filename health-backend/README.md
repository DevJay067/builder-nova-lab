## Healthcare Backend (Node.js + Express)

Production-ready backend for syncing wearable IoT watch health data via mobile (BLE → phone → backend). Includes MongoDB, JWT auth, Socket.io real-time updates, Redis caching, input validation/sanitization, and optional application-layer encryption of request bodies.

### Tech Stack
- Node.js 18+, Express 4
- MongoDB (Mongoose)
- JWT authentication
- Socket.io for real-time updates
- Redis (ioredis) for caching
- Security: Helmet, rate limiting, CORS, HPP, Mongo sanitize, XSS clean
- Validation: Joi

---

### Quick Start
1) Prereqs: Node 18+.
   - Optional: Docker for real MongoDB/Redis

2) Clone and setup env
```bash
cp .env.sample .env
# Edit .env as needed
```

3) Choose backend stores
- Without Docker (recommended for quick demo): set `MONGO_USE_MEMORY=1` and `REDIS_USE_MEMORY=1` in `.env`
- With Docker: run `docker compose up -d` and keep `MONGO_USE_MEMORY=0`, `REDIS_USE_MEMORY=0`

4) Install and run
```bash
npm install
npm run dev
# or
npm start
```

Health check: GET http://localhost:${PORT}/health (default PORT 4000)

---

### Environment Variables (.env)
- PORT: default 4000
- MONGO_URI: e.g. mongodb://localhost:27017/health
- REDIS_URL: e.g. redis://localhost:6379
- JWT_SECRET: strong secret
- JWT_EXPIRES_IN: e.g. 7d
- CORS_ORIGIN: frontend origins, comma-separated (e.g., http://localhost:3000)
- PAYLOAD_ENC_SECRET: 32-byte (64 hex chars) secret for optional AES-256-GCM payload encryption

---

### Authentication
- POST /api/auth/signup { email, password, name? }
- POST /api/auth/login { email, password }

Response example:
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "email": "john@example.com", "name": "John" }
}
```
Send `Authorization: Bearer <jwt>` for protected endpoints and Socket.io connection.

---

### Data APIs
- POST /api/data/sync
  - Auth: Bearer token
  - Body JSON: { userId, timestamp, heartRate?, steps?, calories?, sleepData? }
  - On success: stores to MongoDB, pushes to Redis cache, emits websocket event

- GET /api/data/recent
  - Auth: Bearer token
  - Query: userId? (defaults to token user)
  - Returns last data point (cached in Redis)

- GET /api/data/history
  - Auth: Bearer token
  - Query: userId?, page?, limit?
  - Returns paginated historical data

#### Examples
Signup:
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123!","name":"John"}'
```

Login:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123!"}'
# => { token, user }
```

Sync data:
```bash
curl -X POST http://localhost:4000/api/data/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<USER_ID>",
    "timestamp": "2025-01-01T10:00:00.000Z",
    "heartRate": 76,
    "steps": 1543,
    "calories": 120.5
  }'
```

Recent:
```bash
curl -X GET 'http://localhost:4000/api/data/recent?userId=<USER_ID>' \
  -H "Authorization: Bearer $TOKEN"
```

History:
```bash
curl -X GET 'http://localhost:4000/api/data/history?userId=<USER_ID>&page=1&limit=50' \
  -H "Authorization: Bearer $TOKEN"
```

Response example (recent):
```json
{
  "source": "db",
  "data": {
    "_id": "...",
    "userId": "...",
    "timestamp": "2025-01-01T10:00:00.000Z",
    "heartRate": 76,
    "steps": 1543,
    "calories": 120.5,
    "sleepData": { "durationMinutes": 420, "stages": { "light": 240, "deep": 120, "rem": 60, "awake": 0 } },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```