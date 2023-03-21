import { Request, Response } from "express";

export default async function (req: Request, res: Response) {
  // Return the userId cookie.
  res.send(req.cookies.userId);
}
