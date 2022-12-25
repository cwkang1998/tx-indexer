-- CreateTable
CREATE TABLE "TransactionType" (
    "id" SMALLINT NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "TransactionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "hash" VARCHAR(100) NOT NULL,
    "payload" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGINT NOT NULL,
    "txHash" VARCHAR(100) NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "txId" BIGINT NOT NULL,
    "from" VARCHAR(100) NOT NULL,
    "to" VARCHAR(100) NOT NULL,
    "txTypeId" INTEGER NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ReceiptToTransaction" (
    "A" VARCHAR(100) NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionType_name_key" ON "TransactionType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_blockNumber_txId_key" ON "Transaction"("blockNumber", "txId");

-- CreateIndex
CREATE UNIQUE INDEX "_ReceiptToTransaction_AB_unique" ON "_ReceiptToTransaction"("A", "B");

-- CreateIndex
CREATE INDEX "_ReceiptToTransaction_B_index" ON "_ReceiptToTransaction"("B");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_txTypeId_fkey" FOREIGN KEY ("txTypeId") REFERENCES "TransactionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReceiptToTransaction" ADD CONSTRAINT "_ReceiptToTransaction_A_fkey" FOREIGN KEY ("A") REFERENCES "Receipt"("hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReceiptToTransaction" ADD CONSTRAINT "_ReceiptToTransaction_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
