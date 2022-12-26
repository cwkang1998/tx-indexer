import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  getAllTransaction,
  TransactionRequestSchema,
} from "./services/get-txn";
import { createTransaction, TransactionAddSchema } from "./services/create-txn";

export const startApp = (prismaClient: PrismaClient) => {
  const app = express();

  app.get("/transaction", async (req, res) => {
    const queryParams = await TransactionRequestSchema.safeParseAsync(
      req.query
    );

    if (queryParams.success) {
      const txns = await getAllTransaction(prismaClient, queryParams.data);
      return res.status(200).json(txns);
    }

    return res.status(400).json({ error: queryParams.error });
  });

  app.post("/transaction", async (req, res) => {
    const reqBody = await TransactionAddSchema.safeParseAsync(req.body);

    if (reqBody.success) {
      const txInsert = await createTransaction(prismaClient, reqBody.data);
      return res.status(201).json(txInsert);
    }

    return res.status(400).json({ error: reqBody.error });
  });

  return app;
};
