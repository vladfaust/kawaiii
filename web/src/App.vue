<script setup lang="ts">
import HeaderVue from "@/components/Header.vue";
import FooterVue from "@/components/Footer.vue";
import { useRoute, useRouter } from "vue-router";
import nProgress from "nprogress";
import { onMounted } from "vue";
import { autoConnect } from "./services/eth";
import Spinner from "./components/util/Spinner.vue";

const route = useRoute();
const router = useRouter();

nProgress.configure({ showSpinner: false });

onMounted(() => {
  autoConnect();

  router.beforeEach(() => {
    nProgress.start();
  });

  router.afterEach((to) => {
    if (!to.meta.doNotTerminateNProgress) {
      nProgress.done();
    }
  });
});
</script>

<template lang="pug">
Notifications(position="top center" classes="my-notification")
HeaderVue
.flex.justify-center.p-4(style="min-height: calc(100vh - 8rem)")
  RouterView(v-slot="{ Component }")
    Transition(name="fade" mode="out-in")
      Suspense
        template(#default)
          Component(:is="Component" :key="route.path")
        template(#fallback)
          Spinner.animate-spin.text-primary-500
FooterVue
.hidden(class="sm_w-3/5")
</template>

<style lang="scss">
.vue-notification-group {
  @apply z-50 m-3;

  & > span {
    display: flex !important;
    @apply flex-col gap-2;
  }
}

.vue-notification-wrapper {
  overflow: inherit !important;
}

.my-notification {
  @apply cursor-pointer rounded-lg p-4 drop-shadow-lg;

  & > .notification-title {
    @apply mb-0.5 text-lg font-bold leading-tight;
  }

  & > .notification-content {
    @apply font-medium leading-tight;
  }

  &.success {
    @apply bg-success-500 text-white;
  }

  &.info {
    @apply bg-primary-500 text-white;
  }

  &.error {
    @apply bg-error-500 text-white;
  }
}
</style>
