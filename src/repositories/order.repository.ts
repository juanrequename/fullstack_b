import { PoolClient } from "pg";
import {
  ORDERS_BASE_QUERY,
  ORDERS_GROUP_ORDER,
  ORDERS_QUERY,
  REPORT_QUERY,
} from "@/database/queries";
import { Order, OrderSearchFilters } from "@/types/order";

export async function getAllOrders(
  client: PoolClient,
  pagination: { page: number; limit: number }
): Promise<Order[]> {
  const offset = (pagination.page - 1) * pagination.limit;
  const result = await client.query(`${ORDERS_QUERY} LIMIT $1 OFFSET $2`, [
    pagination.limit,
    offset,
  ]);
  return result.rows;
}

export async function getReport(client: PoolClient) {
  const result = await client.query(REPORT_QUERY);
  return result.rows;
}

export async function searchOrders(client: PoolClient, filters: OrderSearchFilters): Promise<Order[]> {
  const conditions: string[] = [];
  const params: (string | number | string[])[] = [];
  let paramIndex = 1;

  if (filters.model) {
    conditions.push(`p.model = $${paramIndex++}`);
    params.push(String(filters.model));
  }

  if (filters.description) {
    conditions.push(`p.description ILIKE $${paramIndex++}`);
    params.push(`%${String(filters.description)}%`);
  }

  if (filters.tags) {
    const tagList = String(filters.tags)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);

    if (tagList.length > 0) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM products_tags pt2
          JOIN tags t2 ON t2.tag_id = pt2.tag_id
          WHERE pt2.product_id = p.product_id
          AND t2.name = ANY($${paramIndex++}::text[])
        )`
      );
      params.push(tagList);
    }
  }

  if (filters.startDate) {
    conditions.push(`o.order_date >= $${paramIndex++}`);
    params.push(String(filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(`o.order_date < $${paramIndex++}`);
    params.push(String(filters.endDate));
  }

  if (filters.gears) {
    conditions.push(`p.gears = $${paramIndex++}`);
    params.push(Number(filters.gears));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `${ORDERS_BASE_QUERY}
    ${whereClause}${ORDERS_GROUP_ORDER}`;

  const result = await client.query(query, params);
  return result.rows;
}

export async function getCurrentState(client: PoolClient, orderId: number) {
  const result = await client.query(
    `SELECT sh.history_id, s.state_name
       FROM state_history sh
       JOIN states s ON s.state_id = sh.state_id
       WHERE sh.order_id = $1 AND sh.current_state = true
       FOR UPDATE`,
    [orderId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function getStateIdByName(client: PoolClient, stateName: string) {
  const result = await client.query("SELECT state_id FROM states WHERE state_name = $1", [
    stateName,
  ]);
  return result.rows.length > 0 ? result.rows[0].state_id : null;
}

export async function deactivateCurrentState(client: PoolClient, orderId: number) {
  await client.query(
    "UPDATE state_history SET current_state = false WHERE order_id = $1 AND current_state = true",
    [orderId]
  );
}

export async function insertStateHistory(client: PoolClient, orderId: number, stateId: number) {
  await client.query(
    "INSERT INTO state_history (order_id, state_id, current_state) VALUES ($1, $2, true)",
    [orderId, stateId]
  );
}
