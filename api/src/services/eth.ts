import config from "@/config.js";
import { BigNumber, ethers } from "ethers";
import { timeout } from "@/utils.js";
import assert from "assert";
import konsole from "./konsole";
import { ERC1155__factory } from "@kawaiii/contracts/typechain";

let wsProvider: ethers.providers.BaseProvider;
let httpProvider: ethers.providers.BaseProvider;

const promises = [];

if (config.eth.wsRpcUrl) {
  promises.push(
    (async () => {
      konsole.log("Connecting to WS eth provider", {
        url: config.eth.wsRpcUrl!.toString(),
      });

      wsProvider = new ethers.providers.WebSocketProvider(
        config.eth.wsRpcUrl!.toString()
      );

      await timeout(5000, wsProvider.ready, "WS eth provider not ready");

      assert(
        (await wsProvider.getNetwork()).chainId === config.eth.chainId,
        "WS eth provider chain ID mismatch"
      );

      konsole.log("WS eth provider connected");
    })()
  );

  promises.push(
    (async () => {
      konsole.log("Connecting to HTTP eth provider", {
        url: config.eth.httpRpcUrl.toString(),
      });

      httpProvider = new ethers.providers.JsonRpcProvider(
        config.eth.httpRpcUrl.toString()
      );

      await timeout(5000, httpProvider.ready, "HTTP eth provider not ready");

      assert(
        (await httpProvider.getNetwork()).chainId === config.eth.chainId,
        "HTTP eth provider chain ID mismatch"
      );

      konsole.log("HTTP eth provider connected");
    })()
  );
} else {
  promises.push(
    (async () => {
      konsole.log("Connecting to HTTP/WS eth provider", {
        url: config.eth.httpRpcUrl.toString(),
      });

      httpProvider = new ethers.providers.JsonRpcProvider(
        config.eth.httpRpcUrl.toString()
      );

      wsProvider = httpProvider;

      await timeout(5000, httpProvider.ready, "HTTP/WS eth provider not ready");

      assert(
        (await httpProvider.getNetwork()).chainId === config.eth.chainId,
        "HTTP/WS eth provider chain ID mismatch"
      );

      konsole.log("HTTP/WS eth provider connected");
    })()
  );
}

await Promise.all(promises);

export { wsProvider, httpProvider };

export const wallet = new ethers.Wallet(config.eth.privateKey, httpProvider!);

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
    httpProvider
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
