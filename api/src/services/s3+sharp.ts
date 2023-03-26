import sharp from "sharp";
import * as s3 from "./s3";

export async function processIfNotExists(
  sourceKey: string,
  targetKey: string,
  processFn: (sharp: sharp.Sharp) => Promise<sharp.Sharp>
) {
  if (await s3.keyExists(targetKey)) {
    return;
  }

  let buf = new Uint8Array();
  const stream = new WritableStream({
    write: async (chunk) => {
      buf = Buffer.concat([buf, chunk]);
    },
  });
  await s3.pipeTo(sourceKey, stream);

  const img = await processFn(sharp(buf));
  await s3.upload(targetKey, await img.toBuffer());
}
