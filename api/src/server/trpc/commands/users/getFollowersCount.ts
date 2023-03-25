import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Get the number of followers for a user.
 */
export default t.procedure
  .input(z.object({ followeeId: z.string() }))
  .output(z.number().int())
  .query(async ({ input }) => {
    const [real, fake] = await Promise.all([
      prisma.follow.count({
        where: { followeeId: input.followeeId },
      }),
      prisma.user
        .findUnique({
          where: { id: input.followeeId },
          select: { fakeFollowers: true },
        })
        .then((u) => u?.fakeFollowers || 0),
    ]);

    return real + fake;
  });
