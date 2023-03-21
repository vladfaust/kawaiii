import { NextFunction, Request, Response } from "express";
import { z } from "zod";

// This middleware catches `ZodError` and returns a 400 error with the error message.
export default async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    next();
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      res.status(400).send(e.message);
    } else {
      throw e;
    }
  }
}
