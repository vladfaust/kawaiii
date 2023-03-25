import { protectedProcedure } from "#trpc/middleware/auth";
import { Hex32 } from "@/schema";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(z.object({ collectibleId: Hex32 }))
  .output(z.boolean())
  .query(async ({ input, ctx }) => {
    return await prisma.like
      .findUnique({
        where: {
          userId_collectibleId: {
            userId: ctx.user.id,
            collectibleId: toHex(input.collectibleId),
          },
        },
      })
      .then((like) => !!like);
  });
