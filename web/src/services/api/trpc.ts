import { createTRPCProxyClient, httpBatchLink, loggerLink } from "@trpc/client";
import type { CommandsRouter } from "@kawaiiico/api/trpc";
import config from "@/config";

const commands = createTRPCProxyClient<CommandsRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === "development" &&
          typeof window !== "undefined") ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: config.trpcCommandsUrl.toString(),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export default {
  commands,
};
