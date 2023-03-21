import { createClient, defaultExchanges } from "@urql/core";
import { yogaExchange } from "@graphql-yoga/urql-exchange";
import config from "@/config";

const client = createClient({
  url: `http://${config.offchainCafe.serverHost}:${config.offchainCafe.serverPort}/graphql`,
  exchanges: [...defaultExchanges, yogaExchange()],
});

export default client;
