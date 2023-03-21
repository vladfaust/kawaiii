import { protectedProcedure } from "#trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Return whether the current user is following the user with the given ID.
 */
export default protectedProcedure
  .input(
    z.object({
      followeeId: z.string(),
    })
  )
  .output(z.boolean())
  .query(async ({ ctx, input }) => {
    return (
      (await prisma.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: ctx.user.id,
            followeeId: input.followeeId,
          },
        },
      })) !== null
    );
  });
