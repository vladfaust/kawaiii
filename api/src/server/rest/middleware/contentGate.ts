import { Hex32 } from "@/schema";
import { balanceOfCollectible } from "@/services/eth";
import { contentKey, keyExists } from "@/services/s3";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { User } from "./auth";

const SCHEMA = z.object({
  collectibleId: Hex32,
  contentName: z.string(),
});

export type Content = {
  collectibleId: Buffer;
  name: string;
};

const prisma = new PrismaClient();

// This middleware extracts `collectibleId` and `contentName` from the request.
// It sets `res.locals.content` to the content object.
// And checks that the user has enough balance to access the content.
export default async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    select: {
      type: true,
      name: true,
      gated: true,
      Collectible: {
        select: { creatorId: true },
      },
    },
  });

  if (!content) {
    return res.status(404).send("Content not found");
  }

  if (!keyExists(contentKey(collectibleId, contentName))) {
    return res.status(422).send("Content not ready");
  }

  if (content.gated) {
    const user: User | undefined = res.locals.user;

    if (!user) {
      return res.status(401);
    }

    if (user.id === content.Collectible.creatorId) {
      return next(); // Creator can access their gated content.
    }

    const balance = await balanceOfCollectible(collectibleId, user.evmAddress);

    if (balance.lt(1)) {
      return res.status(402).send("Not enough balance");
    }
  }

  res.locals.content = {
    collectibleId,
    name: contentName,
  } satisfies Content;

  next();
}
