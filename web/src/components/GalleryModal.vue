<script setup lang="ts">
import Collectible from "@/model/Collectible";
import Content from "@/model/Collectible/Content";
import { Dialog, DialogPanel } from "@headlessui/vue";
import CollectiblePost from "@/components/Collectible/Post.vue";
import ContentCard from "@/components/Collectible/Content/Card.vue";
import CollectButton from "./Collectible/CollectButton.vue";
import { nonNullable, toHex } from "@/util";
import { ref, watchEffect } from "vue";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/vue/20/solid";
import CollectibleCard from "./Collectible/Card.vue";

const props = defineProps<{
  collectibles: Collectible[];
  collectible: Collectible | undefined;

  // When content is not chosen, but collectible is, the preview is displayed.
  content: Content | undefined;

  open: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "chooseContent", content: Content): void;
  (event: "chooseCollectible", collectible: Collectible): void;
}>();

function close() {
  emit("close");
}

const collectiblesListRef = ref<HTMLElement>();
const contentPreviewsListRef = ref<HTMLElement>();

function up() {
  // Move to the previous collectible, or noop if the first one is selected.
  //

  if (props.collectible) {
    const index = props.collectibles.indexOf(props.collectible);

    if (index > 0) {
      emit("chooseCollectible", props.collectibles[index - 1]);
    }
  } else {
    emit(
      "chooseCollectible",
      props.collectibles[props.collectibles.length - 1]
    );
  }
}

function down() {
  // Move to the next collectible, or noop if the last one is selected.
  //

  if (props.collectible) {
    const index = props.collectibles.indexOf(props.collectible);

    if (index < props.collectibles.length - 1) {
      emit("chooseCollectible", props.collectibles[index + 1]);
    }
  } else {
    emit("chooseCollectible", props.collectibles[0]);
  }
}

function left() {
  // Move to the previous content,
  // or collectible preview if the first one is selected,
  // or noop if the collectible preview is selected.
  //

  if (props.content) {
    const index = props.collectible?.content.indexOf(props.content);

    if (index && index > 0) {
      emit("chooseContent", props.collectible?.content[index - 1]!);
    } else {
      emit("chooseCollectible", props.collectible!);
    }
  } else if (props.collectible) {
    // noop
  }
}

function right() {
  // Move to the next content,
  // or noop if the last one is selected.
  //

  if (props.content) {
    const index = props.collectible!.content.indexOf(props.content);

    if (index < props.collectible?.content.length! - 1) {
      emit("chooseContent", props.collectible?.content[index + 1]!);
    }
  } else if (props.collectible) {
    emit("chooseContent", props.collectible.content[0]);
  }
}

function keydown(event: KeyboardEvent) {
  switch (event.key) {
    case "ArrowUp":
      up();
      event.preventDefault();
      break;
    case "ArrowDown":
      down();
      event.preventDefault();
      break;
    case "ArrowLeft":
      left();
      event.preventDefault();
      break;
    case "ArrowRight":
      right();
      event.preventDefault();
      break;
  }
}

watchEffect(() => {
  if (props.open) {
    document.addEventListener("keydown", keydown);
    console.log("added");
  } else {
    document.removeEventListener("keydown", keydown);
    console.log("removed");
  }
});

