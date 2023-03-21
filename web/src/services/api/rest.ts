import config from "@/config";

export default {
  auth: {
    get: async (): Promise<string | null> => {
      const res = await fetch(config.restUrl + "/auth", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 200) {
        return (await res.text()) || null;
      } else {
        throw new Error("Failed to get auth", { cause: res });
      }
    },
    login: async (web3Token: string): Promise<string> => {
      const result = await fetch(config.restUrl + "/auth", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: "Web3-Token " + web3Token,
        },
      });

      if (result.status === 201) {
        return await result.text();
      } else {
        throw new Error("Failed to login", { cause: result });
      }
    },
    logout: async () => {
      return await fetch(config.restUrl + "/auth", {
        method: "DELETE",
        credentials: "include",
      });
    },
  },
};
