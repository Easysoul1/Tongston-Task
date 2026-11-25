import { Request, Response } from 'express';
import { TokenService } from '../services/token.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { z } from 'zod';
import { convertBodySchema, paginationQuerySchema, withdrawBodySchema } from '../schemas/common.schema.js';

type ConvertInput = z.infer<typeof convertBodySchema>;
type WithdrawInput = z.infer<typeof withdrawBodySchema>;
type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const TokenController = {
  balance: asyncHandler(async (req: Request, res: Response) => {
    const balance = await new TokenService().getBalance(req.user!.id);
    return success(res, { balance });
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const { data, pagination } = await new TokenService().getHistory(req.user!.id, page, limit);
    return success(res, { data, pagination });
  }),

  convert: asyncHandler(async (req: Request, res: Response) => {
    const { toAsset, amount } = req.body as ConvertInput;
    const result = await new TokenService().convert(req.user!.id, toAsset, amount);
    return success(res, { txHashMock: result.contract.txHashMock, balanceAfter: result.balanceAfter, contract: result.contract });
  }),

  withdraw: asyncHandler(async (req: Request, res: Response) => {
    const { amount, destination } = req.body as WithdrawInput;
    const result = await new TokenService().withdraw(req.user!.id, amount, destination);
    return success(res, {
      status: 'confirmed',
      balanceAfter: result.balanceAfter,
      destination: result.destination,
      txHashMock: result.txHashMock,
    });
  }),
};
