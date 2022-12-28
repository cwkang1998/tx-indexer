-- DropIndex
DROP INDEX "Transaction_txHash_idx";

-- CreateIndex
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash");
