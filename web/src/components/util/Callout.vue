<script setup lang="ts">
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/solid";

const { type } = defineProps<{
  type: "info" | "warn";
}>();
</script>

<template lang="pug">
.flex.items-center.gap-2.rounded-lg.border.p-3.leading-tight.shadow(
  :class="{ 'border-info-400 bg-info-100': type === 'info', 'border-warn-400 bg-warn-100': type === 'warn' }"
)
  InformationCircleIcon.h-10.text-info-400(v-if="type === 'info'")
  ExclamationCircleIcon.h-10.text-warn-400(v-else-if="type === 'warn'")
  .w-full
    slot
</template>
