import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import * as s3 from "@/services/s3";
import * as s3Express from "@/services/s3+express";
import * as s3Sharp from "@/services/s3+sharp";

const prisma = new PrismaClient();

const SCHEMA = z.object({
  userId: z.string(),
});

export default async function (req: Request, res: Response) {
  const { userId } = SCHEMA.parse(req.params);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      pfpVersion: true,
    },
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  const fullResKey = s3.userPfpFullResKey(userId);

  if (!(await s3.keyExists(fullResKey))) {
    return res.status(404).send("User has no profile picture");
  }

  const lowResKey = s3.userPfpLowResKey(userId, user.pfpVersion);

  await s3Sharp.processIfNotExists(fullResKey, lowResKey, async (img) =>
    img.resize(256)
  );

  await s3Express.pipeTo(lowResKey, res, {
    cacheMaxAge: 60 * 60 * 24 * 30, // 1 month
  });
}
