import { z } from "zod";

export const createProductSchema = z.object({
  model: z.string().min(1, "model is required"),
  description: z.string().min(1, "description is required"),
  year: z.coerce.number().int().min(1900).max(2100),
  gears: z.coerce.number().int().min(1).max(20),
  tags: z.array(z.string()).optional(),
});

export const searchOrdersSchema = z.object({
  model: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format")
    .optional(),
  gears: z
    .string()
    .regex(/^\d+$/, "gears must be a positive integer")
    .optional(),
});

export const orderIdSchema = z.object({
  orderId: z
    .string()
    .regex(/^\d+$/, "orderId must be a positive integer")
    .transform(Number),
});

export const ordersPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
