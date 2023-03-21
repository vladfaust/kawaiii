import config from "@/config";
import { toHex } from "@/utils";
import {
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import pRetry from "p-retry";

export const client = new S3Client({
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  region: config.s3.region,
  endpoint: config.s3.endpoint.toString(),
});

export async function keyExists(key: string) {
  try {
    await pRetry(
      () =>
        client.send(
          new HeadObjectCommand({ Bucket: config.s3.bucket, Key: key })
        ),
      {
        onFailedAttempt: (error) => {
          if (error instanceof NotFound) {
            throw error;
          }
        },
      }
    );

    return true;
  } catch (e) {
    if (e instanceof NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}

/**
 * Pipe an object at key from S3 to a WritableStream.
 */
export async function pipeTo(key: string, to: WritableStream) {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  const response = await pRetry(() => client.send(command));
  const readableStream = response.Body!.transformToWebStream();

  await readableStream.pipeTo(to);
}

export async function upload(key: string, data: string | Buffer) {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: data,
  });

  await pRetry(() => client.send(command));
}

/**
 * @returns `collectibles/${toHex(collectibleId)}/preview/preview`
 */
export function collectiblePreviewPreviewKey(collectibleId: Buffer) {
  return `collectibles/${toHex(collectibleId)}/preview/preview`;
}

/**
 * @returns `collectibles/${toHex(collectibleId)}/preview`
 */
export function collectiblePreviewKey(collectibleId: Buffer) {
  return `collectibles/${toHex(collectibleId)}/preview`;
}

/**
 * @returns `collectibles/${toHex(collectibleId)}/content/${contentName}/previewBlurred`
 */
export function contentPreviewBlurredKey(
  collectibleId: Buffer,
  contentName: string
) {
  return `collectibles/${toHex(
    collectibleId
  )}/content/${contentName}/previewBlurred`;
}

/**
 * @returns `collectibles/${toHex(collectibleId)}/content/${contentName}/preview`
 */
export function contentPreviewKey(collectibleId: Buffer, contentName: string) {
  return `collectibles/${toHex(collectibleId)}/content/${contentName}/preview`;
}

/**
 * @returns `collectibles/${toHex(collectibleId)}/content/${contentName}`
 */
export function contentKey(collectibleId: Buffer, contentName: string) {
  return `collectibles/${toHex(collectibleId)}/content/${contentName}`;
}

/**
 * @returns `users/${userId}/bgp/fullRes`
 */
export function userBgpFullResKey(userId: string) {
  return `users/${userId}/bgp/fullRes`;
}

/**
 * @returns `users/${userId}/bgp-${version}`
 */
export function userBgpLowResKey(userId: string, version: number) {
  return `users/${userId}/bgp-${version}`;
}

/**
 * @returns `users/${userId}/pfp/fullRes`
 */
export function userPfpFullResKey(userId: string) {
  return `users/${userId}/pfp/fullRes`;
}

/**
 * @returns `users/${userId}/pfp-${version}`
 */
export function userPfpLowResKey(userId: string, version: number) {
  return `users/${userId}/pfp-${version}`;
}

export async function getUploadUrl(key: string, expiresIn: number) {
  return await pRetry(() =>
    getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      }),
      {
        expiresIn,
      }
    )
  );
}
