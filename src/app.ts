import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const DEFAULT_PAGE_SIZE = 25;

const TransactionRequestSchema = z.object({
  page: z.number().default(1),
  txType: z.enum(["INVOKE", "L1_HANDLER"]).optional(),
  txHash: z
    .string()
    .regex(/0x[0-9a-f]+/)
    .optional(),
});

export const startApp = (prismaClient: PrismaClient) => {
  const app = express();

  app.get("/transaction", async (req, res) => {
    const queryParams = TransactionRequestSchema.parse(req.query);

    const txs = await prismaClient.transaction.findMany({});

    return res.status(200).json({
      txs,
    });
  });

  return app;
};
