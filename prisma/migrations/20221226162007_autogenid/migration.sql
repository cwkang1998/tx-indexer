-- AlterTable
CREATE SEQUENCE transaction_id_seq;
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DEFAULT nextval('transaction_id_seq');
ALTER SEQUENCE transaction_id_seq OWNED BY "Transaction"."id";
