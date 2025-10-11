import { z } from 'zod';

export const fileUploadSchemas = {
  // Params schemas
  userIdParams: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),

  fileMetadataParams: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    filename: z.string().min(1, 'Filename is required'),
  }),

  // Body schemas
  bulkDeleteFiles: z.object({
    body: z.object({
      filenames: z.array(z.string().min(1, 'Filename is required')).min(1, 'At least one filename is required'),
    }),
    params: z.object({
      userId: z.string().uuid('Invalid user ID format'),
    }),
  }),
};