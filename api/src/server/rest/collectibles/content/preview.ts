import { Request, Response } from "express";
import * as s3 from "@/services/s3";
import * as s3Express from "@/services/s3+express";
import { Content } from "#rest/middleware/contentGate";
import sharp from "sharp";

export const LOWRES = 512;

/**
 * A preview is a low-resolution version of the content.
 * Content ownership is required to access preview.
 */
export default async function (req: Request, res: Response) {
  console.log("content/preview");

  const content = res.locals.content as Content;

  const contentKey = s3.contentKey(content.collectibleId, content.name);

  const contentPreviewKey = s3.contentPreviewKey(
    content.collectibleId,
    content.name
  );

  if (!(await s3.keyExists(contentPreviewKey))) {
    let buf = new Uint8Array();

    const stream = new WritableStream({
      write: async (chunk) => {
        buf = Buffer.concat([buf, chunk]);
      },
    });

    await s3.pipeTo(contentKey, stream);
    const img = sharp(buf).resize(LOWRES);
    await s3.upload(contentPreviewKey, await img.toBuffer());
  }

  console.log("contentPreviewKey", contentPreviewKey);

  await s3Express.pipeTo(contentPreviewKey, res, {
    cacheMaxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
