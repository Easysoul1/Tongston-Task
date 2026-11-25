import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import { signToken } from '../middleware/authenticate.js';
import { successCreated, success } from '../utils/response.js';
import bcrypt from 'bcryptjs';
import { loginBodySchema, registerBodySchema } from '../schemas/common.schema.js';

type RegisterInput = z.infer<typeof registerBodySchema>;
type LoginInput = z.infer<typeof loginBodySchema>;

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as RegisterInput;

    const existing = await User.findOne({ email });
    if (existing) throw AppError.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ email, password: passwordHash, role: 'USER' });

    return successCreated(res, {
      token: signToken({ id: user._id.toString(), role: user.role }),
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenBalance: user.tokenBalance,
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginInput;

    const user = await User.findOne({ email }).select('+password');

    if (!user) throw AppError.unauthorized('Invalid credentials');

    const match = await bcrypt.compare(password, user.password!);

    if (!match) throw AppError.unauthorized('Invalid credentials');

    const token = signToken({ id: user._id.toString(), role: user.role });
    return success(res, {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenBalance: user.tokenBalance,
      },
    });
  }),
};
