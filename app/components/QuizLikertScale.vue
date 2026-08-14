<template>
  <div class="quiz-likert" role="listbox" :aria-label="ariaLabel">
    <button
      v-for="opt in LIKERT_OPTIONS"
      :key="opt.value"
      type="button"
      class="quiz-likert-option"
      :class="{ selected: modelValue === opt.value, neutral: opt.value === 0 }"
      :style="{ '--opt-bg': opt.colorVar, '--opt-bg-strong': strongerColor(opt.value) }"
      role="option"
      :aria-selected="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      <span class="quiz-likert-swatch" aria-hidden="true" />
      <span class="quiz-likert-label">{{ opt.label }}</span>
      <Icon
        v-if="modelValue === opt.value"
        name="lucide:check"
        :size="18"
        class="quiz-likert-check"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { LIKERT_OPTIONS, type LikertStance } from '~/utils/quizScoring';

defineProps<{
  modelValue: LikertStance | null;
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: LikertStance): void;
}>();

function strongerColor(value: LikertStance): string {
  switch (value) {
    case 2:
      return '#81c784';
    case 1:
      return '#a5d6a7';
    case 0:
      return '#ffffff';
    case -1:
      return '#ef9a9a';
    case -2:
      return '#e57373';
  }
}
</script>

<style scoped>
.quiz-likert {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-likert-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fff;
  color: var(--text-color);
  font: inherit;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.quiz-likert-option:hover {
  border-color: var(--primary-color);
}

.quiz-likert-option.selected {
  border-color: var(--primary-color);
  background: var(--opt-bg);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 25%, transparent);
  font-weight: 600;
}

.quiz-likert-swatch {
  flex: 0 0 1.1rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text-color) 20%, transparent);
  background: var(--opt-bg);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.quiz-likert-option.selected:not(.neutral) .quiz-likert-swatch {
  background: var(--opt-bg-strong);
  border-color: color-mix(in srgb, var(--opt-bg-strong) 70%, #333);
}

.quiz-likert-option.selected.neutral .quiz-likert-swatch {
  background: #fff;
  border-color: #bbb;
}

.quiz-likert-label {
  flex: 1;
  line-height: 1.3;
}

.quiz-likert-check {
  flex: 0 0 auto;
  color: #2e7d32;
}
</style>
