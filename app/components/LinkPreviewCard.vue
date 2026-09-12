<template>
  <div class="link-preview-card" :class="{ removable }">
    <a
      :href="preview.url"
      class="link-preview-link"
      target="_blank"
      rel="noopener noreferrer"
      :title="preview.title || preview.url"
    >
      <div v-if="preview.image" class="link-preview-image">
        <img :src="preview.image" :alt="preview.title || 'Prévia do link'" loading="lazy" />
      </div>
      <div class="link-preview-body">
        <span class="link-preview-domain">{{ domain }}</span>
        <span v-if="preview.title" class="link-preview-title">{{ preview.title }}</span>
        <span v-if="preview.description" class="link-preview-description">{{ preview.description }}</span>
      </div>
    </a>
    <button
      v-if="removable"
      type="button"
      class="remove-media-btn"
      title="Remover prévia"
      @click.stop="$emit('remove')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import type { LinkPreview } from '~/types/linkPreview'

const props = withDefaults(
  defineProps<{
    preview: LinkPreview
    removable?: boolean
  }>(),
  { removable: false }
)

defineEmits<{ (e: 'remove'): void }>()

const domain = computed(() => {
  if (props.preview.site_name) return props.preview.site_name
  try {
    return new URL(props.preview.url).hostname.replace(/^www\./, '')
  } catch {
    return props.preview.url
  }
})
</script>

<style scoped>
.link-preview-card {
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: color-mix(in srgb, var(--card-bg) 92%, var(--border-color));
}

.link-preview-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.link-preview-link:hover .link-preview-title {
  color: var(--primary-color);
}

.link-preview-image {
  width: 100%;
  max-height: 220px;
  background: #e8eaed;
  overflow: hidden;
}

.link-preview-image img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
}

.link-preview-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0.85rem;
  min-width: 0;
}

.link-preview-domain {
  font-size: 0.75rem;
  color: #777;
  text-transform: lowercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-preview-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-preview-description {
  font-size: 0.82rem;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.remove-media-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  padding: 0;
  z-index: 1;
}
.remove-media-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
