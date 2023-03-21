import { protectedProcedure } from "#trpc/middleware/auth";
import { Hex32 } from "@/schema";
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
            collectibleId: input.collectibleId,
          },
        },
      });

      if (like) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already liked this collectible",
        });
      }

      await prisma.like.create({
        data: {
          userId: ctx.user.id,
          collectibleId: input.collectibleId,
        },
      });
    });
  });
