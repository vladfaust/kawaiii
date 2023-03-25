import { Request, Response } from "express";
import * as s3 from "@/services/s3";
import * as s3Express from "@/services/s3+express";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Hex32 } from "@/schema";
import { toHex } from "@/utils";

export const LOWRES = 512;

const prisma = new PrismaClient();

const SCHEMA = z.object({
  collectibleId: Hex32,
});

export default async function (req: Request, res: Response) {
  const { collectibleId } = SCHEMA.parse(req.params);

  const collectible = await prisma.collectible.findUnique({
    where: { id: toHex(collectibleId) },
  });

  if (!collectible) {
    return res.status(404).send("Collectible not found");
  }

  const preview2Key = s3.collectiblePreviewPreviewKey(collectibleId);
  const previewKey = s3.collectiblePreviewKey(collectibleId);

  if (!(await s3.keyExists(preview2Key))) {
    let buf = new Uint8Array();

    const stream = new WritableStream({
      write: async (chunk) => {
        buf = Buffer.concat([buf, chunk]);
      },
    });

    await s3.pipeTo(previewKey, stream);

    console.time("Generated preview^2 for " + toHex(collectibleId));
    const img = sharp(buf).resize(LOWRES);
    console.timeEnd("Generated preview^2 for " + toHex(collectibleId));

    await s3.upload(preview2Key, await img.toBuffer());
  }

  await s3Express.pipeTo(preview2Key, res, {
    cacheMaxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
