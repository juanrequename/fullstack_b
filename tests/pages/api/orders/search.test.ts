/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/orders/search";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

describe("GET /api/orders/search", () => {
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
    req = { method: "GET", query: {} };
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

  it("should return all orders when no filters are provided", async () => {
    const mockOrders = [{ order_id: 1, user: "John", model: "GLA" }];
    mockQuery.mockResolvedValueOnce({ rows: mockOrders });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
    const queryArg = mockQuery.mock.calls[0][0] as string;
    const afterGroupBy = queryArg.split("FROM orders")[1]?.split("GROUP BY")[0] ?? "";
    expect(afterGroupBy).not.toMatch(/\bWHERE\b.*\$/);
  });

  it("should apply model filter with exact match", async () => {
    req.query = { model: "GLA" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("p.model = $1");
    expect(params).toEqual(["GLA"]);
  });

  it("should apply description filter with ILIKE", async () => {
    req.query = { description: "sedan" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("ILIKE");
    expect(params).toEqual(["%sedan%"]);
  });

  it("should apply tags filter with ANY", async () => {
    req.query = { tags: "SUV,Petrol" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("ANY($1::text[])");
    expect(params).toEqual([["SUV", "Petrol"]]);
  });

  it("should apply date range and gears filters", async () => {
    req.query = { startDate: "2025-01-01", endDate: "2025-12-31", gears: "6" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("o.order_date >= $1");
    expect(queryStr).toContain("o.order_date < $2");
    expect(queryStr).toContain("p.gears = $3");
    expect(params).toEqual(["2025-01-01", "2025-12-31", 6]);
  });

  it("should combine multiple filters", async () => {
    req.query = { model: "GLA", gears: "6" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("p.model = $1");
    expect(queryStr).toContain("p.gears = $2");
    expect(params).toEqual(["GLA", 6]);
  });

  it("should return 500 on database error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB error"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});

/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/orders/search";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

describe("GET /api/orders/search", () => {
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
    req = { method: "GET", query: {} };
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

  it("should return all orders when no filters are provided", async () => {
    const mockOrders = [{ order_id: 1, user: "John", model: "GLA" }];
    mockQuery.mockResolvedValueOnce({ rows: mockOrders });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
    const queryArg = mockQuery.mock.calls[0][0] as string;
    const afterGroupBy = queryArg.split("FROM orders")[1]?.split("GROUP BY")[0] ?? "";
    expect(afterGroupBy).not.toMatch(/\bWHERE\b.*\$/);
  });

  it("should apply model filter with exact match", async () => {
    req.query = { model: "GLA" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("p.model = $1");
    expect(params).toEqual(["GLA"]);
  });

  it("should apply description filter with ILIKE", async () => {
    req.query = { description: "sedan" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("ILIKE");
    expect(params).toEqual(["%sedan%"]);
  });

  it("should apply tags filter with ANY", async () => {
    req.query = { tags: "SUV,Petrol" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("ANY($1::text[])");
    expect(params).toEqual([["SUV", "Petrol"]]);
  });

  it("should apply date range and gears filters", async () => {
    req.query = { startDate: "2025-01-01", endDate: "2025-12-31", gears: "6" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("o.order_date >= $1");
    expect(queryStr).toContain("o.order_date < $2");
    expect(queryStr).toContain("p.gears = $3");
    expect(params).toEqual(["2025-01-01", "2025-12-31", 6]);
  });

  it("should combine multiple filters", async () => {
    req.query = { model: "GLA", gears: "6" };
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await handler(req as NextApiRequest, res as NextApiResponse);

    const [queryStr, params] = mockQuery.mock.calls[0];
    expect(queryStr).toContain("p.model = $1");
    expect(queryStr).toContain("p.gears = $2");
    expect(params).toEqual(["GLA", 6]);
  });

  it("should return 500 on database error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB error"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});

