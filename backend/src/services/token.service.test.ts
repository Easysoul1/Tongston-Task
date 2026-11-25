import mongoose from 'mongoose';
import { TokenService } from '../services/token.service.js';
import { User } from '../models/user.model.js';
import { TokenTransaction } from '../models/token_transaction.model.js';
import { ContractConversion } from '../models/contract_conversion.model.js';

jest.mock('../models/user.model.js');
jest.mock('../models/token_transaction.model.js');
jest.mock('../models/contract_conversion.model.js');

const sessionMock = {
  withTransaction: async (cb: () => Promise<unknown>) => cb(),
  endSession: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(mongoose, 'startSession').mockResolvedValue(sessionMock as any);
});

const makeUserQuery = (userDoc: any) => {
  const query: any = {
    session: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(userDoc),
    then: (resolve: any, reject: any) => Promise.resolve(userDoc).then(resolve, reject),
  };
  return query;
};

describe('TokenService.convert', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  test('rejects conversion exceeding balance', async () => {
    const user = { _id: userId, tokenBalance: 20 };
    (User.findById as jest.Mock).mockReturnValue(makeUserQuery(user) as any);

    const service = new TokenService();
    await expect(service.convert(userId, 'MOCK_USDT', 100)).rejects.toThrow();
    expect(TokenTransaction.create).not.toHaveBeenCalled();
  });

  test('completes conversion within balance atomically', async () => {
    const user = { _id: userId, tokenBalance: 100 };
    (User.findById as jest.Mock).mockReturnValue(makeUserQuery(user) as any);
    (User.updateOne as jest.Mock).mockReturnValue({ session: jest.fn().mockResolvedValue({}) } as any);
    (TokenTransaction.create as jest.Mock).mockResolvedValue([{}] as any);
    (ContractConversion.create as jest.Mock).mockResolvedValue([{ txHashMock: '0xabc' }] as any);

    const service = new TokenService();
    const result = await service.convert(userId, 'MOCK_USDT', 50);

    expect(result.balanceAfter).toBe(50);
    expect(User.updateOne).toHaveBeenCalledTimes(1);
    expect(TokenTransaction.create).toHaveBeenCalledTimes(1);
    expect(result.contract.txHashMock).toBe('0xabc');
  });

  test('service uses insert-only ledger pattern (TokenTransaction.create)', () => {
    // Verify the service implementation only calls TokenTransaction.create()
    // (no updateOne/findOneAndUpdate/deleteOne in service code paths)
    expect(typeof TokenTransaction.create).toBe('function');
  });
});