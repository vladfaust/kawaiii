import t from "@/server/trpc";
import { latestPrice } from "@/services/eth";
import redis from "@/services/redis";
import { z } from "zod";

const PRICE_KEY = "ethPrice";
const PRICE_CACHE_TTL = 60;

/**
 * Get the number of followers for a user.
 */
export default t.procedure.output(z.number()).query(async ({ input }) => {
  const cached = await redis.get(PRICE_KEY);

  if (cached) {
    return Number(cached);
  } else {
    const price = await latestPrice();
    await redis.set(PRICE_KEY, price.toString(), "EX", PRICE_CACHE_TTL);
    return price;
  }
});
