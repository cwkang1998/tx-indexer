import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  getAllTransaction,
  TransactionRequestSchema,
} from "./services/get-txn";
import { createTransaction, TransactionAddSchema } from "./services/create-txn";
import { compatJsonStringify } from "./utils";

export const startApp = (prismaClient: PrismaClient) => {
  const app = express();
  app.use(express.json());

  app.get("/transaction", async (req, res) => {
    const queryParams = await TransactionRequestSchema.safeParseAsync(
      req.query
    );

    if (queryParams.success) {
      const txns = await getAllTransaction(prismaClient, queryParams.data);
      return res
        .status(200)
        .contentType("json")
        .send(compatJsonStringify(txns));
    }

    return res.status(400).json({ error: queryParams.error });
  });

  app.post("/transaction", async (req, res) => {
    const reqBody = await TransactionAddSchema.safeParseAsync(req.body);

    if (reqBody.success) {
      const txInsert = await createTransaction(prismaClient, reqBody.data);
      return res
        .status(201)
        .contentType("json")
        .send(compatJsonStringify(txInsert));
    }

    return res.status(400).json({ error: reqBody.error });
  });

  return app;
};
