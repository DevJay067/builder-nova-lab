const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
	try {
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.substring(7) : null;
		if (!token) return res.status(401).json({ error: 'Unauthorized' });
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: payload.id, email: payload.email, role: payload.role || 'user' };
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Unauthorized' });
	}
};

module.exports = { authenticate };