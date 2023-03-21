<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import Jdenticon from "@/components/util/Jdenticon.vue";
import User from "@/model/User";
import { nonNullable } from "@/util";
import { useImage } from "@vueuse/core";
import { computed } from "vue";
import Placeholder from "./util/Placeholder.vue";

const props = defineProps<{ user: User }>();

const imgSrc = computed(() =>
  props.user.pfpVersion ? props.user.pfpUrl.toString() : undefined
);

const load = computed(() =>
  imgSrc.value ? useImage({ src: imgSrc.value }) : undefined
);
</script>

<template lang="pug">
template(v-if="imgSrc")
  Placeholder.aspect-square.bg-base-100(
    v-if="nonNullable(load).isLoading.value"
    :title="user.name"
    v-bind="$attrs"
  )
  img.aspect-square.select-none.object-cover(
    v-else
    :src="imgSrc"
    :alt="user.name"
    v-bind="$attrs"
  )
Jdenticon.aspect-square.select-none(
  v-else
  :input="user.id"
  :alt="user.name"
  v-bind="$attrs"
)
</template>
