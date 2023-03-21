import config from "@/config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Response } from "express";
import pRetry from "p-retry";
import * as s3 from "./s3";

export async function pipeTo(
  Key: string,
  res: Response,
  { cacheMaxAge = 86400 } = {}
) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key,
  });

  const response = await pRetry(() => s3.client.send(command));

  res.set("Content-Type", response.ContentType);
  res.set("Content-Length", response.ContentLength?.toString());
  res.set("ETag", response.ETag);
  res.set("Last-Modified", response.LastModified?.toString());
  res.set("Cache-Control", "max-age=" + cacheMaxAge);

  const readableStream = response.Body!.transformToWebStream();

  const writeableStream = new WritableStream({
    write(chunk) {
      res.write(chunk);
    },
    close() {
      res.end();
    },
  });

  await readableStream.pipeTo(writeableStream);
}
