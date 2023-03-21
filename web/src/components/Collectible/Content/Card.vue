<script setup lang="ts">
import Content from "@/model/Collectible/Content";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/vue/24/outline";
import { useImage } from "@vueuse/core";
import { computed } from "vue";
import Placeholder from "@/components/util/Placeholder.vue";

const { content } = defineProps<{
  content: Content;
}>();

const src = computed(() => {
  if (content.gated) {
    if (content.unlocked.value) {
      return content.previewUrl.toString();
    } else {
      return content.previewBlurredUrl.toString();
    }
  } else {
    return content.previewUrl.toString();
  }
});

const { isLoading } = useImage({ src: src.value });
</script>

<template lang="pug">
.group.relative.flex.aspect-square.items-center.justify-center.overflow-hidden
  .absolute.z-10.aspect-square(v-if="content.gated" class="h-1/3")
    LockOpenIcon.text-white(v-if="content.unlocked.value")
    LockClosedIcon.text-white(v-else)

  Placeholder.h-full.w-full.bg-base-100(
    v-if="isLoading"
    :title="content.name"
    :class="{ 'brightness-75 blur-sm group-hover_blur-none': content.gated && !content.unlocked.value }"
  )
  img.bg-checkerboard.aspect-square.select-none.bg-fixed.object-cover.transition(
    v-else
    :src="src"
    :alt="content.name"
    :class="{ 'brightness-75 blur-sm group-hover_blur-none': content.gated && !content.unlocked.value }"
  )
</template>
