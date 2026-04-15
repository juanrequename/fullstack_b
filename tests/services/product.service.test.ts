/**
 * @jest-environment node
 */
import CustomError, { RESPONSE_CODES } from "@/types/api";
import { createProduct } from "@/services/product.service";
import * as productRepo from "@/repositories/product.repository";
import { getDBConnection } from "@/database/database";

jest.mock("@/repositories/product.repository");
jest.mock("@/database/database", () => ({
  getDBConnection: jest.fn(),
}));

const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockClient = {
  query: mockQuery,
  release: mockRelease,
};
const mockConnect = jest.fn().mockResolvedValue(mockClient);

const mockFetch = jest.fn();
let originalFetch: typeof global.fetch;

beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = mockFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockResolvedValue(undefined);
  (getDBConnection as jest.Mock).mockReturnValue({ connect: mockConnect });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createProduct", () => {
  const input = {
    model: "GLA",
    description: "valid description",
    year: "2024",
    gears: "6",
    tags: ["SUV", "NewTag"],
  };

  it("throws BAD_REQUEST when description validation fails", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ title: "another" }],
    });

    await expect(createProduct(input)).rejects.toMatchObject({
      code: RESPONSE_CODES.BAD_REQUEST,
      message: expect.stringContaining("does not match"),
    });
  });

  it("creates product, links existing and new tags, and commits", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ title: "valid description" }],
    });

    const createProductMock = productRepo.createProduct as jest.MockedFunction<
      typeof productRepo.createProduct
    >;
    const findTagMock = productRepo.findTagByName as jest.MockedFunction<
      typeof productRepo.findTagByName
    >;
    const createTagMock = productRepo.createTag as jest.MockedFunction<typeof productRepo.createTag>;
    const linkMock = productRepo.linkProductTag as jest.MockedFunction<
      typeof productRepo.linkProductTag
    >;

    createProductMock.mockResolvedValue(42);
    findTagMock.mockResolvedValueOnce(10).mockResolvedValueOnce(null);
    createTagMock.mockResolvedValue(99);
    linkMock.mockResolvedValue(undefined);

    const result = await createProduct(input);

    expect(result).toMatchObject({
      product_id: 42,
      model: input.model,
      tags: input.tags,
    });
    expect(createProductMock).toHaveBeenCalledWith(
      mockClient,
      input.model,
      input.description,
      Number(input.year),
      Number(input.gears)
    );
    expect(findTagMock).toHaveBeenCalledTimes(2);
    expect(createTagMock).toHaveBeenCalledWith(mockClient, "NewTag");
    expect(linkMock).toHaveBeenNthCalledWith(1, mockClient, 42, 10);
    expect(linkMock).toHaveBeenNthCalledWith(2, mockClient, 42, 99);
    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("rolls back transaction on repository failure", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ title: "valid description" }],
    });

    const createProductMock = productRepo.createProduct as jest.MockedFunction<
      typeof productRepo.createProduct
    >;
    createProductMock.mockRejectedValue(new Error("DB fail"));

    await expect(createProduct(input)).rejects.toThrowError("DB fail");

    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });
});
