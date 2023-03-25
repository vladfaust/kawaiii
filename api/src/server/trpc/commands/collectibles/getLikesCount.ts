import { Hex32 } from "@/schema";
import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(z.object({ collectibleId: Hex32 }))
  .output(z.number().int())
  .query(async ({ input }) => {
    const [real, fake] = await Promise.all([
      prisma.like.count({
        where: { collectibleId: input.collectibleId },
      }),
      prisma.collectible
        .findUnique({
          where: { id: input.collectibleId },
          select: { fakeLikes: true },
        })
        .then((c) => c?.fakeLikes || 0),
    ]);

    return real + fake;
  });
