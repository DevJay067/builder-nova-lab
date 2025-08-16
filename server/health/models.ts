import mongoose, { Schema, model } from "mongoose";

const sleepStageSchema = new Schema(
  {
    light: { type: Number, min: 0 },
    deep: { type: Number, min: 0 },
    rem: { type: Number, min: 0 },
    awake: { type: Number, min: 0 },
  },
  { _id: false }
);

const sleepDataSchema = new Schema(
  {
    durationMinutes: { type: Number, min: 0 },
    stages: { type: sleepStageSchema },
  },
  { _id: false }
);

const sourceSchema = new Schema(
  {
    deviceId: { type: String },
    appVersion: { type: String },
  },
  { _id: false }
);

const healthDataSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    heartRate: { type: Number, min: 0, max: 300 },
    steps: { type: Number, min: 0 },
    calories: { type: Number, min: 0 },
    sleepData: { type: sleepDataSchema },
    source: { type: sourceSchema },
  },
  { timestamps: true }
);
healthDataSchema.index({ userId: 1, timestamp: -1 });

export const HealthData = (mongoose.models.HealthData as mongoose.Model<any>) || model("HealthData", healthDataSchema);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User = (mongoose.models.User as mongoose.Model<any>) || model("User", userSchema);