import { Hex32 } from "@/schema";
import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(z.object({ collectibleId: Hex32 }))
  .query(async ({ input }) => {
    return await prisma.like.count({
      where: { collectibleId: input.collectibleId },
    });
  });
