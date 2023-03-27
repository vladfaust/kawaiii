<script setup lang="ts">
import User from "@/model/User";
import { trpc } from "@/services/api";
import { onMounted, shallowRef } from "vue";
import PFP from "@/components/PFP.vue";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { CheckBadgeIcon } from "@heroicons/vue/20/solid";

defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const followees = shallowRef<User[]>();

async function follow(followee: User) {
  try {
    await trpc.commands.users.follow.mutate({ followeeId: followee.id });
    followee.isMeFollowing.value = true;
  } catch (e) {
    console.error(e);
  }
}

async function unfollow(followee: User) {
  try {
    await trpc.commands.users.unfollow.mutate({ followeeId: followee.id });
    followee.isMeFollowing.value = false;
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  followees.value = await Promise.all(
    (await trpc.commands.users.getFollowees.query()).map((id) => User.get(id))
  );
});
</script>

<template lang="pug">
Dialog.relative.z-40(:open="open" @close="emit('close')")
  .fixed.inset-0(class="bg-black/30" aria-hidden="true")
  .fixed.inset-0.overflow-y-auto.p-4
    .flex.min-h-full.items-center.justify-center
      DialogPanel.flex.w-full.max-w-lg.flex-col.gap-4.rounded-xl.bg-white.p-4.shadow-lg
        DialogTitle.flex.items-center.justify-between.gap-3
          span.shrink-0.text-lg.font-bold My followees
          .h-px.w-full.bg-base-100
          button.pressable.shrink-0.text-base-300.transition-transform(
            @click="emit('close')"
          )
            | ❌
        .flex.flex-col.gap-2
          .flex.items-center.justify-between.gap-3(
            v-for="followee in followees"
            :key="followee.id"
          )
            RouterLink.pressable.link-hover.flex.shrink-0.items-center.gap-2.transition-transform(
              :to="{ name: 'Profile', params: { handle: followee.handle } }"
            )
              PFP.h-12.rounded-full(:user="followee")
              .flex.flex-col(class="gap-0.5")
                span.font-semibold.leading-none.tracking-wide
                  | {{ followee.name }}
                  CheckBadgeIcon.inline-block.h-4.align-top.text-blue-500(
                    v-if="followee.verified"
                    class="ml-0.5"
                    v-tippy="{ content: 'Verified' }"
                  )
                .text-sm.leading-none.text-base-500 @{{ followee.handle }}
            .h-px.w-full.bg-base-100
            .flex.shrink-0
              button.btn.btn-error.h-max(
                v-if="followee.isMeFollowing.value"
                @click="() => unfollow(followee)"
              )
                | Unfollow
              button.btn.btn-primary.h-max(
                v-else
                @click="() => follow(followee)"
              )
                | Follow
</template>
