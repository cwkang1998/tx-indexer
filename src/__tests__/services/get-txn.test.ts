import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { mockDeep, DeepMockProxy, mockReset } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { getAllTransaction } from "../../services/get-txn";

describe("Get Transactions", () => {
  let prismaClient: DeepMockProxy<PrismaClient>;

  beforeAll(async () => {
    // Create a mock client
    prismaClient = mockDeep<PrismaClient>();
  });

  beforeEach(() => {
    mockReset(prismaClient);
  });

  it("should get /transaction without any db entries", async () => {
    // Create the mock condition
    (prismaClient.$transaction as any).mockResolvedValue([0, []]);

    const res = await getAllTransaction(prismaClient, { page: 1 });

    expect(res).toStrictEqual({
      txns: [],
      currentPage: 1,
      lastPage: 1,
    });
  });

  it("should get /transaction if it exists in db", async () => {
    const txnInDb = [
      {
        id: 0,
        receipts: [
          {
            hash: "0x34d6607791d4d3914a550252a18bb8e9cd2e7c3432cde9b1e37b21ed9ad4e3a0",
            payload: "0x0c22",
          },
        ],
        txType: "INVOKE",
        txHash:
          "0xce54bbc5647e1c1ea4276c01a708523f740db0ff5474c77734f73beec2624",
        blockNumber: 0,
        txId: 0,
        from: "0x020cfa74ee3564b4cd5435cdace0f9c4d43b939620e4a0bb5076105df0a626c6",
        to: "0xc84dd7fd43a7defb5b7a15c4fbbe11cbba6db1ba",
      },
    ];

    (prismaClient.$transaction as any).mockResolvedValue([1, txnInDb]);

    const res = await getAllTransaction(prismaClient, { page: 1 });

    expect(res).toStrictEqual({
      txns: txnInDb,
      currentPage: 1,
      lastPage: 1,
    });
  });
});
