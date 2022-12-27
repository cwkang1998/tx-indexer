import { startApp } from "./app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

startApp(prisma)
  .listen(3000, () => {
    console.log(`Application started at ${3000}`);
  })
  .on("close", async () => {
    await prisma.$disconnect();
  });
