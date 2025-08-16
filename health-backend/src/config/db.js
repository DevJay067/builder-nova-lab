const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

let memoryServer = null;

const connectMongo = async (uri) => {
	const useMemory = process.env.MONGO_USE_MEMORY === '1' || uri === 'memory';
	if (useMemory) {
		const { MongoMemoryServer } = require('mongodb-memory-server');
		memoryServer = await MongoMemoryServer.create();
		uri = memoryServer.getUri();
	}
	const connection = await mongoose.connect(uri, {
		autoIndex: true,
		serverSelectionTimeoutMS: 5000
	});
	// eslint-disable-next-line no-console
	console.log(`MongoDB connected: ${connection.connection.host}${useMemory ? ' (memory)' : ''}`);
	return connection;
};

const stopMemoryMongo = async () => {
	if (memoryServer) {
		await memoryServer.stop();
		memoryServer = null;
	}
};

module.exports = { connectMongo, stopMemoryMongo };