import logger from "@/config/logger";
import * as orderService from "@/services/order.service";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/orders/report:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get sales report
 *     description: Generates a sales report for the last 12 months, grouped by product, year, month, and status.
 *     responses:
 *       200:
 *         description: Sales report data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product_id:
 *                     type: integer
 *                     example: 1
 *                   model:
 *                     type: string
 *                     example: "GLA"
 *                   year:
 *                     type: integer
 *                     example: 2024
 *                   month:
 *                     type: integer
 *                     example: 11
 *                   status:
 *                     type: string
 *                     enum: [Pending, Shipped, Delivered, Cancelled]
 *                   orders_count:
 *                     type: integer
 *                     example: 5
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== METHOD.GET) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  try {
    const result = await orderService.getReport();
    res.status(RESPONSE_CODES.OK).json(result);
  } catch (error) {
    logger.error({ err: error }, "Error generating report");
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  }
}
