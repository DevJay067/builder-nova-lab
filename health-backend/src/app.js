require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const { connectMongo } = require('./config/db');
const { createRedisClient } = require('./config/redis');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'];

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

let initialized = false;
let initializePromise = null;

const initializeApp = async (expressApp = app) => {
	if (initialized) return;
	if (initializePromise) return initializePromise;
	initializePromise = (async () => {
		const useMemoryMongo = process.env.MONGO_USE_MEMORY === '1';
		const mongoUri = process.env.MONGO_URI;
		if (!mongoUri && !useMemoryMongo) {
			throw new Error('MONGO_URI not set. Provide a MongoDB connection string (e.g., Atlas). For local only, set MONGO_USE_MEMORY=1.');
		}
		await connectMongo(useMemoryMongo ? 'memory' : mongoUri);

		const useMemoryRedis = process.env.REDIS_USE_MEMORY === '1';
		const redisUrl = process.env.REDIS_URL;
		const redis = createRedisClient(useMemoryRedis ? 'memory' : redisUrl);
		expressApp.set('redis', redis);
		initialized = true;
	})();
	return initializePromise;
};

module.exports = { app, initializeApp };