const Joi = require('joi');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const signupSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(8).max(128).required(),
	name: Joi.string().max(120).optional()
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(8).max(128).required()
});

const signup = async (req, res) => {
	const { error, value } = signupSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
	if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
	const { email, password, name } = value;

	const existing = await User.findOne({ email });
	if (existing) return res.status(409).json({ error: 'Email already registered' });

	const user = await User.create({ email, password, name });
	const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
	return res.status(201).json({
		token,
		user: { id: user._id.toString(), email: user.email, name: user.name }
	});
};

const login = async (req, res) => {
	const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
	if (error) return res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
	const { email, password } = value;

	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ error: 'Invalid credentials' });
	const ok = await user.comparePassword(password);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

	const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
	return res.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } });
};

module.exports = { signup, login };