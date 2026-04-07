import { getDBConnection } from "@/database/database";
import { ORDERS_BASE_QUERY, ORDERS_GROUP_ORDER } from "@/database/queries";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== METHOD.GET) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const { model, description, tags, startDate, endDate, gears } = req.query;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (model) {
    conditions.push(`p.model = $${paramIndex++}`);
    params.push(String(model));
  }

  if (description) {
    conditions.push(`p.description ILIKE $${paramIndex++}`);
    params.push(`%${String(description)}%`);
  }

  if (tags) {
    const tagList = String(tags).split(",").map((t) => t.trim());
    conditions.push(
      `EXISTS (
        SELECT 1 FROM products_tags pt2
        JOIN tags t2 ON t2.tag_id = pt2.tag_id
        WHERE pt2.product_id = p.product_id
        AND t2.name = ANY($${paramIndex++}::text[])
      )`
    );
    params.push(tagList as unknown as string);
  }

  if (startDate) {
    conditions.push(`o.order_date >= $${paramIndex++}`);
    params.push(String(startDate));
  }

  if (endDate) {
    conditions.push(`o.order_date < $${paramIndex++}`);
    params.push(String(endDate));
  }

  if (gears) {
    conditions.push(`p.gears = $${paramIndex++}`);
    params.push(Number(gears));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `${ORDERS_BASE_QUERY}
    ${whereClause}${ORDERS_GROUP_ORDER}`;

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    res.status(RESPONSE_CODES.OK).json(result.rows);
  } catch (error) {
    console.error("Error searching orders:", error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
