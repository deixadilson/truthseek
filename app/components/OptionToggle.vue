<template>
  <button
    type="button"
    class="option-toggle"
    :class="{ active: modelValue }"
    :aria-pressed="modelValue"
    :title="title || label"
    @click="emit('update:modelValue', !modelValue)"
  >
    <Icon :name="icon" :size="iconSize" class="option-toggle-icon" />
    <span class="option-toggle-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean;
  label: string;
  icon: string;
  title?: string;
  iconSize?: number | string;
}>(), {
  iconSize: 16,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<style scoped>
.option-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 2.25rem;
  padding: 0 0.75em;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg, #fff);
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
}

.option-toggle:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.option-toggle.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-on-primary);
  box-shadow: 0 2px 6px var(--button-shadow-color);
}

.option-toggle.active:hover {
  background-color: var(--primary-color-hover);
  border-color: var(--primary-color-hover);
  color: var(--text-on-primary);
}

.option-toggle-icon {
  flex-shrink: 0;
}

.option-toggle-label {
  line-height: 1;
}
</style>
