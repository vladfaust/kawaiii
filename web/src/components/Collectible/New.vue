<script setup lang="ts">
import { useFileDialog, useDropZone } from "@vueuse/core";
import { computed, watch, ref, type Ref, onMounted, onUnmounted } from "vue";
import { Sortable } from "sortablejs-vue3";
import { nanoid } from "nanoid";
import config from "@/config";
import prettyBytes from "pretty-bytes";
import { QuestionMarkCircleIcon } from "@heroicons/vue/20/solid";
import { provider } from "@/services/eth";
import { ethPrice, trpc } from "@/services/api";
import { random } from "nanoid";
import { ethers } from "ethers";
import { Dialog, DialogPanel } from "@headlessui/vue";
import Spinner from "../util/Spinner.vue";
import axios, { type AxiosProgressEvent } from "axios";
import { toHex } from "@/util";
import { onBeforeRouteLeave } from "vue-router";

type Content = {
  file: File;
  id: string;
  url: string;
  gated: boolean;
};

const PREVIEW_IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const NAME_MAX_LENGTH = 128;
const DESCRIPTION_MAX_LENGTH = 1024;
const MAX_EDITIONS = 1000;
const MAX_CONTENT_FILES = 32;
const MAX_TOTAL_CONTENT_FILE_SIZE = 128 * 1024 * 1024; // 100MB
const INIT_ROYALTY = 25;

const previewImageDialog = useFileDialog({
  accept: "image/*",
  multiple: false,
});
const previewImageFile = computed(() => previewImageDialog.files.value?.[0]);
const previewImageUrl = computed(() =>
  previewImageFile.value
    ? URL.createObjectURL(previewImageFile.value)
    : undefined
);

const contentDropZone: Ref<HTMLDivElement | null> = ref(null);
const draggedContent: Ref<Content | null> = ref(null);
const wouldRemoveDraggedContent = ref(false);
const content: Ref<Content[]> = ref([]);
const totalContentFileSize = computed(() =>
  content.value
    .filter((content) => content.file)
    .reduce((acc, content) => acc + content.file.size, 0)
);
const contentFileDialog = useFileDialog({
  accept: "image/*",
  multiple: true,
});
function onDrop(files: File[] | null) {
  if (files) {
    content.value.push(
      ...files.map((file) => ({
        file,
        id: nanoid(),
        url: URL.createObjectURL(file),
        gated: false,
      }))
    );
  } else {
    if (draggedContent.value) {
      wouldRemoveDraggedContent.value = true;
      contentFileDialog.reset();
    }
  }
}
const { isOverDropZone: isOverContentDropZone } = useDropZone(
  contentDropZone,
  onDrop
);
watch(
  () => contentFileDialog.files.value,
  (files) => {
    if (files) {
      for (let i = 0; i < files.length; i++) {
        content.value.push({
          file: files[i],
          id: nanoid(),
          url: URL.createObjectURL(files[i]),
          gated: false,
        });
      }
    }
  }
);
function onContentSortStart(event: any) {
  draggedContent.value = content.value[event.oldDraggableIndex];
}
function onContentSortEnd(event: any) {
  const oldIndex = event.oldIndex;
  const newIndex = event.newIndex;

  const element = content.value.splice(oldIndex, 1)[0];

  if (!wouldRemoveDraggedContent.value) {
    // Add the element back in the new position.
    content.value.splice(newIndex, 0, element);
  } else {
    // Do not add the element back in.
    wouldRemoveDraggedContent.value = false;
  }

  draggedContent.value = null;
}
function toggleGated(content_: Content) {
  content_.gated = !content_.gated;
}

const name = ref("");
const description: Ref<string | undefined> = ref();
const editions: Ref<number | undefined> = ref();
const priceEth: Ref<number | undefined> = ref();
const royalty = ref(INIT_ROYALTY);

