<script setup lang="ts">
import { loginModal } from "@/modules/auth";

const imageSources = [
  "/landing/03ac50eb15af3213d0691d060e27b5d3.jpg",
  "/landing/3ed3bebada002c9e302fffe3b9e2b16a.jpg",
  "/landing/4af5f023fd817574a3de8d2c36d63cb5.jpg",
  "/landing/4c2d4393e7f1f968b195cec53bb1d78f.jpg",
  "/landing/5ae88e521ff0b12a771856a5ce164674.jpg",
  "/landing/5ff50ca8e3474bdb2810ce0df19e4aa1.jpg",
  "/landing/46f97d0a21822e1252184e9379ba00a4.jpg",
  "/landing/2987712b8df93659ee23507720383483.jpg",
  "/landing/2987712b8df93659ee23507720383483.jpg",
  "/landing/ad4109ea40863a07ebaaf964957a34a3.jpg",
  "/landing/d7bac49993ec49635810bfe198683053.jpg",
  "/landing/dc0ea7e35d3692461e8d4ebc4e84b5e7.jpg",
  "/landing/dc0ea7e35d3692461e8d4ebc4e84b5e7.jpg",
];

function pickRandomImages(length: number) {
  const images = new Set<string>();
  while (images.size < length) {
    images.add(imageSources[Math.floor(Math.random() * imageSources.length)]);
  }
  return Array.from(images);
}
</script>

<template lang="pug">
.relative.flex.h-screen.w-full.items-center.justify-center.p-4
  .absolute.-z-10.grid.h-full.w-full.grid-cols-5.overflow-hidden.brightness-50
    img.h-full.w-full.object-cover(
      v-for="image in pickRandomImages(5)"
      :src="image"
      :key="image"
    )
  .flex.max-w-lg.flex-col.justify-center.gap-6.rounded-xl.bg-white.p-6.shadow-xl
    h1.text-5xl.font-black Connect to your fans like never before.
    h2.text-xl.font-bold Kawaiii.co™️ is a revolutionary Web3 service for kawaii creators and their fans.
    ul.flex.flex-col.gap-1
      li.leading-tight ✅ Collect exclusive content on-chain, and get paid for it.
      li.leading-tight ✅ Proceeds go instantly and directly to your Polygon wallet.
      li.leading-tight ✅ The content is decentralized; you can't be censored.
      li.leading-tight ✅ Royalties enabled for the secondary market.
    button.btn.btn-lg.btn-hoverable.btn-nft.group(@click="loginModal = true") Get started
</template>
