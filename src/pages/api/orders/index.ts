import { getDBConnection } from "@/database/database";
import { ORDERS_BASE_QUERY, ORDERS_GROUP_ORDER } from "@/database/queries";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

const ORDERS_QUERY = `${ORDERS_BASE_QUERY}${ORDERS_GROUP_ORDER}`;

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
    const result = await client.query(ORDERS_QUERY);
    res.status(RESPONSE_CODES.OK).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