watchEffect(() => {
  if (props.collectible && collectiblesListRef.value) {
    const index = props.collectibles.indexOf(props.collectible);

    if (index > 0) {
      const collectibleElement = collectiblesListRef.value?.children[index] as
        | HTMLElement
        | undefined;

      if (!collectibleElement) {
        throw new Error("Collectible element not found");
      }

      const top =
        collectibleElement.offsetTop -
        collectiblesListRef.value.clientTop / 2 -
        collectibleElement.offsetHeight / 2 -
        4;

      collectiblesListRef.value?.scrollTo({
        top,
        behavior: "smooth",
      });
    } else {
      // Scroll to the beginning of the list.
      collectiblesListRef.value?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }
});

watchEffect(() => {
  if (props.content && contentPreviewsListRef.value) {
    const contentElement = contentPreviewsListRef.value?.children[
      props.collectible?.content.indexOf(props.content)! + 1
    ] as HTMLElement | undefined;

    if (!contentElement) {
      throw new Error("Content element not found");
    }

    const left =
      contentElement.offsetLeft -
      contentPreviewsListRef.value.clientWidth / 2 -
      contentElement.offsetWidth / 2;

    contentPreviewsListRef.value?.scrollTo({
      left,
      behavior: "smooth",
    });
  } else {
    // Scroll to the beginning of the list.
    contentPreviewsListRef.value?.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }
});
</script>

<template lang="pug">
Dialog.relative.z-40(:open="open" @close="close")
  .fixed.inset-0(class="bg-black/50" aria-hidden="true")
  .fixed.inset-0.p-4
    .flex.items-center.justify-self-center.shadow-lg(
      style="height: calc(100vh - 2rem)"
    )
      DialogPanel.relative.flex.h-full.w-full.flex-col.gap-4.rounded-xl.bg-white.shadow-lg
        .pressable.absolute.-top-1.-right-1.z-30.flex.h-10.w-10.cursor-pointer.items-center.justify-center.rounded-full.bg-white.shadow-lg.transition-transform(
          @click.stop="close"
        )
          span ❌
        .grid.grid-cols-12.md_divide-x
          //- Collectible list
          .hidden.flex-col.items-center.divide-y.md_flex(
            style="height: calc(100vh - 2rem)"
          )
            .group.flex.w-full.cursor-pointer.justify-center(@click="up")
              ChevronUpIcon.h-12.opacity-50.transition.group-hover_opacity-100.group-active_scale-95

            .flex.h-full.flex-col.items-center.divide-y.overflow-y-auto(
              ref="collectiblesListRef"
            )
              .p-2(v-for="collectible_ in collectibles")
                //- FIXME: Placeholder isn't rendered.
                CollectibleCard.pressable.w-full.shrink-0.cursor-pointer.rounded-xl.transition.hover_brightness-100(
                  :collectible="collectible_"
                  @click="emit('chooseCollectible', collectible_)"
                  :class="{ 'brightness-75': collectible_ !== collectible }"
                )

            .group.flex.w-full.cursor-pointer.justify-center(@click="down")
              ChevronDownIcon.h-12.opacity-50.transition.group-hover_opacity-100.group-active_scale-95

          //- Post
          .col-span-3.hidden.overflow-y-auto.lg_block(
            style="height: calc(100vh - 2rem)"
          )
            CollectiblePost.border-b(
              v-if="collectible"
              :collectible="collectible"
              :showGallery="false"
              :key="toHex(collectible.id)"
            )

          //- Content
          .col-span-12.md_col-span-11.lg_col-span-8(
            v-if="collectible"
            style="height: calc(100vh - 2rem)"
          )
            .flex.h-full.w-full.flex-col.items-center.justify-center.divide-y
              //- The content itself
              .relative.flex.h-full.w-full.items-center.justify-center.overflow-hidden
                .group.absolute.left-0.z-20.flex.h-full.cursor-pointer.items-center.md_relative.md_border-r(
                  @click="left"
                )
                  ChevronLeftIcon.h-12.text-white.drop-shadow.transition.group-hover_opacity-100.group-active_scale-95.md_text-inherit.md_opacity-50.md_drop-shadow-none

                .absolute.z-10.m-12.flex.flex-col.gap-2.rounded-lg.p-6.shadow-lg.backdrop-blur.backdrop-brightness-125.bg-white(
                  v-if="content && content.gated && !content.unlocked.value"
                )
                  p.max-w-xs.text-center.leading-tight
                    span.text-lg.font-extrabold 🔒 The content is locked.
                    br
                    span.font-semibold You need to own the collectible in order to unlock its content.
                  CollectButton.btn-lg(:collectible="collectible")

                .flex.h-full.w-full.items-center.justify-center
                  img.h-full.select-none.object-contain(
                    :src="content ? (content.gated ? (content.unlocked.value ? content.url.toString() : content.previewBlurredUrl.toString()) : content.url.toString()) : collectible.previewUrl.toString()"
                    :alt="content ? content.name : collectible.name"
                    :key="content ? content.name : collectible.name"
                  )

                .group.absolute.right-0.z-20.flex.h-full.cursor-pointer.items-center.md_relative.md_border-l(
                  @click="right"
                )
                  ChevronRightIcon.h-12.text-white.drop-shadow.transition.group-hover_opacity-100.group-active_scale-95.md_text-inherit.md_opacity-50.md_drop-shadow-none

              //- Previews
              .flex.h-24.w-full.shrink-0.items-center.justify-center.p-2
                .flex.h-full.w-max.max-w-full.gap-2.overflow-x-auto.overscroll-x-none(
                  ref="contentPreviewsListRef"
                )
                  //- Collectible preview
                  CollectibleCard.pressable.aspect-square.w-min.shrink-0.cursor-pointer.rounded-xl.transition.hover_brightness-100(
                    :collectible="collectible"
                    @click="emit('chooseCollectible', nonNullable(collectible))"
                    :class="{ 'brightness-75': content }"
                    :key="toHex(collectible.id)"
                  )

                  //- Content previews
                  ContentCard.pressable.aspect-square.w-min.shrink-0.cursor-pointer.rounded-xl.transition.hover_brightness-100(
                    v-for="content_ in collectible.content"
                    :content="content_"
                    @click="emit('chooseContent', content_)"
                    :class="{ 'brightness-75': content_ !== content }"
                    :key="content_.name"
                  )
</template>
