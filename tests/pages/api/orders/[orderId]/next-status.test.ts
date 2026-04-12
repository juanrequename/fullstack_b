/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/orders/[orderId]/next-status";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

describe("PATCH /api/orders/[orderId]/next-status", () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  const mockQuery = jest.fn();
  const mockRelease = jest.fn();
  const mockConnect = jest.fn().mockResolvedValue({
    query: mockQuery,
    release: mockRelease,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getDBConnection as jest.Mock).mockReturnValue({ connect: mockConnect });
    req = { method: "PATCH", query: { orderId: "1" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 405 for non-PATCH methods", async () => {
    req.method = "GET";
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("should return 400 for invalid order ID", async () => {
    req.query = { orderId: "abc" };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 404 when order has no current state", async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT current state
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 400 when order is already Delivered", async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ history_id: 1, state_name: "Delivered" }] })
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Cannot advance") })
    );
  });

  it("should advance from Pending to Shipped", async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ history_id: 1, state_name: "Pending" }] })
      .mockResolvedValueOnce({ rows: [{ state_id: 2 }] }) // SELECT next state_id
      .mockResolvedValueOnce(undefined) // UPDATE current_state = false
      .mockResolvedValueOnce(undefined) // INSERT new state_history
      .mockResolvedValueOnce(undefined); // COMMIT

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ order_id: 1, new_status: "Shipped" });
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should advance from Shipped to Delivered", async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ history_id: 2, state_name: "Shipped" }] })
      .mockResolvedValueOnce({ rows: [{ state_id: 3 }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ order_id: 1, new_status: "Delivered" });
  });

  it("should rollback and return 500 on database error", async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("DB error"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should return 400 when order is Cancelled", async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ history_id: 3, state_name: "Cancelled" }] })
      .mockResolvedValueOnce(undefined); // ROLLBACK

    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Cannot advance") })
    );
  });
});

