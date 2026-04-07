import { getDBConnection } from "@/database/database";
import { ORDERS_BASE_QUERY, ORDERS_GROUP_ORDER } from "@/database/queries";
import { NextApiRequest, NextApiResponse } from "next";

const ORDERS_QUERY = `${ORDERS_BASE_QUERY}${ORDERS_GROUP_ORDER}`;

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
