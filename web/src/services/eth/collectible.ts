import { BigNumber } from "ethers";
import config from "@/config";
import {
  ERC1155__factory,
  KawaiiiCollectible__factory,
} from "@kawaiiico/contracts/typechain";
import { toHex } from "@/util";
import { provider, account } from "../eth";

export async function totalSupplyOfCollectible(tokenId: Uint8Array) {
  const contract = KawaiiiCollectible__factory.connect(
    toHex(config.eth.collectibleAddress),
    provider.value!
  );

  return await contract.totalSupply(tokenId);
}

export async function balanceOfCollectible(
  tokenId: Uint8Array,
  account: Uint8Array
): Promise<BigNumber> {
  const erc1155 = ERC1155__factory.connect(
    toHex(config.eth.collectibleAddress),
    provider.value!
  );

  return await erc1155.balanceOf(toHex(account), tokenId);
}

export async function mintCollectible(
  tokenId: Uint8Array,
  amount: BigNumber,
  value: BigNumber
) {
  const contract = KawaiiiCollectible__factory.connect(
    toHex(config.eth.collectibleAddress),
    provider.value!.getSigner()
  );

  return await contract.mint(toHex(account.value!), tokenId, amount, [], {
    value,
  });
}
