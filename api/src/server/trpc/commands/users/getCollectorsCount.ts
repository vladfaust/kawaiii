import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Returns the amount of users who collected
 * at least one item from the given user.
 */
export default t.procedure
  .input(z.object({ userId: z.string() }))
  .output(z.number())
  .query(async ({ input }) => {
    const res = await prisma.collectibleBalance.groupBy({
      by: ["userId"],
      where: {
        Collectible: { creatorId: input.userId },
        balance: { gt: 0 },
      },
    });

    return res.length;
  });
