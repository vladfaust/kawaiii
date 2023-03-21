import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      followeeId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const followee = await prisma.user.findUnique({
      where: { id: input.followeeId },
    });

    if (!followee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Followee not found",
      });
    }

    await prisma.$transaction(async (prisma) => {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: ctx.user.id,
            followeeId: input.followeeId,
          },
        },
      });

      if (follow) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already following",
        });
      }

      await prisma.follow.create({
        data: {
          followerId: ctx.user.id,
          followeeId: input.followeeId,
        },
      });
    });
  });
