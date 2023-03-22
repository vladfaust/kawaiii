import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// TODO: Make it return id only.
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
        verified: true,
        name: true,
        bio: true,
        pfpVersion: true,
        bgpVersion: true,
      },
    });
  });
