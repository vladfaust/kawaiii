import { commandsRouter } from "#trpc/commands";
import { createExpressContext } from "#trpc/context.js";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import konsole from "@/services/konsole";
import config from "@/config";
import rest from "./server/rest";
import cookieParser from "cookie-parser";

export function listen() {
  const app = express();

  app.use(
    cors({
      credentials: true,
      origin: config.server.corsOrigin,
    })
  );

  app.use(cookieParser());

  app.use("/rest", rest);

  app.use(
    "/trpc/commands",
    trpcExpress.createExpressMiddleware({
      router: commandsRouter,
      createContext: createExpressContext,
    })
  );

  app.listen(config.server.port, config.server.host, () => {
    konsole.log(
      `Server listening on http://${config.server.host}:${config.server.port}`
    );
  });
}
