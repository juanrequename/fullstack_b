import { getDBConnection } from "@/database/database";
import * as orderRepo from "@/repositories/order.repository";
import CustomError, { RESPONSE_CODES } from "@/types/api";
import { OrderSearchFilters } from "@/types/order";

const STATUS_PROGRESSION: Record<string, string> = {
  Pending: "Shipped",
  Shipped: "Delivered",
};

export async function getOrders(pagination: { page: number; limit: number }) {
  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    return await orderRepo.getAllOrders(client, pagination);
  } finally {
    client.release();
  }
}

export async function getReport() {
  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    return await orderRepo.getReport(client);
  } finally {
    client.release();
  }
}

export async function searchOrders(filters: OrderSearchFilters) {
  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    return await orderRepo.searchOrders(client, filters);
  } finally {
    client.release();
  }
}

export async function advanceOrderStatus(orderId: number) {
  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const currentState = await orderRepo.getCurrentState(client, orderId);

    if (!currentState) {
      throw new CustomError(RESPONSE_CODES.NOT_FOUND, "Order not found or has no current state");
    }

    const nextState = STATUS_PROGRESSION[currentState.state_name];

    if (!nextState) {
      throw new CustomError(RESPONSE_CODES.BAD_REQUEST, `Cannot advance from status: ${currentState.state_name}`);
    }

    const nextStateId = await orderRepo.getStateIdByName(client, nextState);

    if (nextStateId === null) {
      throw new CustomError(RESPONSE_CODES.INTERNAL_SERVER_ERROR, `State '${nextState}' not found in database`);
    }

    await orderRepo.deactivateCurrentState(client, orderId);
    await orderRepo.insertStateHistory(client, orderId, nextStateId);

    await client.query("COMMIT");
    return { order_id: orderId, new_status: nextState };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
