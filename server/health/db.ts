import mongoose from "mongoose";

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = (global as any)._mongoCached || { conn: null, promise: null };

export async function connectMongo(uri?: string) {
  const mongoUri = uri || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI not set");

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      dbName: process.env.MONGO_DB || undefined,
    });
  }
  cached.conn = await cached.promise;
  (global as any)._mongoCached = cached;
  return cached.conn;
}