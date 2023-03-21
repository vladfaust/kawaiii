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
    await prisma.$transaction(async (prisma) => {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: ctx.user.id,
            followeeId: input.followeeId,
          },
        },
      });

      if (!follow) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not following",
        });
      }

      await prisma.follow.delete({
        where: {
          followerId_followeeId: {
            followerId: ctx.user.id,
            followeeId: input.followeeId,
          },
        },
      });
    });
  });
