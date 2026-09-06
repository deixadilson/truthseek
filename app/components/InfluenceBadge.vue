<template>
  <span
    v-if="meta"
    class="influence-badge"
    :class="[meta.badgeClass, sizeClass]"
    :title="tooltip"
  >
    <span class="influence-badge-shield" aria-hidden="true" />
    <span class="influence-badge-label">{{ meta.title }}</span>
  </span>
</template>

<script setup lang="ts">
import { getInfluenceTierMeta } from '~/utils/influenceTiers';

const props = withDefaults(defineProps<{
  level?: number | null;
  title?: string | null;
  influencePoints?: number | null;
  showPe?: boolean;
  size?: 'md' | 'lg';
}>(), {
  level: null,
  title: null,
  influencePoints: null,
  showPe: false,
  size: 'md',
});

const meta = computed(() => getInfluenceTierMeta(props.level, props.title));
const sizeClass = computed(() => (props.size === 'lg' ? 'influence-badge--lg' : ''));

const tooltip = computed(() => {
  if (!meta.value) return undefined;
  const parts = [
    meta.value.title,
    `NV ${meta.value.level}`,
  ];
  if (props.influencePoints != null) {
    parts.push(`${props.influencePoints} pts`);
  }
  if (props.showPe) {
    parts.push(`P.E. ${meta.value.endorsementPower}`);
  }
  return parts.join(' · ');
});
</script>

<style scoped>
.influence-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  vertical-align: middle;
  line-height: 1;
}

.influence-badge-shield {
  flex-shrink: 0;
  width: 0.95rem;
  height: 1.1rem;
  background: currentColor;
  opacity: 0.95;
  clip-path: polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%);
}

.influence-badge-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.influence-badge--lg {
  gap: 0.4rem;
}
.influence-badge--lg .influence-badge-shield {
  width: 1.1rem;
  height: 1.3rem;
}
.influence-badge--lg .influence-badge-label {
  font-size: 1rem;
}

/* Text darker for contrast; shield lighter (claro / médio / degradê) */
.inf-badge--teal-1 { color: #3d7a84; }
.inf-badge--teal-1 .influence-badge-shield {
  background: #b8e4ea;
  opacity: 1;
}
.inf-badge--teal-2 { color: var(--primary-color-dark); }
.inf-badge--teal-2 .influence-badge-shield {
  background: #6dbfc9;
  opacity: 1;
}
.inf-badge--teal-3 { color: var(--primary-color-dark); }
.inf-badge--teal-3 .influence-badge-shield {
  background: linear-gradient(160deg, #d4f2f6, #8fd4dc, var(--primary-color), #5aa8b3);
  opacity: 1;
}

.inf-badge--bronze-1 { color: #8a6340; }
.inf-badge--bronze-1 .influence-badge-shield {
  background: #e2c4a8;
  opacity: 1;
}
.inf-badge--bronze-2 { color: #6b4423; }
.inf-badge--bronze-2 .influence-badge-shield {
  background: #c9a07a;
  opacity: 1;
}
.inf-badge--bronze-3 { color: #5a3818; }
.inf-badge--bronze-3 .influence-badge-shield {
  background: linear-gradient(160deg, #f3e0cc, #e2c4a8, #c9a07a, #a67c52);
  opacity: 1;
}

.inf-badge--silver-1 { color: #5c6570; }
.inf-badge--silver-1 .influence-badge-shield {
  background: #e4e7eb;
  opacity: 1;
}
.inf-badge--silver-2 { color: #4b5563; }
.inf-badge--silver-2 .influence-badge-shield {
  background: #c5cbd3;
  opacity: 1;
}
.inf-badge--silver-3 { color: #374151; }
.inf-badge--silver-3 .influence-badge-shield {
  background: linear-gradient(160deg, #ffffff, #e8eaed, #c5cbd3, #9aa3ab);
  opacity: 1;
}

.inf-badge--gold-1 { color: #8a7010; }
.inf-badge--gold-1 .influence-badge-shield {
  background: #f3e4a0;
  opacity: 1;
}
.inf-badge--gold-2 { color: #7a6208; }
.inf-badge--gold-2 .influence-badge-shield {
  background: #e8cc4a;
  opacity: 1;
}
.inf-badge--gold-3 { color: #6b5505; }
.inf-badge--gold-3 .influence-badge-shield {
  background: linear-gradient(160deg, #fff8d6, #f5e6a0, #e8cc4a, #d4b020);
  opacity: 1;
}

.inf-badge--diamond { color: #3d6a8a; }
.inf-badge--diamond .influence-badge-shield {
  background: linear-gradient(145deg, #6ee3ff, #d4b8ff, #7ef0d8, #a8c4ff);
  opacity: 1;
}
</style>
