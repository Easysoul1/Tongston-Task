import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ContentItem } from '../models/content.model.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, successCreated } from '../utils/response.js';
import { z } from 'zod';
import { createContentSchema, listContentQuerySchema } from '../schemas/common.schema.js';

type CreateContentInput = z.infer<typeof createContentSchema>;
type ListContentQuery = z.infer<typeof listContentQuerySchema>;

export const ContentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { title, body, tags } = req.body as CreateContentInput;

    const userId = req.user!.id;
    const content = await ContentItem.create({ title, body, tags: tags || [], createdBy: new Types.ObjectId(userId) });
    return successCreated(res, { id: content._id.toString(), title: content.title, body: content.body, tags: content.tags, createdAt: content.createdAt });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { tag, q, page, limit } = req.query as unknown as ListContentQuery;

    const filter: any = {};
    if (tag) filter.tags = tag;
    if (q) filter.$text = { $search: q };

    const [data, total] = await Promise.all([
      ContentItem.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContentItem.countDocuments(filter),
    ]);

    const items = data.map((item) => ({ ...item, id: item._id.toString() }));

    return success(res, { data: items, pagination: { page, pageSize: limit, totalItems: total, totalPages: Math.ceil(total / limit) } });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const content = await ContentItem.findById(req.params.id).populate('mediaAssets').lean();
    if (!content) throw AppError.notFound('Content');
    return success(res, { ...content, id: content._id.toString() });
  }),
};
