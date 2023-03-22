<script setup lang="ts">
import Collectible from "@/model/Collectible";
import Content from "@/model/Collectible/Content";
import User from "@/model/User";
import { trpc } from "@/services/api";
import { Deferred } from "@/util/deferred";
import { computed, ref, shallowRef, triggerRef, type ShallowRef } from "vue";
import ContentCard from "./Collectible/Content/Card.vue";
import CollectiblePost from "./Collectible/Post.vue";
import Markdown from "vue3-markdown-it";
import GalleryModal from "./GalleryModal.vue";
import { logout, userId } from "@/modules/auth";
import EditModal from "./Profile/EditModal.vue";
import PFP from "@/components/PFP.vue";
import FolloweesModal from "./Profile/FolloweesModal.vue";
import { toUint8Array } from "@/util";
import Placeholder from "./util/Placeholder.vue";
import { useImage } from "@vueuse/core";
import { CheckBadgeIcon } from "@heroicons/vue/20/solid";

const { user } = defineProps<{
  user: Deferred<User | null>;
}>();

await user.promise;

const galleryCollectibles = shallowRef<Collectible[]>([]);
const galleryCollectible = shallowRef<Collectible | undefined>();
const galleryContent = shallowRef<Content | undefined>();

const created: ShallowRef<Collectible[]> = shallowRef([]);
const liked: ShallowRef<Collectible[]> = shallowRef([]);
const collected: ShallowRef<Collectible[]> = shallowRef([]);
const followeesCount = ref(0);
const isSelf = computed(() => user.value?.id == userId.value);

if (user.value) {
  trpc.commands.collectibles.listByCreator
    .query({ creatorId: user.value.id })
    .then((ids) =>
      ids.forEach((id) =>
        Collectible.get(toUint8Array(id)).then((c) => {
          created.value.push(c);
          triggerRef(created);
        })
      )
    );

  trpc.commands.collectibles.listLiked
    .query({ userId: user.value.id })
    .then((ids) =>
      ids.forEach((id) =>
        Collectible.get(toUint8Array(id)).then((c) => {
          liked.value.push(c);
          triggerRef(liked);
        })
      )
    );

  trpc.commands.collectibles.indexCollected
    .query({
      userId: user.value.id,
    })
    .then((ids) =>
      ids.forEach((id) =>
        Collectible.get(toUint8Array(id)).then((collectible) => {
          collected.value.push(collectible);
          triggerRef(collected);
        })
      )
    );

  if (isSelf.value) {
    trpc.commands.users.getFolloweesCount.query().then((count) => {
      followeesCount.value = count;
    });
  }
}

const bgpSrc = computed(() =>
  user.value?.bgpVersion ? user.value.bgpUrl.toString() : undefined
);
const bgpUseImage = computed(() =>
  bgpSrc.value ? useImage({ src: bgpSrc.value }) : undefined
);

function setGallery(
  collectibles: Collectible[],
  collectible: Collectible,
  content?: Content
) {
  galleryCollectibles.value = collectibles;
  galleryCollectible.value = collectible;
  galleryContent.value = content;
}

const editModal = ref(false);

function onUserUpdate() {
  editModal.value = false;
  window.location.reload();
}

const followeesModal = ref(false);

const followingInProcess = ref(false);
async function follow() {
  followingInProcess.value = true;

  try {
    await trpc.commands.users.follow.mutate({
      followeeId: user.value!.id,
    });

    user.value!.fetchFollowers();
  } catch (e) {
    console.error(e);
  } finally {
    followingInProcess.value = false;
  }
}
async function unfollow() {
  followingInProcess.value = true;

  try {
    await trpc.commands.users.unfollow.mutate({
      followeeId: user.value!.id,
    });

    user.value!.fetchFollowers();
  } catch (e) {
    console.error(e);
  } finally {
    followingInProcess.value = false;
  }
}

enum Tab {
  Created,
  Liked,
  Collected,
}

