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
npm run db:migrate
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

### Schema design

The full schema can be seen in [schema.prisma](./prisma/schema.prisma).

Below is a simple ERD that describe the database schema.

<img src="./prisma/ERD.svg" width="250">

`Transaction` table `txHash` are explicitly indexed in order to improve query speed.

### Considerations

#### Implicit constraints

There are some implicit constraints that was considered when designing the indexing endpoint, regarding the nature of the transactions. Currently I've only accounted for the general cases of:

- Strictly sequential block and transactions starting from 0
- Gapless-ness of txIds and blockNumbers

One thing that was **not** implemented was the ability to rollback when the need arises, for example in re-orgs or forks.

#### Subject for querying

Depending on what fields should be queried, the schema should be modified accordingly. In this implementation only `Transaction.txHash` is explicitly indexed for quick querying of a specific transaction, other that the identity fields which is implicitly indexed by the db as well, since only paging and filtering via `txType` is considered.

`txType` is not indexed as its essentially an enum, and indexing it would not be very effective. However instead of storing it as `string`, its stored as an `integer` relation at least on the `Transaction` side, which should its performance, although with modern query engines, I'm not sure how much is the difference.

Ideally `from` and `to` fields should be indexed as well, if filtering with those fields are considered.

#### Normalization levels

The amount of normalization is always an important point for consideration during schema design.

In this case, I did not normalize the `from` and `to` fields as there were no filtering operations on them in the instructions provided, but one might consider normalizing those fields into perhaps an `Address` table if there are a lot of querying required and extra address based information other than transactions.

The normalization of the `TransactionType` enums of `L1_HANDLER` and `INVOKE` into its own table is done to with the idea of reducing redundancy and more efficient querying with integer in its id rather than a full string (requiring a string match).

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

#### Transaction excluding full receipts array, using cursor based pagination (not tested)

Given that the requirements is for offset based pagination, this was not implemented, but cursor based pagination might be more performant especially with the help of a good index.

A simple test via the current schema using the `id` column (which is indexed by default as the identity column), the time taken had reduced from ~`200ms` to ~`0.5ms`. Query used is as below:

```sql
SELECT "public"."Transaction"."id", "public"."Transaction"."txHash", "public"."Transaction"."blockNumber", "public"."Transaction"."txId", "public"."Transaction"."from", "public"."Transaction"."to", "public"."Transaction"."txTypeId" FROM "public"."Transaction" WHERE "public"."Transaction"."id" < 400001 ORDER BY "public"."Transaction"."id" DESC LIMIT $1;
```

### Writes

Writes to the db are benchmark for a few categories:

1. Single writes (using the api)
2. Bulk inserts

The data used for the writes are fully random in terms of its type (`L1_HANDLER` or `INVOKE`). More specific benchmark can be done for the specific type if required.

> Note that the implemented api calls for insertion can potentially be faster in a situation where bulk insert are used.

#### Single writes

This test is done via using `fetch` to call the api, albeit it being a single connection. This is done to insert 100 blocks with 100 transaction each, resulting in 100k total rows. The results are as below

| Avg     | Min | Max   |
| ------- | --- | ----- |
| 61.07ms | 9ms | 320ms |

Although each individual inserts are quite fast, the total time taken for inserting this amount of data is ~`10min`.

#### Single writes without checks in a single transaction

This test is done via direct querying to the database, albeit it being a single connection. This is done to insert 10 blocks with 100 transaction each, resulting in 10k total rows. The results are as below:

The resultant time taken is around `1m30s` for 10k rows, which is close to the single writes.

#### Bulk writes

This test is done via direct querying to the database, albeit it being a single connection. This is done to insert 10 blocks with 100 transaction each, resulting in 10k total rows. The results are as below:

The resultant time taken is around `37s` for 10k rows.

This can actually be improved even further with raw queries, since the current implementation uses transaction for inserting the receipts with transaction instead of bulk insert into the intermediate relation table.

#### Bulk writes improvement

With the above results, one improvement that we can directly make for the api is adding a buffer to store up a certain amount of transaction before bulk inserting, since bulk inserting is a lot more efficient when compared to single inserts.

Another possible improvement is removing the foreign key between transaction and receipt, and instead keep them as separated tables of `Receipt` and `ReceiptToTransaction`, resulting in a schema like so:

```prisma
model TransactionType {
  id   Int    @id @db.SmallInt
  name String @unique @db.VarChar(50)

  Transaction Transaction[]
}

model ReceiptToTransaction {
  txHash String @db.VarChar(100)

  receiptHash String  @db.VarChar(100)
  receipt     Receipt @relation(fields: [receiptHash], references: [hash])

  @@unique([txHash, receiptHash])
  @@index([txHash])
}

model Receipt {
  hash    String @id @db.VarChar(100)
  payload String @db.Text

  txRef ReceiptToTransaction[]
}

model Transaction {
  id          BigInt @id @default(autoincrement())
  txHash      String @unique @db.VarChar(100)
  blockNumber BigInt
  txId        BigInt
  from        String @db.VarChar(100)
  to          String @db.VarChar(100)

  txTypeId Int
  txType   TransactionType @relation(fields: [txTypeId], references: [id])

  @@unique([blockNumber, txId])
  @@index([txHash])
}
```

We can then use `ReceiptTransaction` table for querying:

```sql
SELECT * FROM ReceiptToTransaction WHERE txHash = $1 LEFT JOIN Receipt ON ReceiptToTransaction.receiptHash = Receipt.hash;
```

Although this setup would complicate insertion a bit more, but if write is a big concern this might help.
