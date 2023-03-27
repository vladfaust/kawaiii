import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";
import config from "@/config";
import { App } from "vue";
import { Router } from "vue-router";

export default function initSentry(app: App, router: Router) {
  if (config.sentry) {
    console.log("Sentry enabled", {
      dsn: config.sentry.dsn,
      debug:
        config.sentry.debug !== undefined
          ? config.sentry.debug
          : import.meta.env.DEV,
    });

    Sentry.init({
      app,
      dsn: config.sentry.dsn,
      debug:
        config.sentry.debug !== undefined
          ? config.sentry.debug
          : import.meta.env.DEV,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.vueRouterInstrumentation(router),
          tracePropagationTargets: [
            config.restUrl.toString(),
            config.trpcCommandsUrl.toString(),
            /^\//,
          ],
        }),
      ],
    });
  }
}
