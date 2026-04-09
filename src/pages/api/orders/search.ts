import logger from "@/lib/logger";
import * as orderService from "@/services/order.service";
import { searchOrdersSchema } from "@/lib/schemas";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/orders/search:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Search orders
 *     description: Search and filter orders by model, description, tags, date range, and gears.
 *     parameters:
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Exact product model match
 *         example: "GLA"
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Partial description match (case-insensitive)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *         example: "SUV,Mercedes"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date (inclusive)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders before this date (exclusive)
 *         example: "2025-01-01"
 *       - in: query
 *         name: gears
 *         schema:
 *           type: integer
 *         description: Exact gear count match
 *         example: 6
 *     responses:
 *       200:
 *         description: Filtered list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   order_id:
 *                     type: integer
 *                   user:
 *                     type: string
 *                   model:
 *                     type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   order_date:
 *                     type: string
 *                     format: date-time
 *                   current_status_date:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                     enum: [Pending, Shipped, Delivered, Cancelled]
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== METHOD.GET) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const parsed = searchOrdersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: parsed.error.issues.map((e) => e.message).join(", ") });
  }

  const { model, description, tags, startDate, endDate, gears } = parsed.data;

  try {
    const result = await orderService.searchOrders({ model, description, tags, startDate, endDate, gears });
    res.status(RESPONSE_CODES.OK).json(result);
  } catch (error) {
    logger.error({ err: error }, "Error searching orders");
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  }
}
