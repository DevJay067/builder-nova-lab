import mongoose from "mongoose";

let isConnected = false;

export async function connectMongo(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  } as any);

  isConnected = true;
  mongoose.connection.on("disconnected", () => {
    isConnected = false;
  });

  return mongoose;
}

export function getMongoConnectionState(): string {
  const states: any = mongoose.ConnectionStates || (mongoose as any).STATES;
  const stateIndex = mongoose.connection.readyState;
  if (!states) return String(stateIndex);
  const stateName = Object.keys(states).find((k) => states[k] === stateIndex);
  return stateName || String(stateIndex);
}