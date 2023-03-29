import { Hex, Hex32 } from "@/schema";
import t from "@/server/trpc";
import { toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { BigNumber } from "ethers";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Returns editions count: real and fake.
 */
export default t.procedure
  .input(z.object({ collectibleId: Hex32 }))
  .output(Hex)
  .query(async ({ input }) => {
    const [real, fake] = await Promise.all([
      prisma.collectibleMintEvent
        .findMany({
          where: { collectibleId: toHex(input.collectibleId) },
          select: { amount: true },
        })
        .then((mints) =>
          mints.reduce(
            (acc, mint) => acc.add(BigNumber.from(mint.amount)),
            BigNumber.from(0)
          )
        ),
      prisma.collectible
        .findUnique({
          where: { id: toHex(input.collectibleId) },
          select: { fakeEditions: true },
        })
        .then((c) => c?.fakeEditions),
    ]);

    if (fake === undefined) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collectible not found",
      });
    }

    return real.add(fake)._hex;
  });
