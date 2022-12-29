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

const writeToDbTestSingleWoCheckSingleTxn = async () => {
  console.time("bulk insert");
  const txToInsert = Array(10)
    .fill(0)
    .flatMap((_val, idx) => generateFakeTxns(idx, 100));
  // for (let i = 0; i < 100; i++) {
  // const txToInsert = generateFakeTxns(i, 100);

  const result = await prisma.$transaction(
    async (ctx) => {
      const insertion = txToInsert.map((txn) => {
        return ctx.transaction.create({
          data: txn,
          include: { receipts: true },
        });
      });
      return await Promise.all(insertion);
    },
    { timeout: 180000 }
  );

  // }
  console.timeEnd("bulk insert");
};

writeToDbTestSingleWoCheckSingleTxn().catch((err) => console.error(err));
