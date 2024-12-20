<script lang="ts">
enum Stage {
  SendingTx,
  WaitingForConfirmation,
  Done,
}
</script>

<script setup lang="ts">
import Collectible from "@/model/Collectible";
import { provider } from "@/services/eth";
import { mintCollectible } from "@/services/eth/collectible";
import { Dialog, DialogPanel } from "@headlessui/vue";
import { BigNumber, ethers } from "ethers";
import { computed, ref } from "vue";
import Spinner from "@/components/util/Spinner.vue";
import CollectibleCard from "./Card.vue";
import config from "@/config";
import Callout from "@/components/util/Callout.vue";
import { CheckBadgeIcon } from "@heroicons/vue/20/solid";
import { notify } from "@kyvg/vue3-notification";
import { loginModal, userId } from "@/modules/auth";
import { ethPrice } from "@/services/api";

const { collectible, open } = defineProps<{
  collectible: Collectible;
  open: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const buttonRef = ref<HTMLButtonElement>();

const stage = ref<Stage | undefined>();
const exclusiveContentLength = computed(
  () => collectible.content.filter((c) => c.gated).length
);

async function collect() {
  if (!collectible) throw new Error("Collectible is not defined");
  if (!provider.value) {
    alert("Please connect your wallet");
    return;
  }

  try {
    const amount = BigNumber.from(1);
    const value = collectible.mintPrice.mul(amount);

    stage.value = Stage.SendingTx;

    const tx = await mintCollectible(collectible.id, amount, value);
    console.log("Transaction", tx);

    stage.value = Stage.WaitingForConfirmation;
    await tx.wait();

    stage.value = Stage.Done;

    notify({
      title: "Minted! 🎉",
      text: "The collectible has been added to your wallet.",
      type: "success",
    });

    collectible.fetchBalance();
    collectible.fetchTotalSupply();

    emit("close");
  } catch (e: any) {
    alert("Error: " + e.message);
    throw e;
  } finally {
    stage.value = undefined;
  }
}
</script>

<template lang="pug">
Dialog.relative.z-40(
  :open="open"
  @close="emit('close')"
  :initial-focus="buttonRef"
)
  .fixed.inset-0(class="bg-black/30" aria-hidden="true")
  .fixed.inset-0.overflow-y-auto.p-4
    .flex.min-h-full.items-center.justify-center
      DialogPanel.relative.flex.w-full.max-w-lg.flex-col.gap-4.rounded-xl.bg-white.p-6.shadow-lg
        .pressable.absolute.-top-2.-right-2.z-30.flex.h-10.w-10.cursor-pointer.items-center.justify-center.rounded-full.bg-white.shadow-lg.transition-transform(
          @click.stop="emit('close')"
        ) ❌
        CollectibleCard.mb-1.w-64.self-center.rounded-lg.shadow-lg(
          :collectible="collectible"
        )

        ul.flex.flex-col.gap-2
          li(v-if="!collectible.capReached.value")
            p.leading-tight
              | 👉 Upon minting, the collectible will appear in your crypto wallet.&nbsp;
              RouterLink.link-hover.inline-flex.items-center.font-bold.tracking-wide(
                :to="{ name: 'Profile', params: { handle: collectible.creator.value?.handle } }"
                class="gap-0.5"
              )
                span {{ collectible.creator.value?.name }}
                CheckBadgeIcon.inline-block.h-4.text-blue-500(
                  v-if="collectible.creator.value?.verified"
                  title="Verified"
                )
              | &nbsp;will receive the mint price on their balance.
          li(v-if="!collectible.capReached.value")
            p.leading-tight
              | 👉 Once all of
              strong &nbsp;{{ collectible.editions }}&nbsp;
              | editions are minted, the collectible won't be available to mint anymore.
              |
              span(v-if="collectible.totalSupply.value.gt(0)")
                | Right now,
                |
                strong {{ collectible.totalSupply.value }}
                |
                | of
                |
                strong {{ collectible.editions }}
                |
                | editions are minted.
          li(v-if="exclusiveContentLength")
            p.leading-tight
              | 👉 A holder of this collectible gains exclusive access to&nbsp;
              strong {{ exclusiveContentLength }} private picture(s)
              | .

        Callout(:type="'info'" v-if="collectible.collected.value")
          p.leading-tight
            | You already own this collectible (
            strong {{ collectible.balance.value }}
            | ); it grants you access to the hidden content.
            span(v-if="!collectible.capReached.value") &nbsp;You can mint more if you want.

        Callout(:type="'info'" v-if="collectible.capReached.value")
          p.leading-tight
            | This collectible is sold out.
            | You may try obtaining it on the secondary market.

        template(v-else-if="userId")
          button.btn-lg.btn.btn-web3(
            v-if="stage === undefined"
            ref="buttonRef"
            @click="collect"
          )
            | 🍃 Mint {{ collectible.collected.value ? "more " : "" }}for
            | {{ ethers.utils.formatEther(collectible.mintPrice) }}
            | {{ config.eth.chain.nativeCurrency.symbol }}
            | ~ ${{ (collectible.mintPrice.div(ethers.utils.parseEther("1")).toNumber() * ethPrice).toFixed(0) }}
          .btn.btn-lg.btn-ghost(v-else)
            .flex.items-center.gap-2(v-if="stage === Stage.SendingTx")
              Spinner.h-4.animate-spin
              span Sending tx...
            .flex.items-center.gap-2(
              v-else-if="stage === Stage.WaitingForConfirmation"
            )
              Spinner.h-4.animate-spin
              span Waiting confirm...

        button.btn-lg.btn.btn-primary(
          v-else
          ref="buttonRef"
          @click="loginModal = true"
        ) Log in to mint

        p.text-center.text-sm.text-base-600
          | Need help?
          | Visit our
          |
          RouterLink.link(to="/help#collect") help
          |
          | page.
</template>
