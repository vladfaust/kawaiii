import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Get the amount of likes a user's collectibles have received in total.
 */
export default t.procedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .output(z.number().int())
  .query(async ({ input }) => {
    const collectibles = await prisma.collectible.findMany({
      where: { creatorId: input.userId },
      select: { id: true },
    });

    return await prisma.like.count({
      where: {
        collectibleId: {
          in: collectibles.map((collectible) => collectible.id),
        },
      },
    });
  });
