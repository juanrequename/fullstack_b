import { getDBConnection } from "@/database/database";
import { METHOD, RESPONSE_CODES } from "@/types/api";
import { NextApiRequest, NextApiResponse } from "next";

const STATUS_PROGRESSION: Record<string, string> = {
  Pending: "Shipped",
  Shipped: "Delivered",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== METHOD.PATCH) {
    return res.status(RESPONSE_CODES.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
  }

  const orderId = Number(req.query.orderId);
  if (isNaN(orderId)) {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: "Invalid order ID" });
  }

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT sh.history_id, s.state_name
       FROM state_history sh
       JOIN states s ON s.state_id = sh.state_id
       WHERE sh.order_id = $1 AND sh.current_state = true`,
      [orderId]
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(RESPONSE_CODES.NOT_FOUND).json({ error: "Order not found or has no current state" });
    }

    const currentState = currentResult.rows[0].state_name;
    const nextState = STATUS_PROGRESSION[currentState];

    if (!nextState) {
      await client.query("ROLLBACK");
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: `Cannot advance from status: ${currentState}` });
    }

    const nextStateResult = await client.query(
      "SELECT state_id FROM states WHERE state_name = $1",
      [nextState]
    );

    if (nextStateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: `State '${nextState}' not found in database` });
    }

    const nextStateId = nextStateResult.rows[0].state_id;

    await client.query(
      "UPDATE state_history SET current_state = false WHERE order_id = $1 AND current_state = true",
      [orderId]
    );

    await client.query(
      "INSERT INTO state_history (order_id, state_id, current_state) VALUES ($1, $2, true)",
      [orderId, nextStateId]
    );

    await client.query("COMMIT");
    res.status(RESPONSE_CODES.OK).json({ order_id: orderId, new_status: nextState });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating order status:", error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
