<script setup lang="ts">
import User from "@/model/User";
import { explicitLogin, userId } from "@/modules/auth";
import { shallowRef, watch } from "vue";
import PFP from "./PFP.vue";
import { useRouter } from "vue-router";

const user = shallowRef<User | undefined>();
const router = useRouter();

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

async function login() {
  await explicitLogin();
  router.push({ name: "Me" });
}
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
          RouterLink._link.relative(:to="{ name: 'NewCollectible' }")
            //- .absolute.top-1.-right-1.rounded.bg-green-500.px-1.text-xs.text-white.shadow Free!
            span Create ✨
        li.h-full(v-if="user")
          RouterLink._link.gap-2(:to="{ name: 'Me' }")
            PFP.h-8.rounded-full(:user="user" :key="user.id")
      li._link.h-full(v-else)
        button.btn.btn-sm.btn-web3(@click="login")
          | Login
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
