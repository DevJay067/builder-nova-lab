const serverless = require('serverless-http');
const express = require('express');
const { app, initializeApp } = require('../../src/app');

const gateway = express();
let initPromise = null;

const ensureInit = async () => {
	if (!initPromise) initPromise = initializeApp(app);
	return initPromise;
};

// Initialize before routing
gateway.use('/.netlify/functions/api', async (req, res, next) => {
	try {
		await ensureInit();
		return next();
	} catch (err) {
		return next(err);
	}
});

// Mount the app under Netlify function base path
gateway.use('/.netlify/functions/api', app);

module.exports.handler = serverless(gateway);