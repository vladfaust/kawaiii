import { asyncComputed } from "@vueuse/core";
import rest from "./api/rest";
import trpc from "./api/trpc";

export { rest, trpc };

export const ethPrice = asyncComputed(async () => {
  return await trpc.commands.ethPrice.query();
});
