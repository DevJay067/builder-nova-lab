const Redis = require('ioredis');

class InMemoryRedis {
	constructor() {
		this.store = new Map();
		this.timeouts = new Map();
	}
	async get(key) {
		return this.store.get(key) || null;
	}
	async set(key, value, mode, ttl) {
		this.store.set(key, value);
		if (mode === 'EX' && typeof ttl === 'number') {
			if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
			this.timeouts.set(key, setTimeout(() => {
				this.store.delete(key);
				this.timeouts.delete(key);
			}, ttl * 1000));
		}
		return 'OK';
	}
	async del(key) {
		this.store.delete(key);
		if (this.timeouts.has(key)) {
			clearTimeout(this.timeouts.get(key));
			this.timeouts.delete(key);
		}
		return 1;
	}
	on() {}
}

const createRedisClient = (url) => {
	const useMemory = process.env.REDIS_USE_MEMORY === '1' || url === 'memory';
	if (useMemory) {
		// eslint-disable-next-line no-console
		console.log('Using in-memory Redis shim');
		return new InMemoryRedis();
	}
	const client = new Redis(url);
	client.on('connect', () => {
		// eslint-disable-next-line no-console
		console.log('Redis connected');
	});
	client.on('error', (err) => {
		// eslint-disable-next-line no-console
		console.error('Redis error', err);
	});
	return client;
};

module.exports = { createRedisClient };