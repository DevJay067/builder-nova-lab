const mongoose = require('mongoose');

const sleepStageSchema = new mongoose.Schema(
	{
		light: { type: Number, min: 0 },
		deep: { type: Number, min: 0 },
		rem: { type: Number, min: 0 },
		awake: { type: Number, min: 0 }
	},
	{ _id: false }
);

const sleepDataSchema = new mongoose.Schema(
	{
		durationMinutes: { type: Number, min: 0 },
		stages: { type: sleepStageSchema }
	},
	{ _id: false }
);

const sourceSchema = new mongoose.Schema(
	{
		deviceId: { type: String },
		appVersion: { type: String }
	},
	{ _id: false }
);

const healthDataSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		timestamp: { type: Date, required: true, index: true },
		heartRate: { type: Number, min: 0, max: 300 },
		steps: { type: Number, min: 0 },
		calories: { type: Number, min: 0 },
		sleepData: { type: sleepDataSchema },
		source: { type: sourceSchema }
	},
	{ timestamps: true }
);

healthDataSchema.index({ userId: 1, timestamp: -1 });

const HealthData = mongoose.model('HealthData', healthDataSchema);
module.exports = HealthData;