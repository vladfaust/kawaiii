import { Hex32 } from "@/schema";
import t from "@/server/trpc";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(z.object({ id: Hex32 }))
  .query(async ({ input }) => {
    const collectible = await prisma.collectible.findUnique({
      where: { id: toHex(input.id) },
      select: {
        id: true,
        Creator: { select: { id: true } },
        name: true,
        description: true,
        mintPrice: true,
        editions: true,
        royalty: true,
        createdAt: true,
        Content: {
          select: {
            id: true,
            type: true,
            name: true,
            size: true,
            gated: true,
          },
        },
      },
    });

    if (!collectible) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collectible not found",
      });
    }

    return collectible;
  });
