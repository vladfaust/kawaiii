import t from "@/server/trpc";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * List collectibles liked by user, filtering out
 * collectibles created by the user themselves.
 */
export default t.procedure
  .input(z.object({ userId: z.string() }))
  .output(z.string().array())
  .query(async ({ input }) => {
    const likes = await prisma.like.findMany({
      where: { User: { id: input.userId } },
      select: {
        Collectible: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    return likes
      .filter((l) => l.Collectible.creatorId !== input.userId)
      .map((l) => toHex(l.Collectible.id));
  });
