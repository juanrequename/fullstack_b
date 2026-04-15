/**
 * @jest-environment node
 */
import CustomError, { RESPONSE_CODES } from "@/types/api";
import { advanceOrderStatus } from "@/services/order.service";
import * as orderRepo from "@/repositories/order.repository";
import { getDBConnection } from "@/database/database";

jest.mock("@/repositories/order.repository");
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

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockResolvedValue(undefined);
  (getDBConnection as jest.Mock).mockReturnValue({
    connect: mockConnect,
  });
});

describe("advanceOrderStatus", () => {
  it("advances Pending -> Shipped and commits the transaction", async () => {
    (orderRepo.getCurrentState as jest.Mock).mockResolvedValue({ state_name: "Pending" });
    (orderRepo.getStateIdByName as jest.Mock).mockResolvedValue(2);

    const result = await advanceOrderStatus(1);

    expect(result).toEqual({ order_id: 1, new_status: "Shipped" });
    expect(orderRepo.deactivateCurrentState).toHaveBeenCalledWith(mockClient, 1);
    expect(orderRepo.insertStateHistory).toHaveBeenCalledWith(mockClient, 1, 2);
    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("throws NOT_FOUND when there is no current state and rolls back", async () => {
    (orderRepo.getCurrentState as jest.Mock).mockResolvedValue(null);

    await expect(advanceOrderStatus(2)).rejects.toThrowError(CustomError);

    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when state cannot be advanced and rolls back", async () => {
    (orderRepo.getCurrentState as jest.Mock).mockResolvedValue({ state_name: "Delivered" });

    await expect(advanceOrderStatus(3)).rejects.toThrowError(CustomError);

    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("propagates repository failures and rolls back", async () => {
    (orderRepo.getCurrentState as jest.Mock).mockResolvedValue({ state_name: "Pending" });
    (orderRepo.getStateIdByName as jest.Mock).mockResolvedValue(2);
    (orderRepo.deactivateCurrentState as jest.Mock).mockRejectedValue(new Error("DB failure"));

    await expect(advanceOrderStatus(4)).rejects.toThrowError("DB failure");

    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("throws INTERNAL_SERVER_ERROR when the next state is missing and rolls back", async () => {
    (orderRepo.getCurrentState as jest.Mock).mockResolvedValue({ state_name: "Shipped" });
    (orderRepo.getStateIdByName as jest.Mock).mockResolvedValue(null);

    const error = await advanceOrderStatus(5).catch(err => err);

    expect(error).toBeInstanceOf(CustomError);
    expect((error as CustomError).code).toBe(RESPONSE_CODES.INTERNAL_SERVER_ERROR);
    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });
});
