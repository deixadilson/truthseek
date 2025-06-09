<template>
  <Popover class="author-popover-container" v-slot="{ open, close: headlessClose }">
    <PopoverButton
      ref="popoverButtonRef"
      as="div"
      class="author-popover-trigger"
      @mouseenter="handleTriggerHover(true)"
      @mouseleave="handleTriggerHover(false)"
      @focus="handleTriggerFocus"
      @blur="handleTriggerBlur"
      role="button" tabindex="0"
      @keydown.enter.prevent="simulateClickAndFetch(open)"
      @keydown.space.prevent="simulateClickAndFetch(open)"
    >
      <slot></slot>
    </PopoverButton>

    <transition
      enter-active-class="popover-transition-enter-active"
      enter-from-class="popover-transition-enter-from"
      enter-to-class="popover-transition-enter-to"
      leave-active-class="popover-transition-leave-active"
      leave-from-class="popover-transition-leave-from"
      leave-to-class="popover-transition-leave-to"
    >
      <PopoverPanel
        static
        v-show="isOpenForUI"
        class="author-popover-panel"
        @mouseenter="handlePanelHover(true)"
        @mouseleave="handlePanelHover(false)"
        ref="popoverPanelRef"
      >
        <div class="popover-content-wrapper">
          <div v-if="isLoading" class="popover-message">Carregando vieses...</div>
          <div v-else-if="error" class="popover-message error">{{ error }}</div>
          <div v-else-if="authorBiases.length === 0" class="popover-message">
            Nenhum viés relevante do autor nesta categoria.
          </div>
          <template v-else>
            <h3 class="popover-section-title">VIESES DO AUTOR NESTA CATEGORIA:</h3>
            <ul class="biases-list">
              <li v-for="bias in authorBiases" :key="`${bias.bias_id}`" class="bias-item">
                <div class="bias-info-container">
                  <NuxtLink :to="`/${bias.country_code}/${bias.group_slug}`" class="bias-flag-link">
                    <img
                      v-if="bias.flag_path"
                      :src="`https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/flags/${bias.flag_path}`"
                      :alt="`Bandeira ${bias.group_name}`"
                      class="bias-flag"
                    />
                    <div v-else class="bias-flag-placeholder">
                      <span>{{ bias.group_name ? bias.group_name.substring(0, 1).toUpperCase() : '?' }}</span>
                    </div>
                  </NuxtLink>
                  <div class="bias-text-details">
                    <NuxtLink
                      :to="`/${bias.country_code}/${bias.group_slug}`"
                      class="bias-name"
                    >
                      {{ bias.group_name }}
                    </NuxtLink>
                    <span class="influence">{{ bias.influence_points }} Aspirante</span>
                  </div>
                </div>
                <div v-if="user && user.id !== authorId" class="endorse-actions">
                  <button
                    @click="toggleEndorsement(bias, 1)"
                    class="endorse-btn up"
                    :class="{ 'active': bias.current_user_endorsement === 1 }"
                    :disabled="isHandlingEndorsement === bias.bias_id"
                    title="Endossar"
                    type="button"
                  >
                    <svg class="endorse-svg" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                  </button>
                  <button
                    @click="toggleEndorsement(bias, -1)"
                    class="endorse-btn down"
                    :class="{ 'active': bias.current_user_endorsement === -1 }"
                    :disabled="isHandlingEndorsement === bias.bias_id"
                    title="Desendossar"
                    type="button"
                  >
                    <svg class="endorse-svg" viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                  </button>
                </div>
              </li>
            </ul>
          </template>
          <hr class="popover-divider" />
          <div class="popover-user-actions">
            <button @click="placeholderAction('Ver Perfil')" class="action-link" type="button">Ver Perfil</button>
            <button @click="placeholderAction('Seguir')" class="action-link" type="button">Seguir</button>
            <button @click="placeholderAction('Bloquear')" class="action-link" type="button">Bloquear</button>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import type { Database } from '~/types/supabase';
import type { UserBiasForPopover } from '~/types/app'
import { useToast } from 'vue-toastification';

const props = defineProps<{
  authorId: string;
  contextGroupId: string;
  hideTriggerArrow?: boolean;
}>();

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const toast = useToast();

const authorBiases = ref<UserBiasForPopover[]>([]);
const isLoading = ref(false);
const isHandlingEndorsement = ref<string | null>(null);
const error = ref<string | null>(null);

