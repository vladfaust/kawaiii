import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: {
        id: input.id,
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

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  });