const anyChanges = computed(
  () =>
    !!previewImageFile.value ||
    !!name.value ||
    !!description.value ||
    !!editions.value ||
    !!priceEth.value ||
    royalty.value != INIT_ROYALTY ||
    content.value.length > 0
);

const createDialog = ref(false);
enum CreateStage {
  WaitingForSignature,
  Uploading,
  Done,
}
const createStage = ref(CreateStage.WaitingForSignature);
const totalUploadSize = computed(
  () =>
    (previewImageFile.value?.size || 0) +
    content.value.reduce((acc, content) => acc + content.file.size, 0)
);
const uploadedTotal = ref(0);
const uploadProgress = computed(() => {
  if (totalUploadSize.value === 0) {
    return 0;
  }

  return uploadedTotal.value / totalUploadSize.value;
});
const uploadRate = ref(0);
async function create() {
  if (!previewImageFile.value) {
    alert("Please select a preview image.");
    return;
  }

  if (previewImageFile.value.size > PREVIEW_IMAGE_MAX_SIZE) {
    alert(
      `Preview image is too large. Please select an image smaller than ${prettyBytes(
        PREVIEW_IMAGE_MAX_SIZE,
        { binary: true }
      )}.`
    );
    return;
  }

  if (!name.value) {
    alert("Please enter a name.");
    return;
  }

  if (name.value.length > NAME_MAX_LENGTH) {
    alert(
      `Name is too long. Please enter a name shorter than ${NAME_MAX_LENGTH} characters.`
    );
    return;
  }

  if (description.value && description.value?.length > DESCRIPTION_MAX_LENGTH) {
    alert(
      `Description is too long. Please enter a description shorter than ${DESCRIPTION_MAX_LENGTH} characters.`
    );
    return;
  }

  if (!priceEth.value) {
    alert("Please enter a price.");
    return;
  }

  if (priceEth.value < 0.01) {
    alert(
      `Price must be at least 0.01 ${config.eth.chain.nativeCurrency.symbol}.`
    );
    return;
  }

  if (!editions.value || editions.value < 1) {
    alert("Please enter the number of editions.");
    return;
  }

  if (editions.value > MAX_EDITIONS) {
    alert(
      `Too many editions. Please enter a number of editions less than ${MAX_EDITIONS}.`
    );
    return;
  }

  if (royalty.value < 0 || royalty.value > 255) {
    alert("Royalty must be between 0 and 255.");
    return;
  }

  if (content.value.length < 1) {
    alert("Please add at least one content file.");
    return;
  }

  if (content.value.length > MAX_CONTENT_FILES) {
    alert(
      `Too many content files. Please add less than ${MAX_CONTENT_FILES} content files.`
    );
    return;
  }

  if (totalContentFileSize.value > MAX_TOTAL_CONTENT_FILE_SIZE) {
    alert(
      `Content files are too large. Please add content files smaller than ${prettyBytes(
        MAX_TOTAL_CONTENT_FILE_SIZE,
        { binary: true }
      )}.`
    );
    return;
  }

  if (!provider.value) {
    alert("Please connect your wallet.");
    return;
  }

  // Prompt when zero content is marked private.
  if (
    content.value.filter((content) => content.gated).length === 0 &&
    !confirm(
      "Are you sure you want to make all content public? You will not be able to change this later."
    )
  ) {
    return;
  }

  createDialog.value = true;

  try {
    const tokenId = ethers.utils.hexlify(random(32));

    console.debug("Creating collectible with token ID", tokenId);
    const signature = await provider.value.getSigner()._signTypedData(
      {
        chainId: config.eth.chain.chainId,
        name: "Kawaiii Collectible",
        verifyingContract: toHex(config.eth.collectibleAddress),
        version: "1",
      },
      {
        CreateRequest: [
          { name: "tokenId", type: "uint256" },
          {
            name: "editions",
            type: "uint256",
          },
          {
            name: "mintPrice",
            type: "uint256",
          },
          {
            name: "royalty",
            type: "uint8",
          },
        ],
      },
      {
        tokenId,
        editions: editions.value,
        mintPrice: ethers.utils.parseEther(priceEth.value.toString())._hex,
        royalty: royalty.value,
      }
    );

    createStage.value = CreateStage.Uploading;

    const response = await trpc.commands.collectibles.create.mutate({
      id: tokenId,
      name: name.value,
      description: description.value || null,
      editions: editions.value,
      mintPrice: ethers.utils.parseEther(priceEth.value.toString())._hex,

      // FIXME: For some reason, it is sent as string after modifying.
      royalty: parseInt(royalty.value as unknown as string),

      preview: {
        size: previewImageFile.value.size,
      },
      content: content.value.map((content_) => ({
        type: "Image",
        name: content_.file.name,
        size: content_.file.size,
        gated: content_.gated,
      })),
      signature,
    });

    console.debug("Uploading total of " + prettyBytes(totalUploadSize.value));

    const promises = [
      uploadFile(response.previewUploadUrl, previewImageFile.value, (e) => {
        uploadedTotal.value += e.bytes;
        if (e.rate) uploadRate.value = e.rate;
      }).then(() => {
        console.log("Uploaded preview image");
      }),
      ...content.value.map((content_, index) =>
        uploadFile(response.contentUploadUrls[index], content_.file, (e) => {
          uploadedTotal.value += e.bytes;
          if (e.rate) uploadRate.value = e.rate;
        }).then(() => {
          console.log(`Uploaded content file ${index + 1}`);
        })
      ),
    ];

    await Promise.all(promises);
    createStage.value = CreateStage.Done;
  } catch (e) {
    alert("Failed to create collectible. See the console for details.");
    console.error(e);
    createDialog.value = false;
    createStage.value = CreateStage.WaitingForSignature;
  }
}
function reload() {
  window.location.reload();
}

