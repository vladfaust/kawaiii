import * as server from "./server";
import * as chainSync from "./chainSync";
import Sentry from "./services/sentry";
import config from "./config";
import konsole from "./services/konsole";

if (config.sentry) {
  process.on("uncaughtException", function (e) {
    konsole.error(e);
    Sentry.captureException(e);
    process.exit(1);
  });
}

server.listen();
chainSync.sync();
