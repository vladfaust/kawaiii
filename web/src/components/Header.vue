<script setup lang="ts">
import User from "@/model/User";
import { userId, loginModal } from "@/modules/auth";
import { shallowRef, watch } from "vue";
import PFP from "./PFP.vue";
import Jdenticon from "./util/Jdenticon.vue";

// REFACTOR: Move user to the auth store.
const user = shallowRef<User | undefined>();

watch(
  () => userId.value,
  () => {
    if (userId.value) {
      User.get(userId.value).then((u) => {
        user.value = u;
      });
    }
  },
  {
    immediate: true,
  }
);
</script>

<template lang="pug">
header.flex.h-16.w-full.place-content-center.border-b.px-4
  .grid.h-full.w-full.max-w-3xl.grid-cols-2
    ul._left.flex.h-full.items-center.gap-4
      li.h-full
        RouterLink._link.logo(to="/")
          .flex.gap-1.text-xl.font-black.tracking-wide
            span kawaiii.co
    ul.flex.items-center.justify-end.gap-4
      template(v-if="userId")
        li.h-full
          RouterLink._link.relative.flex.justify-center.gap-2(
            :to="{ name: 'NewCollectible' }"
          )
            span.hidden.sm_inline Create
            span.sm_hidden ✨
        li.h-full(v-if="userId")
          RouterLink._link.gap-2(:to="{ name: 'Me' }")
            PFP.h-8.rounded-full(v-if="user" :user="user" :key="user.id")
            Jdenticon.h-8.rounded-full(v-else :input="userId" :key="userId")
      template(v-else)
        .hidden.sm_contents
          li._link.h-full.shrink-0
            button.btn.btn-sm(@click="loginModal = true")
              | Sign up
        li._link.h-full.shrink-0
          button.btn.btn-sm.btn-web3(@click="loginModal = true")
            | Log in
</template>

<style lang="scss" scoped>
._link {
  @apply flex h-full items-center justify-center border-y-4 border-t-transparent px-2 font-bold;
  @apply hover_text-primary-500;
}
.router-link-exact-active {
  @apply border-b-primary-500 text-primary-500;
}
</style>
