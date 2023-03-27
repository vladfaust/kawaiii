<script setup lang="ts">
import { loginModal, userId, ensureWeb3Token } from "@/modules/auth";
import { rest } from "@/services/api";
import { connect } from "@/services/eth";
import { Dialog, DialogPanel } from "@headlessui/vue";
import { ref } from "vue";
import { notify } from "@kyvg/vue3-notification";
import Spinner from "./util/Spinner.vue";
import nProgress from "nprogress";

const emit = defineEmits<{
  (event: "close"): void;
}>();

const loginButton = ref<HTMLButtonElement>();

const close = () => {
  loginModal.value = false;
  emit("close");
};

enum State {
  Connect,
  Signature,
  Server,
  Done,
}

const state = ref<State | undefined>();

async function login() {
  try {
    state.value = State.Connect;
    await connect();

    state.value = State.Signature;
    const token = await ensureWeb3Token();

    state.value = State.Server;
    nProgress.start();
    userId.value = await rest.auth.login(token);

    state.value = State.Done;
    notify({
      text: "You are now logged in.",
      type: "info",
    });
    close();
  } catch (e: any) {
    console.error(e);
    alert(e.message);
    state.value = undefined;
  } finally {
    nProgress.done();
  }
}
</script>

<template lang="pug">
Dialog.relative(
  :open="loginModal"
  @close="close"
  class="z-[41]"
  :initialFocus="loginButton"
)
  .fixed.inset-0(class="bg-black/30" aria-hidden="true")
  .fixed.inset-0.overflow-y-auto.p-4
    .flex.min-h-full.items-center.justify-center
      DialogPanel.relative.flex.w-full.max-w-lg.flex-col.gap-3.rounded-xl.bg-white.p-4.shadow-lg
        //- The close button is intentionally disabled.
        //-
        //- .pressable.absolute.-top-2.-right-2.z-30.flex.h-10.w-10.cursor-pointer.items-center.justify-center.rounded-full.bg-white.shadow-lg.transition-transform(
        //-   @click.stop="close"
        //- ) ❌
        //-

        p.leading-tight.text-base-600
          | kawaiii.co does not rely on obsolete authentication providers, and it respects your privacy.
          | Currently, you may only log into kawaiii.co using an Ethereum wallet, such as&nbsp;
          a.link(href="https://metamask.io/") MetaMask
          | .
        ol.font-bold
          li.text-lg.leading-tight
            | 1️⃣ Make sure you have
            |
            a.link.inline-flex.align-bottom(
              href="https://metamask.io/"
              class="gap-0.5"
            )
              img.inline-block.h-5(src="/metamask.svg" alt="MetaMask logo")
              | MetaMask
            |
            | installed.
          li.text-lg.leading-tight
            | 2️⃣ Click the button to log in. ⤵️
        button.btn.btn-primary.btn-lg.btn-web3(
          ref="loginButton"
          @click="login"
          v-if="state === undefined"
        ) Connect wallet
        .btn.btn-lg.flex.gap-2(v-else-if="state === State.Connect")
          Spinner.h-5
          span Connecting wallet...
        .btn.btn-lg.flex.gap-2(v-else-if="state === State.Signature")
          Spinner.h-5
          span Waiting for signature...
        .btn.btn-lg.flex.gap-2(v-else-if="state === State.Server")
          Spinner.h-5
          span Injecting love...
        .btn.btn-lg.flex.gap-2(v-else-if="state === State.Done")
          span Logged in!

        p.text-center.text-sm.text-base-500
          | Need help? Check out our&nbsp;
          RouterLink.link(to="/help#connect" @click="close") help page
          | .
</template>
