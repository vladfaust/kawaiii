import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import { router } from "./modules/router";
import Notifications from "@kyvg/vue3-notification";
import { TippyPlugin } from "tippy.vue";
import "tippy.js/dist/tippy.css";
import initSentry from "./modules/sentry";

const app = createApp(App);

initSentry(app, router);

app.use(router);
app.use(Notifications);
app.use(TippyPlugin);

app.mount("#app");
