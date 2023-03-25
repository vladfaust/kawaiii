import { Hex32 } from "@/schema";
import t from "@/server/trpc";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(z.object({ collectibleId: Hex32 }))
  .output(z.number().int())
  .query(async ({ input }) => {
    const [real, fake] = await Promise.all([
      prisma.like.count({
        where: { collectibleId: toHex(input.collectibleId) },
      }),
      prisma.collectible
        .findUnique({
          where: { id: toHex(input.collectibleId) },
          select: { fakeLikes: true },
        })
        .then((c) => c?.fakeLikes),
    ]);

    if (fake === undefined) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collectible not found",
      });
    }

    return real + fake;
  });
