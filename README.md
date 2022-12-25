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
npx prisma migrate dev
```

With that done, you can now finally run your server, which would be on localhost:3000

```bash
npm start
```

## Design

### ERD

A simple ERD showing the database schema.

![ERDOverview](./prisma/ERD.svg)
