import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      handle: z.string().min(10).max(32).optional(),
      name: z.string().min(1).max(32).optional(),
      bio: z.string().max(1024).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    if (
      input.handle === undefined &&
      input.name === undefined &&
      input.bio === undefined
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nothing to update",
      });
    }

    const user = await prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        handle: input.handle,
        name: input.name,
        bio: input.bio,
      },
      select: {
        id: true,
        handle: true,
        name: true,
        bio: true,
        pfpVersion: true,
        bgpVersion: true,
      },
    });

    return user;
  });
