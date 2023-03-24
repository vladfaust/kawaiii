<script setup lang="ts">
import { userId } from "@/modules/auth";
import Feed from "./Feed.vue";
import Landing from "./Landing.vue";
</script>

<template lang="pug">
Feed(v-if="userId")
Landing(v-else)
</template>
