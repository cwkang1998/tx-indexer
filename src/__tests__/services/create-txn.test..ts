import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { mockDeep, DeepMockProxy, mockReset } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { createTransaction } from "../../services/create-txn";

describe("Create Transactions", () => {
  let prismaClient: DeepMockProxy<PrismaClient>;

  beforeAll(async () => {
    // Create a mock client
    prismaClient = mockDeep<PrismaClient>();
  });

  beforeEach(() => {
    mockReset(prismaClient);
  });

  it("should create /transaction", async () => {
    // Create the mock condition
    (prismaClient.transaction.create as any).mockResolvedValue({
      id: 0,
      receipts: [
        {
          hash: "0x34d6607791d4d3914a550252a18bb8e9cd2e7c3432cde9b1e37b21ed9ad4e3a0",
          payload: "0x0c22",
        },
      ],
      txType: "INVOKE",
      txHash: "0xce54bbc5647e1c1ea4276c01a708523f740db0ff5474c77734f73beec2624",
      blockNumber: 0,
      txId: 0,
      from: "0x020cfa74ee3564b4cd5435cdace0f9c4d43b939620e4a0bb5076105df0a626c6",
      to: "0xc84dd7fd43a7defb5b7a15c4fbbe11cbba6db1ba",
    });

    const res = await createTransaction(prismaClient, {
      receipts: [
        {
          hash: "0x34d6607791d4d3914a550252a18bb8e9cd2e7c3432cde9b1e37b21ed9ad4e3a0",
          payload: "0x0c22",
        },
      ],
      txType: "INVOKE",
      txHash: "0xce54bbc5647e1c1ea4276c01a708523f740db0ff5474c77734f73beec2624",
      blockNumber: 0,
      txId: 0,
      from: "0x020cfa74ee3564b4cd5435cdace0f9c4d43b939620e4a0bb5076105df0a626c6",
      to: "0xc84dd7fd43a7defb5b7a15c4fbbe11cbba6db1ba",
    });

    expect(res).toMatchObject({
      id: 0,
      receipts: [
        {
          hash: "0x34d6607791d4d3914a550252a18bb8e9cd2e7c3432cde9b1e37b21ed9ad4e3a0",
          payload: "0x0c22",
        },
      ],
      txType: "INVOKE",
      txHash: "0xce54bbc5647e1c1ea4276c01a708523f740db0ff5474c77734f73beec2624",
      blockNumber: 0,
      txId: 0,
      from: "0x020cfa74ee3564b4cd5435cdace0f9c4d43b939620e4a0bb5076105df0a626c6",
      to: "0xc84dd7fd43a7defb5b7a15c4fbbe11cbba6db1ba",
    });
  });
});
