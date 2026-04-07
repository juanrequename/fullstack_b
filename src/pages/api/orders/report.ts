import { getDBConnection } from "@/database/database";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

const REPORT_QUERY = `
  SELECT
    p.product_id,
    p.model,
    EXTRACT(YEAR FROM o.order_date)::int AS year,
    EXTRACT(MONTH FROM o.order_date)::int AS month,
    s.state_name AS status,
    COUNT(*)::int AS orders_count
  FROM orders o
  JOIN products p ON p.product_id = o.product_id
  LEFT JOIN state_history sh ON sh.order_id = o.order_id AND sh.current_state = true
  LEFT JOIN states s ON s.state_id = sh.state_id
  WHERE o.order_date >= NOW() - INTERVAL '12 months'
  GROUP BY p.product_id, p.model, EXTRACT(YEAR FROM o.order_date), EXTRACT(MONTH FROM o.order_date), s.state_name
  ORDER BY year DESC, month DESC, p.model, s.state_name
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== METHOD.GET) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    const result = await client.query(REPORT_QUERY);
    res.status(RESPONSE_CODES.OK).json(result.rows);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
