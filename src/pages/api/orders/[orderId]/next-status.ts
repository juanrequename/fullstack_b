import logger from "@/lib/logger";
import * as orderService from "@/services/order.service";
import { orderIdSchema } from "@/lib/schemas";
import CustomError, { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/orders/{orderId}/next-status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Advance order status
 *     description: Updates an order's status to the next state in the progression (Pending -> Shipped -> Delivered). Cannot advance from Delivered or Cancelled.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_id:
 *                   type: integer
 *                   example: 1
 *                 new_status:
 *                   type: string
 *                   enum: [Shipped, Delivered]
 *                   example: "Shipped"
 *       400:
 *         description: Invalid order ID or cannot advance from current status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Order not found
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== METHOD.PATCH) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const parsed = orderIdSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: parsed.error.issues.map((e) => e.message).join(", ") });
  }

  const { orderId } = parsed.data;

  try {
    const result = await orderService.advanceOrderStatus(orderId);
    res.status(RESPONSE_CODES.OK).json(result);
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.code).json({ error: error.message });
    } else {
      logger.error({ err: error }, "Error updating order status");
      res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
  }
}
