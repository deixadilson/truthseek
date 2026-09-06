<template>
  <span
    class="user-avatar"
    :class="[frameClass, sizeClass]"
    :title="frameTitle"
  >
    <img
      :src="src"
      :alt="alt"
      class="user-avatar-img"
      @error="onError"
    />
  </span>
</template>

<script setup lang="ts">
import { getInfluenceTierMeta } from '~/utils/influenceTiers';

const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  level?: number | null;
  title?: string | null;
}>(), {
  alt: 'Avatar',
  size: 'md',
  level: null,
  title: null,
});

const defaultAvatar = '/images/default-avatar.png';

const meta = computed(() => getInfluenceTierMeta(props.level, props.title));
const frameClass = computed(() => meta.value?.frameClass || '');
const sizeClass = computed(() => `user-avatar--${props.size}`);
const frameTitle = computed(() => {
  if (!meta.value) return undefined;
  return `${meta.value.title} (NV ${meta.value.level})`;
});

function onError(event: Event) {
  const img = event.target as HTMLImageElement | null;
  if (img && img.src !== defaultAvatar) img.src = defaultAvatar;
}
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  box-sizing: border-box;
  padding: 2px;
  background: transparent;
}

.user-avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
}

.user-avatar--sm {
  width: 1.75rem;
  height: 1.75rem;
}
.user-avatar--md {
  width: 2.75rem;
  height: 2.75rem;
}
.user-avatar--lg {
  width: 3.5rem;
  height: 3.5rem;
}
.user-avatar--xl {
  width: 5.5rem;
  height: 5.5rem;
}

/* Teal — NV 1–3: claro → médio → degradê */
.inf-frame--teal-1 {
  padding: 1px;
  background: #b8e4ea;
}
.inf-frame--teal-2 {
  padding: 2px;
  background: #6dbfc9;
}
.inf-frame--teal-3 {
  padding: 3px;
  background: linear-gradient(
    145deg,
    #d4f2f6,
    #8fd4dc,
    var(--primary-color),
    #5aa8b3
  );
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #fff 35%, transparent);
}

/* Bronze — NV 4–6: cobre/marrom claro (distinto do ouro) */
.inf-frame--bronze-1 {
  padding: 2px;
  background: #e2c4a8;
}
.inf-frame--bronze-2 {
  padding: 2px;
  background: #c9a07a;
}
.inf-frame--bronze-3 {
  padding: 3px;
  background: linear-gradient(145deg, #f3e0cc, #e2c4a8, #c9a07a, #a67c52);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #fff 30%, transparent);
}

/* Silver — NV 7–9: cinza claro → médio → degradê */
.inf-frame--silver-1 {
  padding: 2px;
  background: #e4e7eb;
}
.inf-frame--silver-2 {
  padding: 2px;
  background: #c5cbd3;
}
.inf-frame--silver-3 {
  padding: 3px;
  background: linear-gradient(145deg, #ffffff, #e8eaed, #c5cbd3, #9aa3ab);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #fff 45%, transparent);
}

/* Gold — NV 10–12: amarelo ouro (não cobre) */
.inf-frame--gold-1 {
  padding: 2px;
  background: #f3e4a0;
}
.inf-frame--gold-2 {
  padding: 3px;
  background: #e8cc4a;
}
.inf-frame--gold-3 {
  padding: 3px;
  background: linear-gradient(145deg, #fff8d6, #f5e6a0, #e8cc4a, #d4b020);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #fff 40%, transparent);
}

/* Diamond iridescent (NV 13) */
.inf-frame--diamond {
  padding: 3px;
  background: linear-gradient(
    125deg,
    #6ee3ff,
    #d4b8ff,
    #ffffff,
    #7ef0d8,
    #a8c4ff,
    #6ee3ff
  );
  background-size: 220% 220%;
  animation: inf-diamond-shift 6s ease infinite;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, #fff 55%, transparent),
    0 0 0 1px color-mix(in srgb, #5ec8e8 40%, transparent);
}

@keyframes inf-diamond-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .inf-frame--diamond {
    animation: none;
    background-position: 40% 50%;
  }
}
</style>
