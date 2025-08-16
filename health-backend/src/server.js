require('dotenv').config();

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const { connectMongo } = require('./config/db');
const { createRedisClient } = require('./config/redis');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'];
const io = new Server(server, {
	cors: { origin: allowedOrigins, credentials: true }
});

app.set('io', io);

io.use((socket, next) => {
	try {
		const authorization = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
		if (!authorization) return next(new Error('Unauthorized'));
		const token = authorization.startsWith('Bearer ') ? authorization.split(' ')[1] : authorization;
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		socket.user = payload;
		socket.join(`user:${payload.id}`);
		return next();
	} catch (err) {
		return next(new Error('Unauthorized'));
	}
});

io.on('connection', () => {
	// Connected sockets join their user room in the middleware above
});

// Security & parsing middlewares
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '256kb' }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());
app.use(compression());

// Rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Global error handler
app.use((err, req, res, next) => {
	// eslint-disable-next-line no-console
	console.error(err);
	return res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

(async () => {
	await connectMongo(process.env.MONGO_URI || 'mongodb://localhost:27017/health');
	const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
	app.set('redis', redis);

	const PORT = process.env.PORT || 4000;
	server.listen(PORT, () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on port ${PORT}`);
	});
})().catch((err) => {
	// eslint-disable-next-line no-console
	console.error('Startup failed', err);
	process.exit(1);
});