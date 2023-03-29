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

export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
