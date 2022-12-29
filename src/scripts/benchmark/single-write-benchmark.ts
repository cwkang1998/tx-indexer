import { faker } from "@faker-js/faker";
import fetch from "node-fetch";
import { compatJsonStringify } from "../../utils";

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
          : undefined;

      const txn: any = {
        receipts,
        txType: chosenTxType,
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

/**
 * Make a test to insert 100 transactions over 100 blocks.
 * Get the average, min and max ms taken for the addition of a txns into the indexer.
 */
const writeToDbTestSingle = async () => {
  const timeCollected: Array<number> = [];

  for (let i = 0; i < 100; i++) {
    const txToInsert = generateFakeTxns(i, 100);
    for (let j = 0; j < 100; j++) {
      const startTime = Date.now();

      const res = await fetch("http://localhost:3000/transaction", {
        method: "POST",
        body: compatJsonStringify(txToInsert[j]),
        headers: { "Content-Type": "application/json" },
      });
      console.log(await res.text());

      timeCollected.push(Date.now() - startTime);
      console.log(`iter ${i}, ${j}`);
    }
  }

  console.log(
    `Avg: ${
      timeCollected.reduce((a, b) => a + b, 0) / timeCollected.length
    }, Min: ${Math.min(...timeCollected)}, Max: ${Math.max(...timeCollected)}`
  );
};

writeToDbTestSingle().catch((err) => console.error(err));
