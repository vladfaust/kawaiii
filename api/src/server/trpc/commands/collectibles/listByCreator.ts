import t from "@/server/trpc";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(z.object({ creatorId: z.string() }))
  .output(z.string().array())
  .query(async ({ input }) => {
    const collectibles = await prisma.collectible.findMany({
      where: { Creator: { id: input.creatorId } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    return collectibles.map((c) => toHex(c.id));
  });
