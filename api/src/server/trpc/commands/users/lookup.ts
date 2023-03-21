import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(
    z.object({
      handle: z.string(),
    })
  )
  .query(async ({ input }) => {
    return await prisma.user.findUnique({
      where: {
        handle: input.handle,
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
  });
