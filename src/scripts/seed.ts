import { PrismaClient } from "@prisma/client";

const seed = async () => {
  const prismaClient = new PrismaClient();

  await prismaClient.transactionType.create({
    data: {
      id: 0,
      name: "INVOKE",
    },
  });

  await prismaClient.transactionType.create({
    data: {
      id: 1,
      name: "L1_HANDLER",
    },
  });
};

seed().catch((err) => console.error(err));
