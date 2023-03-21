import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import * as s3Express from "@/services/s3+express";
import * as s3 from "@/services/s3";
import sharp from "sharp";
import { Hex32 } from "@/schema";
import { LOWRES } from "./preview";

const prisma = new PrismaClient();

const SCHEMA = z.object({
  collectibleId: Hex32,
  contentName: z.string(),
});

/**
 * Content ownership is NOT required to access the blurred preview.
 */
export default async function (req: Request, res: Response) {
  const { collectibleId, contentName } = SCHEMA.parse({
    collectibleId: res.locals.collectibleId,
    contentName: req.params.contentName,
  });

  const content = await prisma.collectibleContent.findUnique({
    where: {
      collectibleId_name: {
        collectibleId,
        name: contentName,
      },
    },
  });

  if (!content) {
    return res.status(404).send("Content not found");
  }

  const contentKey = s3.contentKey(collectibleId, contentName);

  if (!s3.keyExists(contentKey)) {
    return res.status(422).send("Content not ready");
  }

  const contentPreviewKey = s3.contentPreviewKey(collectibleId, contentName);

  const contentPreviewBlurredKey = s3.contentPreviewBlurredKey(
    collectibleId,
    contentName
  );

  if (!(await s3.keyExists(contentPreviewBlurredKey))) {
    let img: sharp.Sharp | undefined;

    if (!(await s3.keyExists(contentPreviewKey))) {
      // If the preview doesn't exist yet, generate it.
      // OPTIMIZE: Avoid parallel generation of the same preview.
      //

      let contentBuf = new Uint8Array();
      const stream = new WritableStream({
        write: async (chunk) => {
          contentBuf = Buffer.concat([contentBuf, chunk]);
        },
      });
      await s3.pipeTo(contentKey, stream);

      img = sharp(contentBuf).resize(LOWRES);
      await s3.upload(contentPreviewKey, await img.toBuffer());
    } else {
      // If the preview already exists, use it instead of regenerating it.
      //

      let previewBuf = new Uint8Array();
      const stream = new WritableStream({
        write: async (chunk) => {
          previewBuf = Buffer.concat([previewBuf, chunk]);
        },
      });
      await s3.pipeTo(contentPreviewKey, stream);

      img = sharp(previewBuf);
    }

    img.blur(10);
    await s3.upload(contentPreviewBlurredKey, await img.toBuffer());
  }

  await s3Express.pipeTo(contentPreviewBlurredKey, res);
}
