const getRecentKey = (userId) => `user:recent:${userId}`;

const getCachedRecent = async (redis, userId) => {
	const key = getRecentKey(userId);
	const value = await redis.get(key);
	return value ? JSON.parse(value) : null;
};

const setCachedRecent = async (redis, userId, payload, ttlSeconds = 600) => {
	const key = getRecentKey(userId);
	await redis.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
};

const clearCachedRecent = async (redis, userId) => {
	const key = getRecentKey(userId);
	await redis.del(key);
};

module.exports = { getCachedRecent, setCachedRecent, clearCachedRecent };