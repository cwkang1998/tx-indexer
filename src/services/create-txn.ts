import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { TxType, validateHex, validateTxTypeEnum } from "../types";

export const TransactionAddSchema = z
  .object({
    blockNumber: z.number().nonnegative(),
    from: validateHex(),
    to: validateHex(),
    txHash: validateHex(),
    txId: z.number().nonnegative(),
    receipts: z
      .array(
        z.object({
          hash: validateHex(),
          payload: validateHex(),
        })
      )
      .optional(),
    txType: validateTxTypeEnum(),
  })
  .refine((schema) => {
    // Requiring receipts to be true only on invoke
    if (schema.txType === "L1_HANDLER" && schema.receipts) {
      return false;
    }
    return true;
  });

const isStrictlyIncreasingSequential = (
  val1: bigint,
  val2: bigint
): boolean => {
  /**
   * val2 must be exactly 1 after val1, that is val2 = val1 + 1
   *
   * if val2 is not less than val1 and val2 is not larger than val1 + 1
   * then its strictly increasing.
   */
  return !(val2 < val1 || val2 > val1 + BigInt(1));
};

export const createTransaction = async (
  prismaClient: PrismaClient,
  params: typeof TransactionAddSchema._type
) => {
  /**
   * Before we insert, do a manual constraint check for blockNumber and txId:
   * -  blockNumber and txId should not be allowed to go backwards,
   *    unless when implementing rollback. This implementation does not account for
   *    situation requiring rollback (re-orgs for example.)
   */

  const sessionTx = await prismaClient.$transaction(async (currentCtx) => {
    const latestTx = await currentCtx.transaction.findFirst({
      orderBy: { id: "desc" },
    });

    // If its a genesis block
    if (latestTx == null) {
      if (params.blockNumber !== 0) {
        // If there are no prior transactions, check that block starts with 0
        throw new Error("Invalid blockNumber: blockNumber should start at 0");
      }

      // Check that transaction starts from 0, when its a new block
      if (params.txId !== 0) {
        throw new Error(
          "Invalid txId: new transaction on a new block should start from 0"
        );
      }
    }

    // After genesis block
    if (latestTx !== null) {
      // Check that blocks are added sequentially in increasing order.
      if (
        !isStrictlyIncreasingSequential(
          latestTx.blockNumber,
          BigInt(params.blockNumber)
        )
      ) {
        throw new Error(
          "Invalid blockNumber: block should be added sequentially in increasing order."
        );
      }

      // Check that the transaction is being added sequentially in increasing order.
      if (
        BigInt(params.blockNumber) === latestTx.blockNumber &&
        !isStrictlyIncreasingSequential(latestTx.txId, BigInt(params.txId))
      ) {
        throw new Error(
          "Invalid txId: block tx should be added sequentially in increasing order."
        );
      }

      // Check that transaction starts from 0, when its a new block
      if (
        BigInt(params.blockNumber) === latestTx.blockNumber + BigInt(1) &&
        params.txId !== 0
      ) {
        throw new Error(
          "Invalid txId: new transaction on a new block should start from 0"
        );
      }
    }

    // Finally, insert the new information.
    const txInsert = await prismaClient.transaction.create({
      data: {
        blockNumber: params.blockNumber,
        from: params.from,
        to: params.to,
        txHash: params.txHash,
        txId: params.txId,
        receipts: { create: params.receipts ?? [] },
        txTypeId:
          params.txType === "INVOKE" ? TxType.INVOKE : TxType.L1_HANDLER,
      },
      include: {
        receipts: true,
        txType: true,
      },
    });
    return txInsert;
  });

  return sessionTx;
};
