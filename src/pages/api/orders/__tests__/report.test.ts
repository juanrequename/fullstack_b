/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "../report";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

describe("GET /api/orders/report", () => {
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
    req = { method: "GET" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 405 for non-GET methods", async () => {
    req.method = "POST";
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("should return grouped report data with 200", async () => {
    const mockReport = [
      { product_id: 12, model: "GLA", year: 2025, month: 6, status: "Pending", orders_count: 3 },
      { product_id: 12, model: "GLA", year: 2025, month: 6, status: "Shipped", orders_count: 1 },
    ];
    mockQuery.mockResolvedValueOnce({ rows: mockReport });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockReport);
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should return 500 on database error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB error"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});
