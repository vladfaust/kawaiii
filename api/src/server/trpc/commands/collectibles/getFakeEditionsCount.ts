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
    const collectible = await prisma.collectible.findUnique({
      where: { id: toHex(input.collectibleId) },
      select: { fakeEditions: true },
    });

    if (!collectible) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collectible not found",
      });
    }

    return collectible.fakeEditions;
  });
