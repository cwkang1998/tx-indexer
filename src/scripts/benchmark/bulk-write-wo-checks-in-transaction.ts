import { faker } from "@faker-js/faker";
import { PrismaClient, Receipt } from "@prisma/client";

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

const writeToDbTestBulk = async () => {
  console.time("bulk insert");
  const txToInsert = Array(10)
    .fill(0)
    .flatMap((_val, idx) => generateFakeTxns(idx, 100));
  const processedTxn = txToInsert.map((val) => {
    return {
      txTypeId: val.txTypeId,
      txHash: val.txHash,
      blockNumber: val.blockNumber,
      txId: val.txId,
      from: val.from,
      to: val.to,
    };
  });

  const transactionInserts = await prisma.transaction.createMany({
    data: processedTxn,
  });

  const processedTxnReceipt = txToInsert.flatMap((val) => {
    return val.receipts?.map((innerReceipt: Receipt) => ({
      ...innerReceipt,
      transactions: {
        connect: {
          txHash: val.txHash,
        },
      },
    }));
  });

  const receiptInserts = await prisma.$transaction(
    processedTxnReceipt
      .filter((receipt) => receipt !== undefined)
      .map((receipt) =>
        prisma.receipt.create({
          data: receipt,
        })
      )
  );

  console.timeEnd("bulk insert");
};

writeToDbTestBulk().catch((err) => console.error(err));
