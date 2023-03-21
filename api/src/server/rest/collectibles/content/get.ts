import { Request, Response } from "express";
import * as s3Express from "@/services/s3+express";
import { contentKey } from "@/services/s3";
import { Content } from "../../middleware/contentGate";

/**
 * Ownership is required to access gated content.
 */
export default async function (req: Request, res: Response) {
  await s3Express.pipeTo(
    contentKey(
      (res.locals.content as Content).collectibleId,
      (res.locals.content as Content).name
    ),
    res
  );
}
