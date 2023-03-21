import { toBuffer } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import Web3Token from "web3-token";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export default async function (req: Request, res: Response) {
  if (!req.headers.authorization) {
    return res.status(401).send("Missing Authorization header");
  }

  const [type, token] = req.headers.authorization.split(" ");

  if (type !== "Web3-Token") {
    return res.status(400).send("Invalid authorization type");
  }

  let evmAddress;

  try {
    evmAddress = toBuffer(Web3Token.verify(token).address);
  } catch (e) {
    res.status(401).send("Invalid Web3-Token");
    return;
  }

  const user = await prisma.user.upsert({
    create: {
      id: nanoid(),
      evmAddress,
    },
    update: {},
    where: { evmAddress },
    select: { id: true },
  });

  res.cookie("userId", user.id, {
    maxAge: 1000 * 60 * 60 * 24 * 14, // 2 weeks
    httpOnly: true,
  });

  res.status(201).send(user.id);

  res.end();
}
