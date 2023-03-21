import { protectedProcedure } from "#trpc/middleware/auth";
import { z } from "zod";
import { getUploadUrl, userBgpFullResKey } from "@/services/s3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default protectedProcedure
  .output(z.string().url())
  .query(async ({ ctx }) => {
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { bgpVersion: { increment: 1 } },
    });

    return getUploadUrl(
      userBgpFullResKey(ctx.user.id),
      60 * 5 // 5 minutes
    );
  });
