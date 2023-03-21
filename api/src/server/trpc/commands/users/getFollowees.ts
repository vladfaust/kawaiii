import { protectedProcedure } from "#trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Get the IDs of the users that the current user is following.
 */
export default protectedProcedure
  .output(z.array(z.string()))
  .query(async ({ ctx }) => {
    return (
      await prisma.follow.findMany({
        where: { followerId: ctx.user.id },
        select: { followeeId: true },
      })
    ).map((follow) => follow.followeeId);
  });
