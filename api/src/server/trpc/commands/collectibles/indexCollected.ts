import t from "@/server/trpc";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .output(z.array(z.string()))
  .query(async ({ input }) => {
    return await prisma.collectibleBalance
      .findMany({
        where: {
          userId: input.userId,
          balance: {
            gt: 0,
          },
        },
        select: {
          collectibleId: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
      .then((balances) => {
        return balances.map((balance) => toHex(balance.collectibleId));
      });
  });
