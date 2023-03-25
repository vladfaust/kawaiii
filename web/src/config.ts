import { toUint8Array } from "./util";

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
  txConfirmations: number;
  blockTime: number;
}

class Eth {
  constructor(
    readonly chain: AddEthereumChainParameter,
    readonly collectibleAddress: Uint8Array
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
    readonly restUrl: URL,
    readonly trpcCommandsUrl: URL,
    readonly eth: Eth,
    readonly sentry?: Sentry
  ) {}
}

function requireEnv(id: string): string {
  if (import.meta.env[id]) return import.meta.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  new URL(requireEnv("VITE_REST_URL")),
  new URL(requireEnv("VITE_TRPC_COMMANDS_URL")),
  new Eth(
    JSON.parse(requireEnv("VITE_ETH_CHAIN")),
    toUint8Array(requireEnv("VITE_ETH_COLLECTIBLE_ADDRESS"))
  ),
  import.meta.env.VITE_SENTRY_DSN
    ? new Sentry(
        requireEnv("VITE_SENTRY_DSN"),
        import.meta.env.VITE_SENTRY_DEBUG !== undefined
          ? import.meta.env.VITE_SENTRY_DEBUG
          : undefined,
        import.meta.env.VITE_SENTRY_ENVIRONMENT
      )
    : undefined
);

export default config;
