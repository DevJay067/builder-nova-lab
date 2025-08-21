import mongoose, { Schema, Document } from "mongoose";

export interface SleepData {
  durationMinutes?: number;
  qualityScore?: number;
  stages?: {
    rem?: number;
    light?: number;
    deep?: number;
    awake?: number;
  };
}

export interface HealthDataAttrs {
  userId: string;
  timestamp: Date;
  heartRate?: number;
  steps?: number;
  calories?: number;
  sleepData?: SleepData;
}

export interface HealthDataDoc extends Document, HealthDataAttrs {}

const SleepDataSchema = new Schema<SleepData>({
  durationMinutes: { type: Number },
  qualityScore: { type: Number, min: 0, max: 100 },
  stages: {
    rem: { type: Number },
    light: { type: Number },
    deep: { type: Number },
    awake: { type: Number },
  },
}, { _id: false });

const HealthDataSchema = new Schema<HealthDataDoc>({
  userId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  heartRate: { type: Number, min: 0 },
  steps: { type: Number, min: 0 },
  calories: { type: Number, min: 0 },
  sleepData: { type: SleepDataSchema },
}, { timestamps: true });

HealthDataSchema.index({ userId: 1, timestamp: -1 });

export const HealthDataModel = mongoose.models.HealthData || mongoose.model<HealthDataDoc>("HealthData", HealthDataSchema);