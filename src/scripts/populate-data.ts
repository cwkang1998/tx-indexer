import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

// Logging for db
// prisma.$on("query", (e) => {
//   console.log("Query: " + e.query);
//   console.log("Params: " + e.params);
//   console.log("Duration: " + e.duration + "ms");
// });

const generateFakeTxns = (blockNo: number, txAmount: number) => {
  const result = Array(txAmount)
    .fill(0)
    .map((_val, txnIdx) => {
      const chosenTxType = Math.random() > 0.5 ? "INVOKE" : "L1_HANDLER";

      const receipts =
        chosenTxType === "INVOKE"
          ? Array(Math.floor(Math.random() * 100) + 1)
              .fill(0)
              .map(() => ({
                hash: faker.datatype.hexadecimal({
                  prefix: "0x",
                  length: 64,
                }),
                payload: faker.datatype.hexadecimal({
                  prefix: "0x",
                  length: 128,
                }),
              }))
          : [];

      const txn: any = {
        receipts: { create: receipts },
        txTypeId: chosenTxType === "INVOKE" ? 0 : 1,
        txHash: faker.datatype.hexadecimal({ prefix: "0x", length: 64 }),
        blockNumber: blockNo,
        txId: txnIdx,
        from: faker.finance.ethereumAddress(),
        to: faker.finance.ethereumAddress(),
      };

      return txn;
    });
  return result;
};

// --- Perm test cases ---

/**
 * Run bulk insert using the schema for roughly
 * 10k * 100 transaction -> 1m transaction
 * Also includes the receipts field INVOKE type.
 *
 * Avg per 100 txn insert time taken: 2-4sec
 */
const writePermTestBulkInsert = async () => {
  console.time("bulk insert full");
  for (let i = 0; i < 10_000; i++) {
    const txToInsert = generateFakeTxns(i, 100);
    console.time("bulk insert case");

    const result = await prisma.$transaction(async (ctx) => {
      const insertion = txToInsert.map((txn) => {
        return ctx.transaction.create({
          data: txn,
          include: { receipts: true },
        });
      });
      return await Promise.all(insertion);
    });

    console.timeEnd("bulk insert case");
  }
  console.timeEnd("bulk insert full");
};

writePermTestBulkInsert().catch((err) => console.error(err));
