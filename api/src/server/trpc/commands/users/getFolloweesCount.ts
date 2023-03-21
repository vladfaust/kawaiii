import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * Get the number of followees for the current user (private).
 */
export default protectedProcedure
  .output(z.number().int())
  .query(async ({ ctx }) => {
    return prisma.follow.count({
      where: { followerId: ctx.user.id },
    });
  });
