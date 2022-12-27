import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { TxType, validateHex, validateTxTypeEnum } from "../types";

const DEFAULT_PAGE_SIZE = 25;

export const TransactionRequestSchema = z.object({
  page: z.coerce.number().positive().default(1),
  txType: validateTxTypeEnum().optional(),
  txHash: validateHex().optional(),
});

export const getAllTransaction = async (
  prismaClient: PrismaClient,
  params: typeof TransactionRequestSchema._type
) => {
  const whereQuery: Record<string, string | number> = {};

  if (params.txType) {
    whereQuery["txTypeId"] =
      params.txType === "INVOKE" ? TxType.INVOKE : TxType.L1_HANDLER;
  }

  if (params.txHash) {
    whereQuery["txHash"] = params.txHash;
  }

  const txQueryRes = await prismaClient.$transaction([
    prismaClient.transaction.count({
      where: whereQuery,
      orderBy: {
        id: "desc",
      },
    }),
    prismaClient.transaction.findMany({
      where: whereQuery,
      orderBy: {
        id: "desc",
      },
      take: DEFAULT_PAGE_SIZE,
      skip: (params.page - 1) * DEFAULT_PAGE_SIZE,
    }),
  ]);

  return {
    currentPage: params.page,
    lastPage: Math.floor(txQueryRes[0] / DEFAULT_PAGE_SIZE) || 1, // Set minimum to 1, if count is 0
    txns: txQueryRes[1],
  };
};