const popoverButtonRef = ref<{ $el: HTMLElement } | null>(null);
const popoverPanelRef = ref<{ $el: HTMLElement } | null>(null);
const isHoveringTrigger = ref(false);
const isHoveringPanel = ref(false);
const isOpenForUI = ref(false);
let openDelayTimeoutId: NodeJS.Timeout | null = null;
let closeDelayTimeoutId: NodeJS.Timeout | null = null;

async function fetchAuthorBiases() {
  if (!props.authorId || !props.contextGroupId || !user.value) return;
  isLoading.value = true;
  error.value = null;
  try {
    const { data, error: rpcError } = await supabase.rpc('get_user_biases_for_category', {
      p_author_id: props.authorId,
      p_context_group_id: props.contextGroupId,
      p_current_user_id: user.value.id,
    });

    if (rpcError) throw rpcError;
    authorBiases.value = data || [];
  } catch (e: any) {
    console.error("Erro ao buscar vieses do autor:", e);
    error.value = e.message || "Falha ao carregar vieses.";
  } finally {
    isLoading.value = false;
  }
}

function openPopoverAndFetchData() {
  if (!isOpenForUI.value) { // Só busca se não estiver explicitamente aberto pelo nosso estado
    fetchAuthorBiases();
  }
  isOpenForUI.value = true;
}

function attemptClosePopover() {
  // Fecha apenas se o mouse não estiver sobre o trigger ou o painel
  if (!isHoveringTrigger.value && !isHoveringPanel.value) {
    isOpenForUI.value = false;
  }
}

function handleTriggerHover(hovering: boolean) {
  isHoveringTrigger.value = hovering;
  if (hovering) {
    if (closeDelayTimeoutId) clearTimeout(closeDelayTimeoutId);
    if (openDelayTimeoutId) clearTimeout(openDelayTimeoutId); // Evitar múltiplos timeouts
    openDelayTimeoutId = setTimeout(() => {
      if (isHoveringTrigger.value) { // Re-checar se ainda está hover
        openPopoverAndFetchData();
      }
    }, 150);
  } else {
    if (openDelayTimeoutId) clearTimeout(openDelayTimeoutId);
    if (closeDelayTimeoutId) clearTimeout(closeDelayTimeoutId);
    closeDelayTimeoutId = setTimeout(() => {
      attemptClosePopover();
    }, 250);
  }
}

function handlePanelHover(hovering: boolean) {
  isHoveringPanel.value = hovering;
  if (hovering) {
    if (closeDelayTimeoutId) clearTimeout(closeDelayTimeoutId);
  } else {
    if (closeDelayTimeoutId) clearTimeout(closeDelayTimeoutId);
    closeDelayTimeoutId = setTimeout(() => {
      attemptClosePopover();
    }, 250);
  }
}

function handleTriggerFocus() {
  if (closeDelayTimeoutId) clearTimeout(closeDelayTimeoutId);
  if (openDelayTimeoutId) clearTimeout(openDelayTimeoutId);
  openPopoverAndFetchData(); // Abrir e buscar no foco
}

function handleTriggerBlur() {
  // Atrasa o fechamento para permitir cliques dentro do painel se ele estiver aberto
  // e para permitir que o hover no painel seja detectado
  if (closeDelayTimeoutId) clearTimeout(closeDelayTimeoutId);
  closeDelayTimeoutId = setTimeout(() => {
    if (!popoverPanelRef.value?.$el.contains(document.activeElement)) { // Se o foco não foi para dentro do painel
        attemptClosePopover();
    }
  }, 100); // Pequeno delay
}


function simulateClickAndFetch(isCurrentlyOpen: boolean) {
  // O 'open' vindo do v-slot do Popover reflete o estado do Headless UI.
  // Nós usamos nosso próprio isOpenForUI para a lógica de hover/fetch.
  if (isOpenForUI.value) { // Se nosso estado diz que está aberto (ou deveria estar)
    isOpenForUI.value = false; // Fecha pelo nosso controle
  } else {
    openPopoverAndFetchData(); // Abre pelo nosso controle (e busca dados)
  }
}

