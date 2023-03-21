import { protectedProcedure } from "#trpc/middleware/auth";
import { Hex32 } from "@/schema";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(z.object({ collectibleId: Hex32 }))
  .output(z.boolean())
  .query(async ({ input, ctx }) => {
    // FIXME: Direct query won't match collectibleId.
    const [like] = await prisma.$transaction(
      [
        prisma.like.findUnique({
          where: {
            userId_collectibleId: {
              userId: ctx.user.id,
              collectibleId: input.collectibleId,
            },
          },
        }),
      ],
      {
        isolationLevel: "ReadCommitted",
      }
    );

    return !!like;
  });
