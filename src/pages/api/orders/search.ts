import { getDBConnection } from "@/database/database";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
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

  const query = `
    SELECT
      o.order_id,
      u.name AS user,
      p.model,
      COALESCE(
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
        '{}'
      ) AS tags,
      o.order_date,
      sh.change_date AS current_status_date,
      s.state_name AS status
    FROM orders o
    JOIN users u ON u.user_id = o.user_id
    JOIN products p ON p.product_id = o.product_id
    LEFT JOIN products_tags pt ON pt.product_id = p.product_id
    LEFT JOIN tags t ON t.tag_id = pt.tag_id
    LEFT JOIN state_history sh ON sh.order_id = o.order_id AND sh.current_state = true
    LEFT JOIN states s ON s.state_id = sh.state_id
    ${whereClause}
    GROUP BY o.order_id, u.name, p.model, o.order_date, sh.change_date, s.state_name
    ORDER BY o.order_id
  `;

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error searching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
