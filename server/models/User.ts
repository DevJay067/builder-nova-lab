import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);