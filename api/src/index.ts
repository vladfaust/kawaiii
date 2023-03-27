import * as server from "./server";
import * as chainSync from "./chainSync";
import Sentry from "./services/sentry";
import config from "./config";

if (config.sentry) {
  process.on("uncaughtException", function (e) {
    Sentry.captureException(e);
    console.error(e);
    process.exit(1);
  });
}

server.listen();
chainSync.sync();
