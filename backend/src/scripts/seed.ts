import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { connectDB, disconnectDB } from '../config/db.js';

const seed = async () => {
  await connectDB();
  await User.deleteMany({});

  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  await User.insertMany([
    { email: 'admin@test.com', password: adminHash, role: 'ADMIN' },
    { email: 'user@test.com', password: userHash, role: 'USER' },
  ]);
  console.log('Seeded: admin@test.com / admin123 and user@test.com / user123');
  await disconnectDB();
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});