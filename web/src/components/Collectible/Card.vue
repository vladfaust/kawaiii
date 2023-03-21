<script setup lang="ts">
import Collectible from "@/model/Collectible";
import { useImage } from "@vueuse/core";
import { computed } from "vue";
import Placeholder from "../util/Placeholder.vue";

const { collectible } = defineProps<{
  collectible: Collectible;
}>();

const src = computed(() => collectible.previewUrl.toString());
const { isLoading } = useImage({ src: src.value });
</script>

<template lang="pug">
.aspect-square.overflow-hidden
  Placeholder.h-full.w-full.bg-base-100(
    v-if="isLoading"
    :title="collectible.name"
  )
  img.bg-checkerboard.h-full.w-full.select-none.bg-fixed.object-cover(
    v-else
    :src="src"
    :alt="collectible.name"
  )
</template>
