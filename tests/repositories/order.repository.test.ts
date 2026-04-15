/**
 * @jest-environment node
 */
import { PoolClient } from "pg";
import { ORDERS_BASE_QUERY, ORDERS_GROUP_ORDER } from "@/database/queries";
import { searchOrders } from "@/repositories/order.repository";
import { OrderSearchFilters } from "@/types/order";

const createMockClient = () =>
  ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
  } as unknown as PoolClient & { query: jest.Mock });

describe("searchOrders repository", () => {
  let mockClient: PoolClient & { query: jest.Mock };

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("uses the base query without filters", async () => {
    const expectedRows = [{ order_id: 1 }];
    mockClient.query.mockResolvedValueOnce({ rows: expectedRows });

    const result = await searchOrders(mockClient, {}, { page: 1, limit: 50 });

    const [query, params] = mockClient.query.mock.calls[0];
    expect(query).toContain("FROM orders");
    expect(query).toContain("ORDER BY o.order_id");
    expect(query).toContain(ORDERS_BASE_QUERY.trim().split("\n")[1].trim());
    expect(query).toContain(ORDERS_GROUP_ORDER.trim().split("\n")[1].trim());
    expect(query).toContain("LIMIT $1 OFFSET $2");
    expect(params).toEqual([50, 0]);
    expect(result).toBe(expectedRows);
  });

  it("builds the where clause and parameter ordering when filters are supplied", async () => {
    const filters: OrderSearchFilters = {
      model: "GLA",
      description: "sedan",
      tags: "SUV, Petrol",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      gears: "6",
    };

    await searchOrders(mockClient, filters, { page: 2, limit: 10 });

    const [query, params] = mockClient.query.mock.calls[0];

    expect(query).toContain("p.model = $1");
    expect(query).toContain("ILIKE $2");
    expect(query).toContain("ANY($3::text[])");
    expect(query).toContain("o.order_date >= $4");
    expect(query).toContain("o.order_date < $5");
    expect(query).toContain("p.gears = $6");
    expect(query).toContain("LIMIT $7 OFFSET $8");

    expect(params).toEqual([
      "GLA",
      "%sedan%",
      ["SUV", "Petrol"],
      "2025-01-01",
      "2025-12-31",
      6,
      10,
      10,
    ]);
  });

  it("omits the tags predicate when the provided list is empty", async () => {
    await searchOrders(mockClient, { tags: ", , " }, { page: 1, limit: 50 });

    const [query, params] = mockClient.query.mock.calls[0];

    expect(query).not.toMatch(/ANY\(\$/);
    expect(query).toContain("LIMIT $1 OFFSET $2");
    expect(params).toEqual([50, 0]);
  });
});
