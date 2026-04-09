import logger from "@/lib/logger";
import * as productService from "@/services/product.service";
import { createProductSchema } from "@/lib/schemas";
import CustomError, { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product
 *     description: Creates a new product with optional tags. The description is validated against an external album API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *               - description
 *               - year
 *               - gears
 *             properties:
 *               model:
 *                 type: string
 *                 description: Product model name
 *                 example: "GLA"
 *               description:
 *                 type: string
 *                 description: Must match an album title from jsonplaceholder API
 *                 example: "quidem molestiae enim"
 *               year:
 *                 type: integer
 *                 description: Model year
 *                 example: 2024
 *               gears:
 *                 type: integer
 *                 description: Number of gears
 *                 example: 6
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional list of tags
 *                 example: ["SUV", "Mercedes"]
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product_id:
 *                   type: integer
 *                   example: 13
 *                 model:
 *                   type: string
 *                 description:
 *                   type: string
 *                 year:
 *                   type: integer
 *                 gears:
 *                   type: integer
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing required fields or invalid description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== METHOD.POST) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: parsed.error.issues.map((e) => e.message).join(", ") });
  }

  const { model, description, year, gears, tags } = parsed.data;

  try {
    const result = await productService.createProduct({ model, description, year, gears, tags });
    res.status(RESPONSE_CODES.CREATED).json(result);
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.code).json({ error: error.message });
    } else {
      logger.error({ err: error }, "Error creating product");
      res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
  }
}
