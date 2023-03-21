<script setup lang="ts">
import Collectible from "@/model/Collectible";
import Content from "@/model/Collectible/Content";
import { trpc } from "@/services/api";
import { toHex } from "@/util";
import { bufferToUint8Array } from "@/util/prisma";
import { onMounted, shallowRef } from "vue";
import Post from "./Collectible/Post.vue";
import GalleryModal from "./GalleryModal.vue";

const feed = shallowRef<Collectible[]>([]);

onMounted(() => {
  trpc.commands.users.feed
    .query()
    .then((ids) => ids.map((id) => Collectible.get(bufferToUint8Array(id))))
    .then(async (collectibles) => {
      feed.value = await Promise.all(collectibles);
    });
});

const galleryCollectible = shallowRef<Collectible | undefined>();
const galleryContent = shallowRef<Content | undefined>();
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  div(v-for="collectible in feed" :key="toHex(collectible.id)")
    Post.rounded-xl.border(
      :collectible="collectible"
      :show-gallery="true"
      @choose-content="(content) => { galleryCollectible = collectible; galleryContent = content; }"
    )

  GalleryModal(
    :open="galleryCollectible !== undefined"
    :collectibles="feed"
    :collectible="galleryCollectible"
    :content="galleryContent"
    @close="() => { galleryContent = undefined; galleryCollectible = undefined; }"
    @choose-content="galleryContent = $event"
    @choose-collectible="(e) => { galleryContent = undefined; galleryCollectible = e; }"
  )
</template>
