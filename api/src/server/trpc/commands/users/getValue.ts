import t from "@/server/trpc";
import { PrismaClient } from "@prisma/client";
import { BigNumber } from "ethers";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Get the total value of minted creator's collectibles.
 */
export default t.procedure
  .input(z.object({ userId: z.string() }))
  .output(z.string())
  .query(async ({ input }) => {
    const [real, fake] = await Promise.all([
      prisma.collectibleMintEvent
        .findMany({
          where: { Collectible: { creatorId: input.userId } },
          select: { income: true },
        })
        .then((mints) =>
          mints.reduce(
            (acc, mint) => acc.add(BigNumber.from(mint.income)),
            BigNumber.from(0)
          )
        ),
      prisma.collectible
        .findMany({
          where: { creatorId: input.userId },
          select: {
            fakeEditions: true,
            mintPrice: true,
          },
        })
        .then((collectibles) =>
          collectibles.reduce(
            (acc, c) =>
              acc.add(BigNumber.from(c.mintPrice).mul(c.fakeEditions)),
            BigNumber.from(0)
          )
        ),
    ]);

    return real.add(fake)._hex;
  });
