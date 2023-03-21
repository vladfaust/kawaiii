import { PrismaClient } from "@prisma/client";
import { NextFunction, Response, Request } from "express";

const prisma = new PrismaClient();

export type User = {
  id: String;
  evmAddress: Buffer;
};

export default async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.cookies.userId) {
    const user = await prisma.user.findUnique({
      where: { id: req.cookies.userId },
      select: {
        id: true,
        evmAddress: true,
      },
    });

    if (!user) {
      res.status(401).send("Invalid userId cookie");
      return;
    }

    res.locals.user = user satisfies User;
  }

  next();
}
