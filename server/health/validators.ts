import Joi from "joi";

export const healthDataSchema = Joi.object({
  userId: Joi.string().required(),
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
      awake: Joi.number().min(0).optional(),
    }).optional(),
  }).optional(),
  source: Joi.object({ deviceId: Joi.string().optional(), appVersion: Joi.string().optional() }).optional(),
}).or("heartRate", "steps", "calories", "sleepData");

export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().max(120).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
});