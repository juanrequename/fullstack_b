import { getDBConnection } from "@/database/database";
import { NextApiRequest, NextApiResponse } from "next";

const ORDERS_QUERY = `
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
  GROUP BY o.order_id, u.name, p.model, o.order_date, sh.change_date, s.state_name
  ORDER BY o.order_id
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    const result = await client.query(ORDERS_QUERY);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
