import * as server from "./server";
import * as chainSync from "./chainSync";
import Sentry from "./services/sentry";

process.on("uncaughtException", function (e) {
  Sentry.captureException(e);
  process.exit(1);
});

server.listen();
chainSync.sync();
