import { Request, Response } from "express";
import * as s3 from "@/services/s3";
import * as s3Express from "@/services/s3+express";
import { PrismaClient } from "@prisma/client";
import { Hex32 } from "@/schema";
import { z } from "zod";

const prisma = new PrismaClient();

const SCHEMA = z.object({
  collectibleId: Hex32,
});

export default async function (req: Request, res: Response) {
  const { collectibleId } = SCHEMA.parse(req.params);

  const collectible = await prisma.collectible.findUnique({
    where: { id: collectibleId },
  });

  if (!collectible) {
    return res.status(404).send("Collectible not found");
  }

  const key = s3.collectiblePreviewKey(collectibleId);

  if (!(await s3.keyExists(key))) {
    return res.status(422).send("Collectible preview not ready");
  }

  await s3Express.pipeTo(key, res, {
    cacheMaxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