async function toggleEndorsement(bias: UserBiasForPopover, endorsementType: 1 | -1) {
  if (!user.value  || !bias.bias_id) return;
  if (user.value.id === props.authorId) return;

  isHandlingEndorsement.value = bias.bias_id;
  try {
    const { data, error: rpcError } = await supabase.rpc('handle_endorsement', {
      p_bias_id: bias.bias_id,
      p_endorsing_user_id: user.value.id,
      p_endorsement_type: endorsementType,
      p_points_to_award: 1,
    });

    if (rpcError) throw rpcError;

    if (data && data[0] && data[0].success) {
      toast.success(data[0].message);
      // Atualizar a UI localmente
      const updatedBiasIndex = authorBiases.value.findIndex(b => b.bias_id === bias.bias_id);
      if (updatedBiasIndex !== -1) {
        // Se o endosso foi removido (clicou no mesmo tipo)
        if(data[0].message.includes('removido')) {
          authorBiases.value[updatedBiasIndex].current_user_endorsement = null;
        } else {
          authorBiases.value[updatedBiasIndex].current_user_endorsement = endorsementType;
        }
        authorBiases.value[updatedBiasIndex].influence_points = data[0].new_influence_points;
      }
    } else if (data && data[0] && !data[0].success) {
      toast.error(data[0].message);
    } else {
      throw new Error("Resposta inesperada da função de endosso.");
    }

  } catch (e: any) {
    console.error("Erro ao processar endosso:", e);
    toast.error(e.message || "Falha ao processar endosso.");
  } finally {
    isHandlingEndorsement.value = null;
  }
}

function placeholderAction(action: string) {
  toast.info(`Funcionalidade "${action}" em desenvolvimento.`);
}
</script>

<style scoped>
.author-popover-container {
  position: relative;
  display: inline-block;
}

.author-popover-trigger {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  user-select: none;
}
.trigger-arrow {
  margin-left: 4px;
  font-size: 0.6em;
  color: #777;
  transition: transform 0.15s ease-out;
  line-height: 1;
}
.trigger-arrow.open {
  transform: rotate(180deg);
}
.author-popover-trigger[data-headlessui-state~="open"] .trigger-arrow {
  transform: rotate(180deg);
}

.author-popover-panel {
  position: absolute;
  z-index: 20;
  margin-top: 6px;
  width: 260px;
  background-color: var(--card-bg);
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.author-popover-panel[data-popper-placement^="top"] { margin-bottom: 6px; margin-top: 0; }
.author-popover-panel[data-popper-placement^="right"] { margin-left: 6px; }
.author-popover-panel[data-popper-placement^="left"] { margin-right: 6px; }

.popover-content-wrapper {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.popover-message {
  padding: 0.5rem 0;
  text-align: center;
  font-size: 0.8rem;
  color: #6b7280;
}
.popover-message.error {
  color: #dc2626;
}

.popover-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.biases-list { padding: 0; margin: 0; }
.bias-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  /* border-bottom: 1px solid var(--primary-color-light); // Opcional, se quiser divisores mais fortes */
}
.bias-info-container {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-grow: 1;
  min-width: 0;
}
.bias-flag-link {
  flex-shrink: 0;
}

.bias-flag, .bias-flag-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  background-color: var(--primary-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: var(--primary-color);
}

.bias-text-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bias-name {
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.bias-name:hover {
  text-decoration: underline;
}

.influence {
  font-size: 0.75rem;
  color: #555;
}

.endorse-actions { display: flex; gap: 0.4rem; }
.endorse-btn {
  background: none; border: 1px solid #ccc;
  border-radius: 50%; padding: 0.25rem;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #666;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}
.endorse-btn:hover { background-color: #f0f0f0; color: #333; }
.endorse-btn.active {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
}
.endorse-btn.down.active {
  border-color: #db3575;
  background-color: #db3575;
}
.endorse-btn .endorse-svg {
  width: 12px; height: 12px;
  stroke: currentColor;
  fill: none;
}
.endorse-btn.active .endorse-svg {
  stroke: white;
  fill: white;
}
.endorse-btn:disabled { opacity: 0.5; cursor: not-allowed; }


.popover-divider {
  margin: 0.6rem 0;
  border: none; border-top: 1px solid var(--border-color);
}

.popover-user-actions { display: flex; flex-direction: column; gap: 0.3rem; }
.action-link {
  font-size: 0.85rem; color: #444;
  padding: 0.5rem 0.25rem;
  border-radius: 3px; text-align: left;
  background: none; border: none; cursor: pointer; width: 100%;
  text-decoration: none;
}
.action-link:hover { background-color: #f3f4f6; color: var(--primary-color); }

.popover-transition-enter-active,
.popover-transition-leave-active {
  transition: opacity 0.1s ease-out, transform 0.1s ease-out;
}
.popover-transition-enter-from,
.popover-transition-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
.popover-transition-enter-to,
.popover-transition-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
