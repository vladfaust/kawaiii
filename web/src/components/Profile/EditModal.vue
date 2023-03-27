<script setup lang="ts">
import User from "@/model/User";
import { trpc } from "@/services/api";
import { useFileDialog, computedAsync, refDebounced } from "@vueuse/core";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { uploadFile } from "@/modules/axios";
import Spinner from "../util/Spinner.vue";
import { onBeforeRouteLeave } from "vue-router";
import { useNProgress } from "@vueuse/integrations/useNProgress";

const HANDLE_MIN = 8;
const HANDLE_MAX = 32;
const HANDLE_REGEX = /^[a-z_][a-z0-9_]{7,31}$/;
const NAME_MAX = 32;
const BIO_MAX = 1024;
const BGP_MAX_SIZE = 1024 * 1024 * 2; // 2 MiB
const PFP_MAX_SIZE = 1024 * 1024 * 1; // 1 MiB

const nProgress = useNProgress();

const props = defineProps<{
  user: User;
  open: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "update"): void;
}>();

const justEdited = ref(false);

const name = ref<string>(props.user.name);
const nameValid = computed(() => name.value.length <= NAME_MAX);

const handle = ref<string>(props.user.handle);
const handleDebounced = refDebounced(handle, 500);
const handleValid = computed(
  () =>
    !handle.value || (handle.value.match(HANDLE_REGEX) && handleAvailable.value)
);
const handleChanged = computed(() => handle.value !== props.user.handle);
const handleAvailableCheckInProgress = ref(false);
const handleAvailable = computedAsync(
  async () => {
    if (!handleDebounced.value) return true;
    if (handleDebounced.value.length < HANDLE_MIN) return false;
    if (handleDebounced.value.length > HANDLE_MAX) return false;

    const result = await trpc.commands.users.lookup.query({
      handle: handleDebounced.value!,
    });

    if (result === null) return true;
    if (result.id === props.user.id) return true;

    return false;
  },
  true,
  {
    lazy: true,
    evaluating: handleAvailableCheckInProgress,
  }
);

const bio = ref<string>(props.user.bio);
const bioValid = computed(() => bio.value.length <= BIO_MAX);

const bgpError = ref(false);
const bgpFileDialog = useFileDialog({
  accept: "image/*",
  multiple: false,
});
const bgpFile = computed(() => bgpFileDialog.files.value?.[0]);
const bgpFileUrl = computed(() =>
  bgpFile.value ? URL.createObjectURL(bgpFile.value) : undefined
);
const bgpValid = computed(() => bgpFile.value?.size ?? 0 <= BGP_MAX_SIZE);

const pfpError = ref(false);
const pfpFileDialog = useFileDialog({
  accept: "image/*",
  multiple: false,
});
const pfpFile = computed(() => pfpFileDialog.files.value?.[0]);
const pfpFileUrl = computed(() =>
  pfpFile.value ? URL.createObjectURL(pfpFile.value) : undefined
);
const pfpValid = computed(() => pfpFile.value?.size ?? 0 <= PFP_MAX_SIZE);

const valid = computed(
  () =>
    nameValid.value &&
    handleValid.value &&
    bioValid.value &&
    bgpValid.value &&
    pfpValid.value
);

const anyChanges = computed(
  () =>
    name.value !== props.user.name ||
    handle.value !== props.user.handle ||
    bio.value !== props.user.bio ||
    bgpFile.value ||
    pfpFile.value
);

const inProgress = ref(false);
watch(
  () => inProgress.value,
  (value) => {
    if (value) nProgress.start();
    else nProgress.done();
  }
);
const totalFileSize = computed(() => {
  let size = 0;
  if (bgpFile.value) size += bgpFile.value.size;
  if (pfpFile.value) size += pfpFile.value.size;
  return size;
});
const uploadedTotal = ref(0);
const progress = computed(() => {
  if (!inProgress.value) return 0;
  if (totalFileSize.value === 0) return 0;
  return uploadedTotal.value / totalFileSize.value;
});
watch(progress, (value) => {
  nProgress.progress.value = value;
});

