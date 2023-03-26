<script setup lang="ts">
import Collectible from "@/model/Collectible";
import Content from "@/model/Collectible/Content";
import User from "@/model/User";
import { trpc } from "@/services/api";
import { toHex, toUint8Array } from "@/util";
import { onMounted, shallowRef } from "vue";
import Post from "./Collectible/Post.vue";
import GalleryModal from "./GalleryModal.vue";

const feed = shallowRef<Collectible[]>([]);
const subscriptions = shallowRef<User[]>([]);

onMounted(() => {
  trpc.commands.users.feed
    .query()
    .then((ids) => ids.map((id) => Collectible.get(toUint8Array(id))))
    .then(async (collectibles) => {
      feed.value = await Promise.all(collectibles);
    });

  trpc.commands.users.getFollowees
    .query()
    .then((ids) => ids.map((id) => User.get(id)))
    .then(async (users) => {
      subscriptions.value = await Promise.all(users);
    });
});

const galleryCollectible = shallowRef<Collectible | undefined>();
const galleryContent = shallowRef<Content | undefined>();
</script>

<template lang="pug">
.m-4.flex.min-h-full.w-full.max-w-3xl.flex-col.gap-3
  Post.rounded-xl.border(
    v-if="feed.length > 0"
    v-for="collectible in feed"
    :key="toHex(collectible.id)"
    :collectible="collectible"
    :show-gallery="true"
    :show-actions="true"
    :show-description="true"
    @choose-content="(content) => { galleryCollectible = collectible; galleryContent = content; }"
  )
  p.flex.h-full.flex-col.items-center.justify-center.p-8.text-center.text-base-600(
    v-else
  )
    template(v-if="subscriptions.length > 0")
      span.text-lg.font-semibold.leading-tight Your feed is empty!
      span.leading-tight Follow more creators to see their posts here. 🐾
    template(v-else)
      span.text-lg.font-semibold.leading-tight Your feed is empty!
      span.leading-tight Follow some creators to see their posts here. 🐾

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
