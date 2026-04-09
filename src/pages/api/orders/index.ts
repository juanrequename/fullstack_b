import logger from "@/config/logger";
import * as orderService from "@/services/order.service";
import { ordersPaginationSchema } from "@/lib/schemas";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders
 *     description: Returns a list of all orders with user, product, tags, and current status information.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   order_id:
 *                     type: integer
 *                     example: 1
 *                   user:
 *                     type: string
 *                     example: "Alice Johnson"
 *                   model:
 *                     type: string
 *                     example: "GLA"
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["SUV", "Mercedes"]
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
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== METHOD.GET) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const parsed = ordersPaginationSchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return res
      .status(RESPONSE_CODES.BAD_REQUEST)
      .json({ error: parsed.error.issues.map(e => e.message).join(", ") });
  }

  const { page, limit } = parsed.data;

  try {
    const result = await orderService.getOrders({ page, limit });
    res.status(RESPONSE_CODES.OK).json(result);
  } catch (error) {
    logger.error({ err: error }, "Error fetching orders");
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  }
}
