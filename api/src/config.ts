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
    readonly wsRpcUrl: URL | undefined,
    readonly privateKey: Buffer,
    readonly collectibleContractAddress: Buffer,
    readonly collectibleContractDeployBlockNumber: number,
    readonly chainlinkAddress?: Buffer
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

class Sentry {
  constructor(
    readonly dsn: string,
    readonly debug?: boolean,
    readonly environment?: string
  ) {}
}

class Config {
  constructor(
    readonly prod: boolean,
    readonly databaseUrl: URL,
    readonly redisUrl: URL,
    readonly server: Server,
    readonly eth: Eth,
    readonly s3: S3,
    readonly sentry?: Sentry
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
    process.env.ETH_WS_RPC_URL
      ? new URL(requireEnv("ETH_WS_RPC_URL"))
      : undefined,
    toBuffer(requireEnv("ETH_PRIVATE_KEY")),
    toBuffer(requireEnv("ETH_COLLECTIBLE_CONTRACT_ADDRESS")),
    process.env.ETH_COLLECTIBLE_CONTRACT_DEPLOY_BLOCK_NUMBER
      ? parseInt(process.env.ETH_COLLECTIBLE_CONTRACT_DEPLOY_BLOCK_NUMBER)
      : 0,
    process.env.ETH_CHAINLINK_ADDRESS
      ? toBuffer(requireEnv("ETH_CHAINLINK_ADDRESS"))
      : undefined
  ),
  new S3(
    requireEnv("S3_ACCESS_KEY_ID"),
    requireEnv("S3_SECRET_ACCESS_KEY"),
    new URL(requireEnv("S3_ENDPOINT")),
    requireEnv("S3_REGION"),
    requireEnv("S3_BUCKET")
  ),
  process.env.SENTRY_DSN
    ? new Sentry(
        requireEnv("SENTRY_DSN"),
        process.env.SENTRY_DEBUG !== undefined
          ? process.env.SENTRY_DEBUG === "true"
          : undefined,
        process.env.SENTRY_ENVIRONMENT
      )
    : undefined
);

if (!config.eth.chainlinkAddress) {
  if (config.prod) {
    throw new Error("Chainlink address is not set in production");
  }
}

export default config;
