# Tx Indexer

A simple transaction indexer.

## Guide

To start the application, you'll need to first get the database up and running, which can be done via a simple:

```bash
docker compose up -d
```

The `-d` flag runs the docker image as a daemon in the background.

With the database up, you would need to first do a migration to apply the schema to the database, which can be done via:

```bash
npm run db:migraet
```

With this schema, there's also a need to pre-seed the txType, which can be done via:

```bash
npm run db:seed
```

With that done, you can now finally run your server, which would be on localhost:3000.

```bash
npm start
```

## Design

Below is a simple ERD that describe the database schema.

![ERDOverview](./prisma/ERD.svg)

`Transaction` table `txHash` are explicitly indexed in order to improve query speed.

## Benchmarking

Some simple benchmarking is done to measure the performance of the design and make proper adjustment and optimization.

### Reads

Read test are done for different categories:

1. paging 1st, 1000th and last page
2. filtering by type

The test is then conducted with `autocanon` with its default setting of 10 connection.

```bash
npx autocannon http://localhost:3000/transaction
```

Extra information may be supplemented via utilizing prisma orm's logging of the query information.

The below tests are done with **1000358** transaction being indexed into the database.

#### Transaction including full receipts array, using offset

##### Paging

| Page   | Avg       | Stdev    | Max    |
| ------ | --------- | -------- | ------ |
| 1st    | 325.08 ms | 63.99 ms | 530 ms |
| 1000th | 329.41 ms | 68.07 ms | 494 ms |
| Last   | 616.29 ms | 46.94 ms | 692 ms |

##### Filtering by Transaction Type

| Type           | Avg       | Stdev    | Max    |
| -------------- | --------- | -------- | ------ |
| 0 (INVOKE)     | 275.92 ms | 57.19 ms | 488 ms |
| 1 (L1_HANDLER) | 265.72 ms | 47.78 ms | 405 ms |

Including the receipts array in a get all call increased the payload and required queries.

The generated queries from the ORM (not including the counting) are as below:

```sql
-- First query
SELECT "public"."Transaction"."id", "public"."Transaction"."txHash", "public"."Transaction"."blockNumber", "public"."Transaction"."txId", "public"."Transaction"."from", "public"."Transaction"."to", "public"."Transaction"."txTypeId" FROM "public"."Transaction" WHERE 1=1 ORDER BY "public"."Transaction"."id" DESC LIMIT $1 OFFSET $2;

-- Second query
SELECT "public"."_ReceiptToTransaction"."B", "public"."_ReceiptToTransaction"."A" FROM "public"."_ReceiptToTransaction" WHERE "public"."_ReceiptToTransaction"."B" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25);

-- Third and final query
SELECT "public"."Receipt"."hash", "public"."Receipt"."payload" FROM "public"."Receipt" WHERE "public"."Receipt"."hash" IN ($1...$n);
```

#### Transaction excluding full receipts array, using offset

##### Paging

| Page   | Avg       | Stdev    | Max    |
| ------ | --------- | -------- | ------ |
| 1st    | 187.38 ms | 22.63 ms | 274 ms |
| 1000th | 191.83 ms | 20.81 ms | 267 ms |
| Last   | 459.62 ms | 33.55 ms | 537 ms |

##### Filtering by Transaction Type

| Type           | Avg       | Stdev    | Max    |
| -------------- | --------- | -------- | ------ |
| 0 (INVOKE)     | 275.92 ms | 57.19 ms | 488 ms |
| 1 (L1_HANDLER) | 265.72 ms | 47.78 ms | 405 ms |

Removing the receipt and make the retrieval of it into its own endpoint drastically reduce the amount of queries and thus reducing the latency.

However, as seen above, when doing a large offset its still relatively expensive to query.

The generated queries from the ORM (not including the counting) are as below:

```sql
SELECT "public"."Transaction"."id", "public"."Transaction"."txHash", "public"."Transaction"."blockNumber", "public"."Transaction"."txId", "public"."Transaction"."from", "public"."Transaction"."to", "public"."Transaction"."txTypeId" FROM "public"."Transaction" WHERE 1=1 ORDER BY "public"."Transaction"."id" DESC LIMIT $1 OFFSET $2
```

### Writes
