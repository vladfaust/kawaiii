import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      handle: z.string().min(8).max(32).nullable().optional(),
      name: z.string().min(1).max(32).nullable().optional(),
      bio: z.string().max(1024).nullable().optional(),
      links: z.array(z.string().max(1024)).optional(),
    })
  )
  .output(z.void())
  .mutation(async ({ input, ctx }) => {
    if (
      input.handle === undefined &&
      input.name === undefined &&
      input.bio === undefined &&
      input.links === undefined
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nothing to update",
      });
    }

    const verified = input.handle !== undefined ? false : undefined;

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        handle: input.handle,
        verified,
        name: input.name,
        bio: input.bio,
        links: input.links ? JSON.stringify(input.links) : undefined,
      },
    });
  });
