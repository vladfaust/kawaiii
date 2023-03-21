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

class Config {
  constructor(
    readonly restUrl: URL,
    readonly trpcCommandsUrl: URL,
    readonly eth: Eth
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
  )
);

export default config;
