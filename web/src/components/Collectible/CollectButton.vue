<script setup lang="ts">
import Collectible from "@/model/Collectible";
import { mintCollectible } from "@/services/eth/collectible";
import { BigNumber } from "ethers";
import { ref } from "vue";
import Spinner from "@/components/util/Spinner.vue";
import { provider } from "@/services/eth";

enum Stage {
  SendingTx,
  WaitingForConfirmation,
  Done,
}

const { collectible } = defineProps<{
  collectible: Collectible;
}>();

const stage = ref<Stage | undefined>();

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

    collectible.fetchBalance();
    collectible.fetchTotalSupply();
  } catch (e: any) {
    alert("Error: " + e.message);
    throw e;
  } finally {
    stage.value = undefined;
  }
}
</script>

<template lang="pug">
button.btn(
  @click="collect"
  :class="collectible.collected.value ? 'bg-yellow-200' : 'btn-web3'"
  :disabled="stage !== undefined || collectible.capReached.value"
)
  .flex.items-center.gap-2(v-if="stage === Stage.SendingTx")
    Spinner.h-4.animate-spin
    span Sending tx...
  .flex.items-center.gap-2(v-else-if="stage === Stage.WaitingForConfirmation")
    Spinner.h-4.animate-spin
    span Waiting confirm...
  span(
    v-else-if="collectible.collected.value"
    v-tippy="'Your balance / Total supply / Editions'"
  )
    | 💎&nbsp;
    span.hidden.xl_inline Collected &lpar;
    | {{ collectible.balance.value }}/{{ collectible.totalSupply.value }}/{{ collectible.editions }}
    span.hidden.xl_inline &rpar;
  span(v-else v-tippy="'Your balance / Total supply / Editions'")
    | 💎&nbsp;
    span.hidden.xl_inline Collect&nbsp;&lpar;
    | {{ collectible.balance.value }}/{{ collectible.totalSupply.value }}/{{ collectible.editions }}
    span.hidden.xl_inline &rpar;
</template>
