import { ethers } from "ethers";
import { ref, Ref, ShallowRef } from "vue";
import config from "@/config";
import { useLocalStorage } from "@vueuse/core";

/** If set, would auto-connect. */
const wallet = useLocalStorage<string | null>("ethWallet", null);

declare global {
  interface Window {
    ethereum: any;
  }
}

export const account: Ref<string | null> = ref(null);
export const provider: ShallowRef<ethers.providers.Web3Provider | null> =
  ref(null);

export async function connect() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!window.ethereum.selectedAddress) {
    throw "Did not select an Ethereum address";
  }

  provider.value = new ethers.providers.Web3Provider(window.ethereum, "any");
  account.value = window.ethereum.selectedAddress;
  wallet.value = "generic";

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.eth.chain.chainId }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      // TODO: Handle the add error.
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [config.eth.chain],
      });
    } else {
      throw switchError;
    }
  }

  window.ethereum.on("accountsChanged", function (accounts: string[]) {
    if (accounts.length > 0) {
      account.value = accounts[0];
    } else {
      disconnect();
    }
  });

  window.ethereum.on("disconnect", function () {
    disconnect();
  });

  window.ethereum.on("network", (_newNetwork: any, oldNetwork: any) => {
    // When a Provider makes its initial connection, it emits a "network"
    // event with a null oldNetwork along with the newNetwork. So, if the
    // oldNetwork exists, it represents a changing network
    // See https://docs.ethers.io/v5/concepts/best-practices/.
    if (oldNetwork) {
      disconnect();
    }
  });

  window.ethereum.on("chainChanged", function (chainId: any) {
    disconnect();
  });
}

export async function disconnect() {
  window.ethereum.removeAllListeners();
  wallet.value = null;

  account.value = null;
  provider.value = null;
}

export async function autoConnect(): Promise<boolean> {
  if (wallet.value) {
    await connect();
    return true;
  } else {
    return false;
  }
}
