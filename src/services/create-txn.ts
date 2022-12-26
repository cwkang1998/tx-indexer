import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  TxType,
  TxTypeString,
  validateHex,
  validateTxTypeEnum,
} from "../types";

const DEFAULT_PAGE_SIZE = 25;

export const TransactionAddSchema = z
  .object({
    blockNumber: z.number().positive(),
    from: validateHex(),
    to: validateHex(),
    txHash: validateHex(),
    txId: z.number().positive(),
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

export const createTransaction = async (
  prismaClient: PrismaClient,
  params: typeof TransactionAddSchema._type
) => {
  const txInsert = await prismaClient.transaction.create({
    data: {
      blockNumber: params.blockNumber,
      from: params.from,
      to: params.to,
      txHash: params.txHash,
      txId: params.txId,
      receipts: { create: params.receipts ?? [] },
      txTypeId: params.txType === "INVOKE" ? TxType.INVOKE : TxType.L1_HANDLER,
    },
    include: {
      receipts: true,
      txType: true,
    },
  });

  return txInsert;
};
