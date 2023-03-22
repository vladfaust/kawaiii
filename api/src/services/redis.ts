import config from "@/config.js";
import { Redis } from "ioredis";

export function client() {
  return new Redis(config.redisUrl.toString());
}

export default client();
