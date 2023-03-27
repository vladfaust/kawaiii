<script setup lang="ts">
import Collectible from "@/model/Collectible";
import Content from "@/model/Collectible/Content";
import { formatDistanceToNow } from "date-fns";
import { computed, markRaw, ref } from "vue";
import ContentCard from "./Content/Card.vue";
import { useElementSize, useImage } from "@vueuse/core";
import CollectButton from "./CollectButton.vue";
import PFP from "@/components/PFP.vue";
import { trpc } from "@/services/api";
import { toHex } from "@/util";
import Placeholder from "../util/Placeholder.vue";
import { CheckBadgeIcon } from "@heroicons/vue/20/solid";
import { loginModal, userId } from "@/modules/auth";

const Markdown = ref<ReturnType<typeof import("vue3-markdown-it")>>();
import("vue3-markdown-it").then((module) => {
  Markdown.value = markRaw(module.default);
});

const { collectible, showGallery, showActions, showDescription } = defineProps<{
  collectible: Collectible;
  showGallery?: boolean;
  showActions?: boolean;
  showDescription?: boolean;
}>();

const emit = defineEmits<{
  (event: "chooseContent", content?: Content): void;
}>();

const collectiblePreviewSrc = computed(() => collectible.previewUrl.toString());
const { isLoading: collectiblePreviewIsLoading } = useImage({
  src: collectiblePreviewSrc.value,
});

const postRef = ref<HTMLElement | null>(null);
const { height: postHeight } = useElementSize(postRef);

const creatorLink = computed(() => {
  if (!collectible.creator.value) return { name: "Home" };

  return collectible.creator.value.handle
    ? { name: "Profile", params: { handle: collectible.creator.value.handle } }
    : { name: "Me" };
});

const likeInProgress = ref(false);
async function like() {
  if (!checkLoggedIn()) return;
  if (likeInProgress.value) return;
  likeInProgress.value = true;

  try {
    await trpc.commands.collectibles.like.mutate({
      collectibleId: toHex(collectible.id),
    });

    collectible.likedByMe.value = true;
    collectible.fetchLikes();
  } finally {
    likeInProgress.value = false;
  }
}
async function unlike() {
  if (!checkLoggedIn()) return;
  if (likeInProgress.value) return;
  likeInProgress.value = true;

  try {
    await trpc.commands.collectibles.unlike.mutate({
      collectibleId: toHex(collectible.id),
    });

    collectible.likedByMe.value = false;
    collectible.fetchLikes();
  } finally {
    likeInProgress.value = false;
  }
}
function checkLoggedIn() {
  if (!userId.value) {
    loginModal.value = true;
    return false;
  }

  return true;
}
</script>

<template lang="pug">
.flex
  .flex.h-min.w-full.flex-col.gap-3.p-3(
    ref="postRef"
    :class="{ 'sm_w-2/3': showGallery }"
  )
    .flex.items-center.justify-between
      RouterLink.pressable.group.flex.select-none.gap-2.transition-transform(
        v-if="collectible.creator.value"
        :to="creatorLink"
        tabindex="-1"
      )
        PFP.w-12.rounded-full(:user="collectible.creator.value")
        .flex.flex-col.justify-center.group-hover_underline(class="gap-0.5")
          span.font-bold.leading-none.tracking-wide(
            v-if="collectible.creator.value.name"
          )
            | {{ collectible.creator.value.name }}
            CheckBadgeIcon.inline-block.h-4.align-top.text-blue-500(
              v-if="collectible.creator.value.verified"
              v-tippy="{ content: 'Verified' }"
              class="ml-0.5"
            )
          span.font-bold.leading-none.tracking-wide.text-base-400(v-else) Undefined

          span.text-sm.leading-none.text-base-500(
            v-if="collectible.creator.value.handle"
          ) @{{ collectible.creator.value.handle }}
          span.text-sm.leading-none.text-base-400(v-else) @undefined
      .flex.flex-col.items-end(class="gap-0.5")
        span.leading-none {{ collectible.content.length }} photos
        span.text-sm.leading-none.text-base-500 {{ formatDistanceToNow(collectible.createdAt) }} ago
    .flex.flex-col
      span.text-lg.font-semibold.leading-tight {{ collectible.name }}
      Markdown.leading-tight(
        v-if="collectible.description && showDescription && Markdown"
        :source="collectible.description"
        :breaks="true"
      )
    Placeholder.aspect-square.h-full.w-full.rounded-lg.bg-base-100(
      v-if="collectiblePreviewIsLoading"
      :title="collectible.name"
    )
    img.pressable.bg-checkerboard.aspect-square.cursor-pointer.select-none.rounded-lg.bg-fixed.object-cover.shadow-lg.transition-transform(
      v-else
      :src="collectiblePreviewSrc"
      :alt="collectible.name"
      @click="emit('chooseContent', undefined)"
    )
    .flex.justify-between(v-if="showActions")
      .flex.gap-2
        button.btn(
          tabindex="-1"
          @click="() => (collectible.likedByMe.value ? unlike() : like())"
          :class="collectible.likedByMe.value ? 'bg-yellow-200' : ''"
        ) ❤️ {{ collectible.likes.value }}
        button.btn.text-base-600(tabindex="-1" @click="checkLoggedIn") 💬 {{ collectible.comments }}
      .flex.items-center.gap-2
        CollectButton(:collectible="collectible")

  .hidden.overflow-y-auto.border-l.p-3.sm_block(
    v-if="showGallery"
    class="w-1/3"
    :style="{ height: 'calc(' + postHeight + 'px + 1.5rem + 2px)' }"
  )
    .grid.w-full.grid-cols-2.gap-2
      ContentCard.pressable.cursor-pointer.rounded-lg.transition(
        :content="content"
        :preview="true"
        v-for="content in collectible.content"
        :key="content.name"
        @click="emit('chooseContent', content)"
      )
</template>
