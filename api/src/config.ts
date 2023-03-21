import * as dotenv from "dotenv";
import { toBuffer } from "./utils";

dotenv.config();

class Server {
  constructor(
    readonly host: string,
    readonly port: number,
    readonly corsOrigin: string
  ) {}
}

class Eth {
  constructor(
    readonly chainId: number,
    readonly httpRpcUrl: URL,
    readonly privateKey: Buffer,
    readonly collectibleContractAddress: Buffer
  ) {}
}

class S3 {
  constructor(
    readonly accessKeyId: string,
    readonly secretAccessKey: string,
    readonly endpoint: URL,
    readonly region: string,
    readonly bucket: string
  ) {}
}

class OffchainCafe {
  constructor(readonly serverHost: string, readonly serverPort: number) {}
}

class Config {
  constructor(
    readonly prod: boolean,
    readonly databaseUrl: URL,
    readonly redisUrl: URL,
    readonly server: Server,
    readonly eth: Eth,
    readonly s3: S3,
    readonly offchainCafe: OffchainCafe
  ) {}
}

function requireEnv(id: string): string {
  if (process.env[id]) return process.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  process.env.NODE_ENV === "production",
  new URL(requireEnv("DATABASE_URL")),
  new URL(requireEnv("REDIS_URL")),
  new Server(
    requireEnv("SERVER_HOST"),
    parseInt(requireEnv("SERVER_PORT")),
    requireEnv("SERVER_CORS_ORIGIN")
  ),
  new Eth(
    parseInt(requireEnv("ETH_CHAIN_ID")),
    new URL(requireEnv("ETH_HTTP_RPC_URL")),
    toBuffer(requireEnv("ETH_PRIVATE_KEY")),
    toBuffer(requireEnv("ETH_COLLECTIBLE_CONTRACT_ADDRESS"))
  ),
  new S3(
    requireEnv("S3_ACCESS_KEY_ID"),
    requireEnv("S3_SECRET_ACCESS_KEY"),
    new URL(requireEnv("S3_ENDPOINT")),
    requireEnv("S3_REGION"),
    requireEnv("S3_BUCKET")
  ),
  new OffchainCafe(
    requireEnv("OFFCHAIN_CAFE_SERVER_HOST"),
    parseInt(requireEnv("OFFCHAIN_CAFE_SERVER_PORT"))
  )
);

export default config;