async function save() {
  if (inProgress.value) return;
  if (!valid.value) return;
  if (!anyChanges.value) return;

  const promises = [];

  if (
    name.value !== props.user.name ||
    handle.value !== props.user.handle ||
    bio.value !== props.user.bio
  ) {
    promises.push(
      trpc.commands.users.update.mutate({
        handle:
          handle.value !== props.user.handle ? handle.value || null : undefined,
        name: name.value !== props.user.name ? name.value || null : undefined,
        bio: bio.value !== props.user.bio ? bio.value || null : undefined,
      })
    );
  }

  if (bgpFile.value) {
    promises.push(
      trpc.commands.users.getBgpUploadUrl.query().then((bgpUploadUrl) => {
        return uploadFile(bgpUploadUrl, bgpFile.value!, (e) => {
          uploadedTotal.value += e.bytes;
        });
      })
    );
  }

  if (pfpFile.value) {
    promises.push(
      trpc.commands.users.getPfpUploadUrl.query().then((pfpUploadUrl) => {
        return uploadFile(pfpUploadUrl, pfpFile.value!, (e) => {
          uploadedTotal.value += e.bytes;
        });
      })
    );
  }

  try {
    inProgress.value = true;
    await Promise.all(promises);
    justEdited.value = true;
    emit("update");
  } catch (e) {
    alert("Failed to save changes. Please try again later.");
    console.error(e);
  } finally {
    inProgress.value = false;
    uploadedTotal.value = 0;
  }
}

