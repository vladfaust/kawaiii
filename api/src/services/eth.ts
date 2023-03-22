import config from "@/config.js";
import { BigNumber, ethers } from "ethers";
import { timeout } from "@/utils.js";
import assert from "assert";
import konsole from "./konsole";
import { ERC1155__factory } from "@kawaiii/contracts/typechain";

export let provider: ethers.providers.BaseProvider;

konsole.log("Connecting to eth...", {
  url: config.eth.httpRpcUrl.toString(),
});

provider = new ethers.providers.JsonRpcProvider(
  config.eth.httpRpcUrl.toString()
);

await timeout(5000, provider.ready, "Ethereum provider not ready");

assert(
  (await provider.getNetwork()).chainId === config.eth.chainId,
  "Ethereum chain ID mismatch"
);

export const wallet = new ethers.Wallet(config.eth.privateKey, provider);

konsole.log("Connected to eth", {
  balance: ethers.utils.formatEther(await wallet.getBalance()),
});

export async function balanceOfErc1155(
  contractAddress: Buffer,
  tokenId: Buffer,
  account: Buffer
): Promise<BigNumber> {
  const erc1155 = ERC1155__factory.connect(
    ethers.utils.hexlify(contractAddress),
    provider
  );

  return await erc1155.balanceOf(ethers.utils.hexlify(account), tokenId);
}

export async function balanceOfCollectible(
  tokenId: Buffer,
  account: Buffer
): Promise<BigNumber> {
  return await balanceOfErc1155(
    config.eth.collectibleContractAddress,
    tokenId,
    account
  );
}
