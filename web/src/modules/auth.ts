import config from "@/config";
import { rest } from "@/services/api";
import { autoConnect, provider, disconnect } from "@/services/eth";
import Web3Token from "web3-token";
import { useSessionStorage } from "@vueuse/core";
import { ref } from "vue";

/** The login modal state. */
export const loginModal = ref(false);

/** The web3 token session storage. */
export const web3Token = useSessionStorage<string | null>("web3Token", null);

/** The logged-in user id, if any. */
export const userId = useSessionStorage<string | null>("userId", null);

/**
 * Should be called on page load.
 */
export async function autoLogin() {
  if (await autoConnect()) {
    userId.value = await rest.auth.get();
    console.log("Logged in as", userId.value);
  }
}

/**
 * Should be called on user action.
 */
export async function logout() {
  await disconnect();
  web3Token.value = null;
  userId.value = null;
  await rest.auth.logout();
  window.location.reload();
}

/**
 * Ensures a valid signed web3 token.
 */
export async function ensureWeb3Token() {
  if (!provider.value) {
    throw new Error("You must be connected to Ethereum to sign requests");
  }

  let wannaSign = false;

  if (!web3Token.value) {
    wannaSign = true;
  } else {
    const expiredAt = atob(web3Token.value).match(/Expiration Time: (.*)/)?.[1];

    if (!expiredAt) {
      throw new Error("Invalid token (no expiration time)");
    }

    wannaSign = new Date(expiredAt) < new Date(Date.now());
  }

  if (wannaSign) {
    web3Token.value = await Web3Token.sign(
      async (msg: string) => provider.value!.getSigner().signMessage(msg),
      {
        domain: import.meta.env.PROD
          ? config.trpcCommandsUrl.hostname
          : undefined,
        expires_in: 60 * 60 * 24 * 1000, // 1 day
      }
    );
  }

  return web3Token.value!;
}
