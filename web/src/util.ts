import { ethers } from "ethers";

export function tap<T>(object: T, fn: (object: T) => void): T {
  fn(object);
  return object;
}

export function nonNullable<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value is null or undefined");
  }

  return value;
}

export function toUint8Array(
  value: Parameters<typeof ethers.utils.arrayify>[0]
): Uint8Array {
  return ethers.utils.arrayify(value);
}

export function toHex(
  value: Parameters<typeof ethers.utils.hexlify>[0]
): string {
  return ethers.utils.hexlify(value);
}
