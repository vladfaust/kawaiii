import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { toBuffer, toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { BigNumber } from "ethers";
import { z } from "zod";
import { contentKey, collectiblePreviewKey, getUploadUrl } from "@/services/s3";
import config from "@/config";
import { KawaiiiCollectible__factory } from "@kawaiiico/contracts/typechain";
import { httpProvider, wallet } from "@/services/eth";
import { TRPCError } from "@trpc/server";
import { CollectibleContent, Hex, Hex32 } from "@/schema";

const MAX_TOTAL_CONTENT_SIZE = 1024 * 1024 * 128; // 128 MiB

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      id: Hex32,
      preview: z.object({
        size: z.number().max(1024 * 1024 * 2), // 2MiB
      }),
      name: z.string().min(1).max(128),
      description: z.string().max(1024).nullable(),
      mintPrice: Hex.transform((value) => BigNumber.from(value)).refine(
        (value) => value.gt(0),
        {
          message: "Must be greater than 0",
        }
      ), // In wei
      editions: z.number().min(1).max(1000),
      royalty: z.number().max(255),
      content: z.array(CollectibleContent).max(32),
      signature: Hex,
    })
  )
  .output(
    z.object({
      creationTxHash: Hex,
      previewUploadUrl: z.string(),
      contentUploadUrls: z.array(z.string()),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const totalContentSize = input.content.reduce(
      (acc, content) => acc + content.size,
      0
    );

    if (totalContentSize > MAX_TOTAL_CONTENT_SIZE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Total content size exceeds limit",
      });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: { evmAddress: true },
    });

    const contract = KawaiiiCollectible__factory.connect(
      toHex(config.eth.collectibleContractAddress),
      wallet
    );

    const feeData = await httpProvider.getFeeData();

    const tx = await contract.createWithSignature(
      toHex(user.evmAddress),
      input.id,
      input.editions,
      input.mintPrice,
      input.royalty,
      toBuffer(input.signature),
      {
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
      }
    );

    const collectible = await prisma.collectible.create({
      data: {
        id: toHex(input.id),
        creatorId: ctx.user.id,
        name: input.name,
        description: input.description,
        mintPrice: toBuffer(input.mintPrice._hex),
        editions: input.editions,
        royalty: input.royalty,
        Content: {
          createMany: {
            data: input.content.map((content) => ({
              type: content.type,
              name: content.name,
              size: content.size,
              gated: content.gated,
            })),
          },
        },
      },
    });

    const previewUploadUrl = await getUploadUrl(
      collectiblePreviewKey(input.id),
      60 * 5 // 5 minutes
    );

    const contentUploadUrls = await Promise.all(
      input.content.map(async (content) => {
        return await getUploadUrl(
          contentKey(input.id, content.name),
          60 * 5 // 5 minutes
        );
      })
    );

    return {
      creationTxHash: tx.hash,
      previewUploadUrl,
      contentUploadUrls,
    };
  });
