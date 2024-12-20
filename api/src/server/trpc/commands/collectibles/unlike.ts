import { protectedProcedure } from "#trpc/middleware/auth";
import { Hex32 } from "@/schema";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(z.object({ collectibleId: Hex32 }))
  .mutation(async ({ ctx, input }) => {
    await prisma.$transaction(async (prisma) => {
      const like = await prisma.like.findUnique({
        where: {
          userId_collectibleId: {
            userId: ctx.user.id,
            collectibleId: toHex(input.collectibleId),
          },
        },
      });

      if (!like) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You haven't liked this collectible",
        });
      }

      await prisma.like.delete({
        where: {
          userId_collectibleId: {
            userId: ctx.user.id,
            collectibleId: toHex(input.collectibleId),
          },
        },
      });
    });
  });
