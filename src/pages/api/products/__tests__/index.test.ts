/**
 * @jest-environment node
 */
import { NextApiRequest, NextApiResponse } from "next";
import handler from "../index";
import { getDBConnection } from "@/database/database";

jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("POST /api/products", () => {
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
    req = { method: "POST", body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 405 for non-POST methods", async () => {
    req.method = "GET";
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("should return 400 when required fields are missing", async () => {
    req.body = { model: "GLA" };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Missing required fields") })
    );
  });

  it("should return 400 when description does not match any album title", async () => {
    req.body = { model: "GLA", description: "invalid desc", year: "2021", gears: "6" };
    mockFetch.mockResolvedValueOnce({
      json: async () => [{ title: "quidem molestiae enim" }],
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("does not match") })
    );
  });

  it("should create product and return 201 when description is valid", async () => {
    req.body = {
      model: "GLA",
      description: "quidem molestiae enim",
      year: "2021",
      gears: "6",
      tags: ["SUV"],
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => [{ title: "quidem molestiae enim" }],
    });

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ product_id: 99 }] }) // INSERT product
      .mockResolvedValueOnce({ rows: [{ tag_id: 1 }] }) // SELECT tag
      .mockResolvedValueOnce({ rows: [] }) // INSERT products_tags
      .mockResolvedValueOnce(undefined); // COMMIT

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 99, model: "GLA" })
    );
    expect(mockRelease).toHaveBeenCalled();
  });

  it("should rollback on database error", async () => {
    req.body = {
      model: "GLA",
      description: "quidem molestiae enim",
      year: "2021",
      gears: "6",
      tags: [],
    };

    mockFetch.mockResolvedValueOnce({
      json: async () => [{ title: "quidem molestiae enim" }],
    });

    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(new Error("DB error")); // INSERT product fails

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockRelease).toHaveBeenCalled();
  });
});