async function uploadFile(
  url: string,
  file: File,
  onUploadProgress?: (e: AxiosProgressEvent) => void
) {
  const response = await axios.request({
    url,
    method: "PUT",
    data: file,
    onUploadProgress,
  });

  if (response.status !== 200) {
    throw new Error("Failed to upload file");
  }
}

function mayLeave(): boolean {
  let answer = true;

  if (anyChanges.value && createStage.value !== CreateStage.Done) {
    answer = window.confirm(
      "Do you really want to leave? All uncomitted data will be lost."
    );
  }

  return answer;
}

onBeforeRouteLeave((to, from, next) => {
  next(mayLeave());
});

function beforeunload(e: BeforeUnloadEvent) {
  if (!mayLeave()) {
    e.preventDefault();

    // Chrome requires returnValue to be set
    e.returnValue = "";
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", beforeunload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", beforeunload);
});
</script>

<template lang="pug">
.m-4.flex.w-full.max-w-3xl.flex-col.gap-3
  .flex.items-center.gap-2
    h1.shrink-0.text-lg.font-bold Create a new collectible 🧸✨
    .h-px.w-full.bg-base-100
  .grid.w-full.gap-3.sm_grid-cols-3
    .flex.flex-col.gap-3
      .flex.items-center.gap-2
        label.label.shrink-0 Preview 🖼
        .h-px.w-full.bg-base-100
        span.shrink-0.leading-none.text-base-300
          | {{ previewImageFile ? prettyBytes(previewImageFile.size, { binary: true }) : 0 }} / {{ prettyBytes(PREVIEW_IMAGE_MAX_SIZE, { binary: true }) }}
          span.cursor-help(
            v-tippy="{ content: 'The preview image is shown in the collectible list and is used as the thumbnail for the collectible. It should be a square image.' }"
          ) ❓
      .aspect-square
        img.pressable.aspect-square.h-full.w-full.cursor-pointer.rounded-lg.object-cover.shadow-lg.transition-transform(
          v-if="previewImageUrl"
          :src="previewImageUrl"
          @click="() => previewImageDialog.open()"
        )
        button.pressable.h-full.w-full.rounded-lg.border.text-base-400.transition-transform(
          v-else
          @click="() => previewImageDialog.open()"
        ) Open file

    .flex.flex-col.gap-3.sm_col-span-2
      .flex.items-center.gap-2
        label.label.shrink-0 Name 🦄
        .h-px.w-full.bg-base-100
        span.shrink-0.leading-none.text-base-300 {{ name.length }} / {{ NAME_MAX_LENGTH }}

      input.input(
        type="text"
        v-model="name"
        placeholder="Collectible name"
        :maxlength="NAME_MAX_LENGTH"
      )
      .flex.items-center.gap-2
        label.label.shrink-0 Description 📝
        .h-px.w-full.bg-base-100
        span.shrink-0.leading-none.text-base-300 {{ description?.length || 0 }} / {{ DESCRIPTION_MAX_LENGTH }}
      textarea.input.h-full.text-sm(
        v-model="description"
        placeholder="Collectible description"
        rows=3
        :maxlength="DESCRIPTION_MAX_LENGTH"
      )

  .grid.w-full.gap-3.sm_grid-cols-3
    .flex.flex-col.gap-2
      .flex.items-center.gap-2
        label.label.shrink-0 Mint price (~${{ ((priceEth || 0) * ethPrice).toFixed(2) }}) 💰
        .h-px.w-full.bg-base-100
        span.shrink-0.cursor-help.leading-none.text-base-200.hover_text-base-400(
          v-tippy="{ content: `Price for minting a single collectible edition, in ${config.eth.chain.nativeCurrency.symbol}.` }"
        ) ❓

      input.input(
        type="number"
        v-model="priceEth"
        :placeholder="'Collectible price in ' + config.eth.chain.nativeCurrency.symbol"
        min=0
        max=10000
        step=0.01
      )

    .flex.flex-col.gap-2
      .flex.items-center.gap-2
        label.label.shrink-0 Editions 💎
        .h-px.w-full.bg-base-100
        span.shrink-0.cursor-help.leading-none.text-base-200.hover_text-base-400(
          v-tippy="'How many collectibles will be ever minted.'"
        ) ❓
      input.input(
        type="number"
        v-model="editions"
        placeholder="Collectible editions"
        min=0
        :max="MAX_EDITIONS"
      )

    .flex.flex-col.gap-2
      .flex.items-center.gap-2
        label.label.shrink-0 Royalty 👑 ({{ Math.round((royalty / 255) * 100) }}%)
        .h-px.w-full.bg-base-100
        span.shrink-0.cursor-help.leading-none.text-base-200.hover_text-base-400(
          v-tippy="'Royalty accrued from secondary sales.'"
        ) ❓

      .input.flex.items-center.gap-1
        span.shrink-0.leading-none 0%
        input.input.h-6.w-full(
          type="range"
          placeholder="Collectible royalty"
          min=0
          max=128
          v-model="royalty"
        )
        span.shrink-0.leading-none 50%

  .flex.w-full.items-center.gap-2
    label.label.shrink-0 Content 📁
    .h-px.w-full.bg-base-100
    span.shrink-0.leading-none.text-base-300
      | {{ content.length }} / {{ MAX_CONTENT_FILES }}, {{ prettyBytes(totalContentFileSize, { binary: true }) }} / {{ prettyBytes(MAX_TOTAL_CONTENT_FILE_SIZE, { binary: true }) }}
      span.cursor-help(
        v-tippy="'Do not include the preview image into content.'"
      ) ❓

  Sortable.grid.w-full.grid-cols-2.gap-3.sm_grid-cols-5(
    :key="content.length"
    v-if="content.length > 0"
    :list="content"
    :item-key="(file) => file.id"
    :options="{ animation: 200, easing: 'cubic-bezier(1, 0, 0, 1)' }"
    @start="onContentSortStart"
    @end="onContentSortEnd"
  )
    template(#item="{ element: content, index, key }")
      .relative
        .pressable.absolute.-right-2.-top-2.z-10.flex.aspect-square.h-7.w-7.cursor-pointer.items-center.justify-center.rounded-full.bg-white.shadow(
          @click.stop="toggleGated(content)"
          v-tippy="'Toggle privacy'"
        )
          .select-none.text-sm.leading-none {{ content.gated ? "🔒" : "🔓" }}
        img.aspect-square.h-full.w-full.cursor-move.select-none.rounded-lg.object-cover.shadow-lg.transition-transform.active_scale-95(
          :src="content.url"
          :class="{ blur: content.gated }"
        )

  .input.pressable.flex.h-24.w-full.cursor-pointer.items-center.justify-center.border-dashed.transition-transform(
    ref="contentDropZone"
    :class="{ 'bg-base-100': isOverContentDropZone }"
    @click="() => contentFileDialog.open()"
  )
    span.select-none.text-base-400(v-if="!draggedContent") Drop files here
    span.select-none.text-base-400(v-else) 🗑 Drop here to remove

  button.btn.btn-primary.btn-lg(@click="create") Create collectible 🪄✨

  p.text-center.text-sm.leading-tight.text-base-500
    | You will NOT be charged any fees for the gasless transaction signature.
    | Visit our
    |
    RouterLink.link(to="/help#create") help
    |
    | page for more information.

  Dialog.relative.z-40(:open="createDialog")
    .fixed.inset-0(class="bg-black/30" aria-hidden="true")
    .fixed.inset-0.overflow-y-auto
      .flex.min-h-full.items-center.justify-center
        DialogPanel.flex.w-full.max-w-sm.flex-col.gap-4.rounded-xl.bg-white.p-6.shadow-lg
          ol.flex.flex-col.gap-4
            li.flex.flex-col.gap-2
              .flex.items-center.justify-between.gap-2
                span.shrink-0.font-semibold.leading-none 1. Sign with your crypto wallet 💳
                .h-px.w-full.bg-base-100
                Spinner.h-4.shrink-0.animate-spin.text-primary-500(
                  v-if="createStage === CreateStage.WaitingForSignature"
                )
                span.shrink-0(v-else) ✅
              p.rounded-lg.border.bg-base-50.py-2.px-3.text-sm.leading-tight
                | You will NOT be charged network fee for the signature.
            li.flex.flex-col.gap-2(
              :class="{ 'opacity-30 blur-sm': createStage < CreateStage.Uploading }"
            )
              .flex.items-center.justify-between.gap-2
                span.shrink-0.font-semibold.leading-none 2. Upload content 📤
                .h-px.w-full.bg-base-100
                .flex.shrink-0.gap-2(
                  v-if="createStage === CreateStage.Uploading"
                )
                  span.text-sm.text-base-500 {{ (uploadProgress * 100).toFixed(1) }}% ({{ uploadRate ? prettyBytes(uploadRate, { binary: true }) + "/s" : "..." }})
                  Spinner.h-4.animate-spin.text-base-600
                span.shrink-0(v-else-if="createStage > CreateStage.Uploading") ✅
              p.rounded-lg.border.bg-base-50.py-2.px-3.text-sm.leading-tight
                | Uploading may take some time.

            li.flex.flex-col.gap-2(
              :class="{ 'opacity-30 blur-sm': createStage < CreateStage.Done }"
            )
              RouterLink.btn.btn-success.btn-lg.w-full(
                :disabled="createStage < CreateStage.Done"
                :to="{ name: 'Me' }"
              ) Go to profile 🏡
              button.btn.w-full(
                @click="reload"
                :disabled="createStage < CreateStage.Done"
              ) Create another one ✨
</template>

<style lang="scss" scoped>
.label {
  @apply w-max font-semibold leading-none;
}

.input {
  @apply w-full rounded-lg border py-2 px-3 placeholder-base-400;
  @apply invalid_border-error-500 invalid_bg-error-100;
}

.sortable-ghost {
  @apply opacity-30;
}
</style>
