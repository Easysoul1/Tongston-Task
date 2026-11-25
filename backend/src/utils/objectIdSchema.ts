import mongoose from 'mongoose';

export function objectIdSchemaValidator(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(val);
}
