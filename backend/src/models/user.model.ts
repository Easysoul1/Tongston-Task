import mongoose, { Schema, model, Document } from 'mongoose';

export type UserRole = 'ADMIN' | 'USER';

export interface IUser extends Document {
  email: string;
  role: UserRole;
  tokenBalance: number;
  firebaseUid?: string;
  createdAt: Date;
  password?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema({
  email: { type: String, required: true, lowercase: true },
  role: { type: String, required: true, enum: ['ADMIN', 'USER'], default: 'USER' },
  tokenBalance: { type: Number, required: true, default: 0 },
  firebaseUid: { type: String, sparse: true },
  password: { type: String, select: false },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);