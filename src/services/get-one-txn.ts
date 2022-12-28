import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { validateHex } from "../types";

export const TransactionRequestOneSchema = z.object({
  txHash: validateHex(),
});

export const getOneTransaction = async (
  prismaClient: PrismaClient,
  params: typeof TransactionRequestOneSchema._type
) => {
  const txQueryRes = await prismaClient.transaction.findFirstOrThrow({
    where: { txHash: params.txHash },
    orderBy: {
      id: "desc",
    },
    include: {
      receipts: true,
      txType: true,
    },
  });

  return txQueryRes;
};