const tab = ref(Tab.Created);
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  template(v-if="user.resolved")
    template(v-if="user.value")
      .flex.flex-col.gap-4
        .w-full.overflow-hidden.rounded-lg(style="aspect-ratio: 16/4.5")
          Placeholder.h-full.w-full.bg-base-100(
            v-if="!bgpUseImage || bgpUseImage.isLoading.value"
            :animated="!!bgpUseImage && !bgpUseImage.isLoading.value"
            :title="(user.value.name || 'This user') + `'s background`"
          )
          img.bg-checkerboard.w-full.bg-fixed.object-cover(
            style="aspect-ratio: 16/4.5"
            v-else-if="bgpSrc"
            :src="bgpSrc"
            :alt="(user.value.name || 'This user') + `'s background`"
          )

        .z-10.-mt-4.flex.flex-col.gap-2
          .flex.justify-between.py-2.pl-2
            .-mt-16.w-32.overflow-hidden.rounded-full.bg-white.p-1
              PFP.h-full.w-full.rounded-full.object-cover(:user="user.value")
            .flex.gap-2
              template(v-if="isSelf")
                button.btn.h-max.w-max(@click="editModal = true") Edit 📝
                button.btn.btn-error.h-max.w-max(@click="logout") Logout
              template(v-else)
                button.btn.btn-ghost.h-max.w-max(
                  v-if="user.value.isMeFollowing.value"
                  @click="unfollow"
                  :disabled="followingInProcess"
                ) Unfollow
                button.btn.btn-primary.h-max.w-max(
                  v-else
                  @click="follow"
                  :disabled="followingInProcess"
                ) Follow

          .flex.flex-col.gap-2
            .flex.flex-col.gap-1
              span.leading-none
                span.text-xl.font-bold.leading-none.tracking-wide(
                  v-if="user.value.name"
                ) {{ user.value.name }}
                span.text-xl.font-bold.leading-none.tracking-wide.text-base-400(
                  v-else
                ) Anonymous
                CheckBadgeIcon.inline-block.h-5.align-text-top.text-blue-500(
                  v-if="user.value.verified"
                  v-tippy="{ content: 'Verified' }"
                )
                span.leading-none.text-base-400(v-if="user.value.id == userId") &nbsp;(you)

              span.text.leading-none.text-base-500(v-if="user.value.handle") @{{ user.value.handle }}
              span.text.italic.leading-none.text-base-400(v-else) @undefined

            .mt-1.flex.gap-2
              span
                span.font-semibold {{ user.value.collectorsCount.value }}
                span.text-base-500 &nbsp;collectors
              span
                span.font-semibold {{ user.value.followersCount.value }}
                span.text-base-500 &nbsp;followers
              span.link-hover.cursor-pointer(
                v-if="followeesCount"
                @click="followeesModal = true"
              )
                span.font-semibold {{ followeesCount }}
                span.text-base-500 &nbsp;followees
              span
                span.font-semibold {{ user.value.likesReceived }}
                span.text-base-500 &nbsp;likes
              //- span
              //-   span.font-semibold {{ created.reduce((acc, c) => (acc += c.photosLength), 0) }}
              //-   span.text-base-500 &nbsp;photos

            //- .flex.items-center.justify-between.gap-3
            //-   h2.shrink-0.text-xl.font-semibold About 🐾
            //-   .h-px.w-full.bg-base-100

            Markdown.prose.flex.flex-col.leading-tight(
              v-if="user.value.bio"
              :source="user.value.bio"
              :breaks="true"
            )
            //- p.text-base-400(v-else) Empty

        template(v-if="created.length")
          .flex.items-center.justify-between.gap-3
            h2.shrink-0.text-xl.font-semibold Gallery 🖼
            .h-px.w-full.bg-base-100
            span.shrink-0.text-sm.text-base-500 {{ created.reduce((acc, c) => (acc += c.photosLength), 0) }} photos

          ._gallery.flex.max-h-72.w-full.flex-wrap.gap-2.overflow-y-auto.rounded-lg
            template(
              v-for="collectible in created.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())"
            )
              ContentCard.pressable.flex-shrink-0.cursor-pointer.rounded-lg.transition-transform(
                :content="content"
                v-for="content in collectible.content"
                :key="content.name"
                :preview="content.gated"
                @click="setGallery(created, collectible, content)"
              )

        .flex.items-center.justify-between.gap-3
          h2.shrink-0.text-xl.font-semibold Collectibles 🧸
          .h-px.w-full.bg-base-100

        .flex.justify-between.gap-4.overflow-hidden.border-b
          .tab.group.cursor-pointer(
            v-tippy="{ content: 'Collectibles created' }"
            :class="{ active: tab == Tab.Created }"
            @click="tab = Tab.Created"
          )
            button.flex.justify-center.gap-2
              span.hidden.sm_inline Created
              span ✨
          .tab.group.cursor-pointer(
            v-tippy="{ content: 'Collectibles liked' }"
            :class="{ active: tab == Tab.Liked }"
            @click="tab = Tab.Liked"
          )
            button.flex.justify-center.gap-2
              span.hidden.sm_inline Liked
              span ❤️
          .tab.group.cursor-pointer(
            v-if="isSelf"
            v-tippy="{ content: 'Collectibles collected (private)' }"
            :class="{ active: tab == Tab.Collected }"
            @click="tab = Tab.Collected"
          )
            button.flex.justify-center.gap-2
              span.hidden.sm_inline Collected
              span 💎

        .flex.flex-col.gap-4(v-if="tab == Tab.Created")
          CollectiblePost.w-full.rounded-lg.border(
            v-if="created.length"
            v-for="collectible in created.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())"
            style="grid-template-rows: 1fr"
            :collectible="collectible"
            :show-gallery="true"
            @choose-content="(e) => { setGallery(created, collectible, e); }"
          )
          p.p-8.text-center.text-lg.leading-snug.text-base-500(v-else)
            span(v-if="isSelf") You
            span.font-bold(v-else-if="user.value.name") {{ user.value.name }}
            span(v-else) This user
            |
            | {{  (isSelf ? "haven't" : "hasn't")  }} created anything yet. 🤔

        .flex.flex-col.items-center.gap-4(v-else-if="tab == Tab.Liked")
          CollectiblePost.w-full.rounded-lg.border(
            v-if="liked.length"
            v-for="collectible in liked.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())"
            style="grid-template-rows: 1fr"
            :collectible="collectible"
            :show-gallery="true"
            @choose-content="(e) => { setGallery(liked, collectible, e); }"
          )
          p.p-8.text-center.text-lg.leading-snug.text-base-500(v-else)
            span(v-if="isSelf") You
            span.font-bold(v-else-if="user.value.name") {{ user.value.name }}
            span(v-else) This user
            |
            | {{  (isSelf ? "haven't" : "hasn't")  }} liked anything yet. 💔

        .flex.flex-col.items-center.gap-4(v-else-if="tab == Tab.Collected")
          CollectiblePost.w-full.rounded-lg.border(
            v-if="collected.length"
            v-for="collectible in collected.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())"
            style="grid-template-rows: 1fr"
            :collectible="collectible"
            :show-gallery="true"
            @choose-content="(e) => { setGallery(collected, collectible, e); }"
          )
          p.p-8.text-center.text-lg.leading-snug.text-base-500(v-else)
            span You haven't collected anything yet. 💁‍♂️

      GalleryModal(
        :open="galleryCollectible !== undefined"
        :collectibles="galleryCollectibles"
        :collectible="galleryCollectible"
        :content="galleryContent"
        @close="() => { galleryContent = undefined; galleryCollectible = undefined; }"
        @choose-content="galleryContent = $event"
        @choose-collectible="(e) => { galleryContent = undefined; galleryCollectible = e; }"
      )

      EditModal(
        :open="editModal"
        :user="user.value"
        @close="editModal = false"
        @update="onUserUpdate"
      )

      FolloweesModal(
        v-if="isSelf"
        :open="followeesModal"
        @close="followeesModal = false"
      )

    template(v-else)
      h1 Not found
  template(v-else)
    h1 Loading...
</template>

<style lang="scss">
.prose {
  p {
    @apply my-1;
  }
}
</style>

<style lang="scss" scoped>
._gallery > * {
  width: calc((100% / 6) - 0.4rem - 1px);

  // On mobile, we want to show 2 items per row
  @media (max-width: 640px) {
    width: calc((100% / 3) - 0.4rem - 1px);
  }
}

// .tab {
//   @apply flex w-full justify-center font-semibold transition;

//   & > button {
//     @apply h-full w-full select-none px-2 py-1.5;
//   }

//   &.active {
//     @apply bg-primary-500 text-white;
//   }
// }

.tab {
  @apply flex w-full justify-center border-b-4 font-semibold;

  & > button {
    @apply h-full w-full select-none px-2 py-1.5;
  }

  &.active {
    @apply border-b-4 border-b-primary-500 text-primary-500;
  }
}
</style>
