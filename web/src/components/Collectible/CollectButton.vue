<script setup lang="ts">
import Collectible from "@/model/Collectible";
import { ref } from "vue";
import Modal from "./CollectModal.vue";

const { collectible } = defineProps<{
  collectible: Collectible;
}>();

const modalOpen = ref(false);
</script>

<template lang="pug">
button.btn(
  @click="modalOpen = true"
  :class="collectible.collected.value ? 'bg-yellow-200' : 'btn-ghost'"
)
  span
    | 💎&nbsp;
    span.hidden.xl_inline Collect &lpar;
    | {{ collectible.balance.value.gt(0) ? `${collectible.balance.value}/` : "" }}{{ collectible.totalSupply.value.toNumber() }}/{{ collectible.editions }}
    span.hidden.xl_inline &rpar;

  Modal(
    :collectible="collectible"
    :open="modalOpen"
    @close="modalOpen = false"
  )
</template>
