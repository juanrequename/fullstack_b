/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/orders/index";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

describe("GET /api/orders", () => {
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
    (getDBConnection as jest.Mock).mockReturnValue({
      connect: mockConnect,
    });
    req = { method: "GET" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 200 with enriched order data", async () => {
    const mockOrders = [
      {
        order_id: 1,
        user: "John Doe",
        model: "GLA",
        tags: ["SUV", "Mercedes"],
        order_date: "2025-01-01T00:00:00.000Z",
        current_status_date: "2025-01-02T00:00:00.000Z",
        status: "Pending",
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: mockOrders });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should return 500 on database error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Database error"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should return 405 for non-GET methods", async () => {
    req.method = "POST";

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("should return 200 with empty array when no orders exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(mockRelease).toHaveBeenCalled();
  });
});

/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/orders/index";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

describe("GET /api/orders", () => {
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
    (getDBConnection as jest.Mock).mockReturnValue({
      connect: mockConnect,
    });
    req = { method: "GET" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 200 with enriched order data", async () => {
    const mockOrders = [
      {
        order_id: 1,
        user: "John Doe",
        model: "GLA",
        tags: ["SUV", "Mercedes"],
        order_date: "2025-01-01T00:00:00.000Z",
        current_status_date: "2025-01-02T00:00:00.000Z",
        status: "Pending",
      },
    ];
    mockQuery.mockResolvedValueOnce({ rows: mockOrders });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it("should return 500 on database error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Database error"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should return 405 for non-GET methods", async () => {
    req.method = "POST";

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("should return 200 with empty array when no orders exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(mockRelease).toHaveBeenCalled();
  });
});

