import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { createTransaction } from "../services/create-txn";

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
        receipts,
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

const writeToDb = async () => {
  for (let i = 1; i < 100; i++) {
    const txToInsert = generateFakeTxns(i, 100);
    for (let j = 0; j < 100; j++) {
      console.time("insert block");
      await createTransaction(prisma, txToInsert[j]);
      console.timeEnd("insert block");
    }
  }
};

writeToDb().catch((err) => console.error(err));
