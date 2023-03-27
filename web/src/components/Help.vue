<script setup lang="ts">
import config from "@/config";
import Callout from "./util/Callout.vue";
</script>

<template lang="pug">
.m-4.flex.w-full.max-w-3xl.flex-col.gap-3
  h2#connect
    a.link-hover(href="#connect") Connect Your Wallet

  p
    | A crypto wallet is usually a browser extension, and it holds your digital currency, in this case {{ config.eth.chain.nativeCurrency.symbol }}.
    | Once you connect your wallet, you can approve actions on kawaiii™️, such as creating, minting or re-selling a collectible.
    | However, we cannot access your funds or take any actions without your permission.

  p
    | The most common wallet provider is called
    |
    a.link(href="https://metamask.io") MetaMask
    | , and you can download it as a browser extension.
    | Follow their instructions to install the extension and create a wallet.
    | You do not need to have any digital currency to link your wallet with us.
    | You can follow profiles and like collectibles without spending anything.

  p
    | kawaiii™️ uses the {{ config.eth.chain.chainName }} network to reduce transaction costs.
    | When you connect your wallet, you will need to approve a chain switch by clicking a button.

  img.window-screenshot(
    src="/help/1.png"
    title="Chain switch notification example"
  )

  p
    | You will also be required to sign a message to prove that you own the wallet.

  img.window-screenshot(src="/help/2.png" title="Signature request example")

  h2#create
    a.link-hover(href="#create") Create a Collectible

  p
    | A collectible is a unique digital item that has a limited number of copies (also called
    |
    i mints
    | ).
    | Once the maximum number of copies is reached, no more can be
    |
    i minted
    | .
    | On kawaiii™️, owning a copy of a collectible gives you exclusive access to hidden content.
    | This makes collectibles valuable and rare.

  Callout.my-1(type="info")
    p
      | For example, if you want a cute picture of your favorite anime character, there may only be 50 copies available.
      | After these, no more can be minted.
      | The only way to get the picture would be to buy one of the existing copies.

  p
    | To create a collectible, fill in the details of your collectible and click the button to create it.

  img(src="/help/3.png" title="Create collectible page example")

  p
    | Creating a collectible implies signing a
    |
    i gasless
    |
    | transaction, which means that you will NOT be charged for it.
    | Yes, creating a collectible is free!

  img.window-screenshot(
    src="/help/4.png"
    title="Gasless transaction signature example"
  )

  p
    | Once the collectible is created, it will appear in your profile, and will be available to mint by others.

  img(src="/help/5.png" title="Collectible post example")

  h2#collect
    a.link-hover(href="#collect") Collect Your Collectibles

  p
    | When you find a collectible you like, you can mint it to get a copy.
    | Owning a copy of a collectible gives you exclusive access to its hidden content.

  img(src="/help/6.png" title="Collection interface example")

  p
    | Minting a collectible requires you to pay for it using {{ config.eth.chain.nativeCurrency.symbol }}, which is the currency used on the {{ config.eth.chain.chainName }} network.
    | You can buy {{ config.eth.chain.nativeCurrency.symbol }} from an exchange or use a service like
    |
    a.link(href="https://www.moonpay.com/") Moonpay
    |
    | to purchase it.
    | To mint a collectible, you need to click a button and confirm the transaction in your wallet.

  img.window-screenshot(
    src="/help/7.png"
    title="Minting transaction signature example"
  )

  p
    | Once the transaction is complete, the collectible will appear in your profile, and you will be able to access its hidden content. 🎉

  img(src="/help/8.png" title="Owned collectible example")
  img(src="/help/9.png" title="Content view example")
</template>

<style lang="scss" scoped>
h1 {
  @apply text-2xl font-extrabold leading-tight;
}

h2 {
  @apply text-2xl font-semibold leading-tight;
}

p {
  @apply text-justify leading-tight text-base-700;
}

img {
  @apply w-full max-w-lg place-self-center;
}

img:not(.window-screenshot) {
  @apply mt-8 mb-12 rounded-xl shadow-2xl;
}
</style>
