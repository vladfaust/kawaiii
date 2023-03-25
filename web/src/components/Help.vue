<script setup lang="ts">
import config from "@/config";
import Callout from "./util/Callout.vue";
</script>

<template lang="pug">
.m-4.flex.w-full.max-w-3xl.flex-col.gap-3
  h1 Help Page
  h2#connect Connect Your Wallet

  p
    | To connect your wallet to kawaiii.co™️, you need to link it to our website.
    | Your wallet is usually a browser extension, and it holds your digital currency, such as Bitcoin or Ethereum.
    | Once you link your wallet, you can approve actions on our website, such as creating, minting or re-selling a collectible.
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
    | kawaiii.co™️ uses the {{ config.eth.chain.chainName }} network to reduce transaction costs.
    | When you connect your wallet, you will need to approve a chain switch by clicking a button.

  img(
    src="/help/Screenshot 2023-03-26 at 15.13.45.png"
    title="Chain switch notification example"
  )

  p
    | You will also be required to sign a message to prove that you own the wallet.

  img(
    src="/help/Screenshot 2023-03-26 at 15.12.30.png"
    title="Signature request example"
  )

  h2#create Create a Collectible

  p
    | A collectible is a unique digital item that has a limited number of copies (also called
    |
    i mints
    | ).
    | Once the maximum number of copies is reached, no more can be
    |
    i minted
    | .
    | On kawaiii.co™️, owning a copy of a collectible gives you exclusive access to hidden content.
    | This makes collectibles valuable and rare.

  Callout.my-1(type="info")
    p
      | For example, if you want a cute picture of your favorite anime character, there may only be 100 copies available.
      | Once those are sold, no more can be minted.
      | The only way to get the picture is to buy one of the existing copies.
      | This creates a sense of rarity and makes them more desirable.

  p
    | To create a collectible, follow this link (once logged in):
    |
    RouterLink.link(:to="{ name: 'NewCollectible' }") Create a Collectible.
    |
    | Fill in the details of your collectible and click the button to create it.

  img.my-12.rounded-xl.border.shadow-2xl(
    src="/help/Screenshot 2023-03-26 at 15.30.23.png"
    title="Create collectible page example"
  )

  p
    | Creating a collectible implies signing a
    |
    i gasless
    |
    | transaction, which means that you will NOT be charged for it.
    | Yes, creating a collectible is free!

  img(
    src="/help/Screenshot 2023-03-26 at 15.34.26.png"
    title="Gasless transaction signature example"
  )

  p
    | Once the collectible is created, it will appear in your profile, and will be available to mint by others.

  img.my-12.rounded-xl.border.shadow-2xl(
    src="/help/Screenshot 2023-03-26 at 15.57.23.png"
    title="Collectible post example"
  )

  h2#collect Collect Your Collectibles

  p
    | Once you find a collectible you like, you can mint it to get a copy.
    | Owning a copy of a collectible gives you exclusive access to its hidden content.

  img.my-12.rounded-xl.border.shadow-2xl(
    src="/help/Screenshot 2023-03-26 at 15.59.25.png"
    title="Collection interface example"
  )

  p
    | Minting a collectible requires you to pay for it using {{ config.eth.chain.nativeCurrency.symbol }}, which is the currency used on the {{ config.eth.chain.chainName }} network.
    | You can buy {{ config.eth.chain.nativeCurrency.symbol }} from an exchange or use a service like
    |
    a.link(href="https://www.moonpay.com/") Moonpay
    |
    | to purchase it.
    | To mint a collectible, you need to click a button and confirm the transaction in your wallet.

  img(
    src="/help/Screenshot 2023-03-26 at 16.01.10.png"
    title="Minting transaction signature example"
  )
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
</style>
