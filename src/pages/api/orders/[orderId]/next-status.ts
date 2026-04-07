import { getDBConnection } from "@/database/database";
import { NextApiRequest, NextApiResponse } from "next";

const STATUS_PROGRESSION: Record<string, string> = {
  Pending: "Shipped",
  Shipped: "Delivered",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const orderId = Number(req.query.orderId);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
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
      return res.status(404).json({ error: "Order not found or has no current state" });
    }

    const currentState = currentResult.rows[0].state_name;
    const nextState = STATUS_PROGRESSION[currentState];

    if (!nextState) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Cannot advance from status: ${currentState}` });
    }

    const nextStateResult = await client.query(
      "SELECT state_id FROM states WHERE state_name = $1",
      [nextState]
    );
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
    res.status(200).json({ order_id: orderId, new_status: nextState });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
