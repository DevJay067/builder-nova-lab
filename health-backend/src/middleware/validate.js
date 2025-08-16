const validate = (schema, property = 'body') => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
		if (error) {
			return res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
		}
		req[property] = value;
		return next();
	};
};

module.exports = { validate };