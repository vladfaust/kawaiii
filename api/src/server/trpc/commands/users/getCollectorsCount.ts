import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
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
    const [real, fake] = await Promise.all([
      prisma.collectibleBalance.groupBy({
        by: ["userId"],
        where: {
          Collectible: { creatorId: input.userId },
          balance: { gt: 0 },
        },
      }),
      prisma.user
        .findUnique({
          where: { id: input.userId },
          select: { fakeCollectors: true },
        })
        .then((user) => user?.fakeCollectors),
    ]);

    if (fake === undefined) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return real.length + fake;
  });
