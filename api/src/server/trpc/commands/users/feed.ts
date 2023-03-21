import { protectedProcedure } from "#trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Returns the current user's feed.
 * The feed is comprised of the following:
 *
 * - Collectibles created by the user
 * - Collectibles created by the user's followees
 */
export default protectedProcedure.query(async ({ ctx }) => {
  const followees = await prisma.follow.findMany({
    where: { followerId: ctx.user.id },
    select: { followeeId: true },
  });

  const createdCollectibles = await prisma.collectible.findMany({
    where: {
      creatorId: {
        in: [ctx.user.id, ...followees.map((f) => f.followeeId)],
      },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return createdCollectibles.map((c) => c.id);
});
