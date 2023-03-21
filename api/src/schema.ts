import { ethers } from "ethers";
import { z } from "zod";
import { toBuffer } from "./utils";

export const Hex = z
  .string()
  .refine((value) => ethers.utils.isHexString(value), {
    message: "Must be a byte hex string",
  })
  .transform((value) => toBuffer(value));

export const Hex32 = Hex.refine((value) => value.length === 32, {
  message: "Must be 32 bytes",
});

export const Address = z
  .string()
  .refine((value) => ethers.utils.isAddress(value), {
    message: `Must be an address`,
  })
  .transform((value) => toBuffer(value));

export const CollectibleContent = z.object({
  type: z.enum(["Image"]),
  name: z.string().min(1).max(255),
  size: z.number(), // In bytes
  gated: z.boolean(),
});