function mayLeave(): boolean {
  let answer = true;

  if (props.open && anyChanges.value && !justEdited.value) {
    answer = window.confirm(
      "Do you really want to close? All uncomitted data will be lost."
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

function onClose(event: boolean) {
  if (mayLeave()) {
    // TODO: Reset changes, if any.
    emit("close");
  }
}
</script>

<template lang="pug">
Dialog.relative.z-40(:open="open" @close="onClose")
  .fixed.inset-0(class="bg-black/30" aria-hidden="true")
  .fixed.inset-0.overflow-y-auto.p-4
    .flex.min-h-full.items-center.justify-center
      DialogPanel.flex.w-full.max-w-lg.flex-col.gap-4.rounded-xl.bg-white.p-4.shadow-lg
        DialogTitle.flex.items-center.justify-between.gap-3
          span.shrink-0.text-lg.font-bold Edit profile
          .h-px.w-full.bg-base-100
          button.pressable.shrink-0.text-base-300.transition-transform(
            @click="onClose"
          )
            | ❌
        .flex.flex-col.gap-2
          .flex.items-center.justify-between.gap-2
            label.label.shrink-0.leading-none Background picture
            .h-px.w-full.bg-base-100
            span.shrink-0.leading-none.text-base-300(
              :class="{ 'text-error-500': !bgpValid }"
            ) 0 / 32

          .flex.aspect-video.w-full.cursor-pointer.items-center.justify-center.overflow-hidden.rounded-lg.border(
            @click="bgpFileDialog.open()"
            style="aspect-ratio: 16/4.5"
            :class="{ 'border border-error-500': !bgpValid }"
          )
            img.w-full.object-cover(v-if="bgpFileUrl" :src="bgpFileUrl")
            img.w-full.object-cover(
              v-else-if="!bgpError"
              :src="user.bgpUrl.toString()"
              @error="bgpError = true"
            )
            p.text-base-300(v-else) Select file

          .flex.items-center.justify-between.gap-2
            label.label.shrink-0.leading-none Profile picture
            .h-px.w-full.bg-base-100
            span.shrink-0.leading-none.text-base-300(
              :class="{ 'text-error-500': !pfpValid }"
            ) 0 / 32

          .flex.aspect-square.h-32.w-32.cursor-pointer.items-center.justify-center.overflow-hidden.rounded-full.border(
            @click="pfpFileDialog.open()"
            style="aspect-ratio: 16/4.5"
            :class="{ 'border border-error-500': !pfpValid }"
          )
            img.w-full.object-cover(v-if="pfpFileUrl" :src="pfpFileUrl")
            img.w-full.object-cover(
              v-else-if="!pfpError"
              :src="user.pfpUrl.toString()"
              @error="pfpError = true"
            )
            p.text-base-300(v-else) Select file

          .flex.items-center.justify-between.gap-2
            label.label.shrink-0.leading-none Name
            .h-px.w-full.bg-base-100
            span.shrink-0.leading-none.text-base-300(
              :class="{ 'text-error-500': !nameValid }"
            ) {{ name?.length || 0 }} / 32
          input.input.text-lg.font-bold.tracking-wide(
            type="text"
            placeholder="Your name"
            v-model="name"
            :max="NAME_MAX"
            :class="{ 'border-red-500': !nameValid }"
          )

          .flex.items-center.justify-between.gap-2
            label.label.shrink-0.leading-none Handle
            .h-px.w-full.bg-base-100
            span.shrink-0.leading-none.text-base-300(
              :class="{ 'text-error-500': !handleValid }"
            ) {{ handle?.length || 0 }} / {{ HANDLE_MAX }}
          input.input.text-sm(
            type="text"
            placeholder="Your handle"
            v-model="handle"
            :min="HANDLE_MIN"
            :max="HANDLE_MAX"
            :pattern="HANDLE_REGEX.source"
            :class="{ 'border-red-500': !handleValid }"
          )
          p.rounded-lg.rounded-tl-none.border.bg-base-50.px-3.py-2.leading-tight(
            v-if="handleChanged && user.verified"
          )
            | ⚠️ Changing the handle would remove verification.
          p.rounded-lg.rounded-tl-none.border.bg-base-50.px-3.py-2.leading-tight(
            v-if="!handle"
          )
            | 💁‍♂️ Without a handle, your profile won't be visible.
          p.rounded-lg.rounded-tl-none.border.bg-base-50.px-3.py-2.leading-tight(
            v-else-if="handle.length < HANDLE_MIN"
          )
            | 🚫 The handle must be at least {{ HANDLE_MIN }} characters.
          p.rounded-lg.rounded-tl-none.border.bg-base-50.px-3.py-2.leading-tight(
            v-else-if="handle.length > HANDLE_MAX"
          )
            | 🚫 The handle must be at most {{ HANDLE_MAX }} characters.
          p.rounded-lg.rounded-tl-none.border.bg-base-50.px-3.py-2.leading-tight(
            v-else-if="!handle.match(HANDLE_REGEX)"
          )
            | 🚫 The handle must contain lowercase letters, numbers, and underscores (_) only, and begin with a letter.
          p.rounded-lg.rounded-tl-none.border.bg-base-50.px-3.py-2.leading-tight(
            v-else-if="!handleAvailable"
          )
            | 🚫 This handle is not available.

          .flex.items-center.justify-between.gap-2
            label.label.shrink-0.leading-none Bio
            .h-px.w-full.bg-base-100
            span.shrink-0.leading-none.text-base-300(
              :class="{ 'text-error-500': !bioValid }"
            ) {{ bio.length || 0 }} / 1024
          textarea.input.leading-tight(
            type="text"
            placeholder="Your bio"
            v-model="bio"
            :max="BIO_MAX"
            rows="5"
            :class="{ 'border-red-500': !bioValid }"
          )

          button.btn.btn-primary.btn-lg(
            @click="save"
            :disabled="!valid || !anyChanges || inProgress"
          )
            span(v-if="!inProgress") Save
            .flex.items-center.gap-2(v-else)
              Spinner.h-5
              span Saving... ({{ (progress * 100).toFixed(1) }}%)
</template>

<style lang="scss" scoped>
.label {
  @apply w-max font-semibold leading-none;
}

.input {
  @apply w-full rounded-lg border py-2 px-3 placeholder-base-400;
  @apply invalid_border-error-500 invalid_bg-error-100;
}
</style>
