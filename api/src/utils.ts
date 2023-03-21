import { ethers } from "ethers";
import { z } from "zod";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function timeout<T>(
  ms: number,
  promise: Promise<T>,
  message?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(message || "Timed out in " + ms + "ms."));
    }, ms);

    promise.then(resolve, reject);
  });
}

export function toBuffer(
  value: Parameters<typeof ethers.utils.arrayify>[0]
): Buffer {
  return Buffer.from(ethers.utils.arrayify(value));
}

export function toHex(
  value: Parameters<typeof ethers.utils.hexlify>[0]
): string {
  return ethers.utils.hexlify(value);
}
