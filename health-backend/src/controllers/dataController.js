const crypto = require('crypto');
const Joi = require('joi');
const mongoose = require('mongoose');
const HealthData = require('../models/HealthData');
const { getCachedRecent, setCachedRecent } = require('../utils/cache');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const healthDataSchema = Joi.object({
	userId: Joi.string().custom((value, helpers) => (isValidObjectId(value) ? value : helpers.error('any.invalid'))).required(),
	timestamp: Joi.date().iso().required(),
	heartRate: Joi.number().min(0).max(300).optional(),
	steps: Joi.number().min(0).optional(),
	calories: Joi.number().min(0).optional(),
	sleepData: Joi.object({
		durationMinutes: Joi.number().min(0).optional(),
		stages: Joi.object({
			light: Joi.number().min(0).optional(),
			deep: Joi.number().min(0).optional(),
			rem: Joi.number().min(0).optional(),
			awake: Joi.number().min(0).optional()
		}).optional()
	}).optional(),
	source: Joi.object({ deviceId: Joi.string().optional(), appVersion: Joi.string().optional() }).optional()
}).or('heartRate', 'steps', 'calories', 'sleepData');

const decryptIfNeeded = (req) => {
	const encrypted = req.headers['x-payload-encrypted'] === '1';
	if (!encrypted) return req.body;
	const ivB64 = req.headers['x-iv'];
	const tagB64 = req.headers['x-auth-tag'];
	const { ciphertext } = req.body || {};
	if (!ivB64 || !tagB64 || !ciphertext) throw new Error('Invalid encrypted payload');
	const iv = Buffer.from(ivB64, 'base64');
	const tag = Buffer.from(tagB64, 'base64');
	const key = Buffer.from(process.env.PAYLOAD_ENC_SECRET, 'hex');
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
	return JSON.parse(decrypted);
};

const syncData = async (req, res) => {
	try {
		const payload = decryptIfNeeded(req);
		const { error, value } = healthDataSchema.validate(payload, { abortEarly: false, stripUnknown: true });
		if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });

		if (req.user.id !== value.userId) return res.status(403).json({ error: 'Forbidden: mismatched userId' });

		const record = await HealthData.create({ ...value });
		const redis = req.app.get('redis');
		await setCachedRecent(redis, value.userId, record);

		const io = req.app.get('io');
		if (io && io.to) io.to(`user:${value.userId}`).emit('health:update', record);

		return res.status(201).json({ success: true, id: record._id.toString() });
	} catch (err) {
		return res.status(400).json({ error: err.message || 'Bad request' });
	}
};

const getRecent = async (req, res) => {
	const userId = req.query.userId && isValidObjectId(req.query.userId) ? req.query.userId : req.user.id;
	if (userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
	const redis = req.app.get('redis');
	const cached = await getCachedRecent(redis, userId);
	if (cached) return res.json({ source: 'cache', data: cached });
	const data = await HealthData.findOne({ userId }).sort({ timestamp: -1 }).lean();
	if (data) await setCachedRecent(redis, userId, data);
	return res.json({ source: data ? 'db' : 'empty', data });
};

const getHistory = async (req, res) => {
	const userId = req.query.userId && isValidObjectId(req.query.userId) ? req.query.userId : req.user.id;
	if (userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
	const page = Math.max(1, parseInt(req.query.page, 10) || 1);
	const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
	const skip = (page - 1) * limit;
	const [items, total] = await Promise.all([
		HealthData.find({ userId }).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
		HealthData.countDocuments({ userId })
	]);
	return res.json({ page, limit, total, items });
};

module.exports = { syncData, getRecent, getHistory };