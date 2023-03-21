import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Hex32 } from "@/schema";
import { toHex } from "@/utils";

const prisma = new PrismaClient();

const SCHEMA = z.object({
  collectibleId: Hex32,
});

export default async function (req: Request, res: Response) {
  const { collectibleId } = SCHEMA.parse(req.params);

  const collectible = await prisma.collectible.findUnique({
    where: { id: collectibleId },
    select: {
      name: true,
      description: true,
      Content: {
        select: {
          type: true,
          name: true,
          size: true,
          gated: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!collectible) {
    return res.status(404).send("Collectible not found");
  }

  const metadata = {
    name: collectible.name,
    description: collectible.description,
    image: `/rest/collectibles/${toHex(collectibleId)}/preview`,
    properties: {
      content: collectible.Content.map((content) => ({
        type: content.type,
        uri: `/rest/collectibles/${toHex(collectibleId)}/content/${
          content.name
        }`,
        size: content.size,
      })),
    },
  };

  res.json(metadata);
}
