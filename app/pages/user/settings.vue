<template>
  <div class="settings-page container">
    <div class="settings-card">
      <header class="settings-header">
        <NuxtLink to="/user/profile" class="back-link">
          <Icon name="lucide:arrow-left" :size="16" />
          Voltar ao perfil
        </NuxtLink>
        <h1>Configurações</h1>
      </header>

      <section class="settings-section">
        <h2>Postagens</h2>
        <label class="setting-row">
          <input
            type="checkbox"
            :checked="defaultModeratedPosts"
            :disabled="isSaving"
            @change="toggleDefaultModerated(($event.target as HTMLInputElement).checked)"
          />
          <span>
            <strong>Enviar post moderado por padrão</strong>
            <small>Novas postagens são marcadas como conteúdo moderado por padrão. Você ainda pode desmarcar na hora de postar.</small>
          </span>
        </label>
      </section>

      <section class="settings-section">
        <h2>Seguidores</h2>
        <label class="setting-row">
          <input
            type="checkbox"
            :checked="autoAcceptFollowRequests"
            :disabled="isSaving"
            @change="toggleAutoAcceptFollow(($event.target as HTMLInputElement).checked)"
          />
          <span>
            <strong>Aceitar automaticamente solicitações de seguir</strong>
            <small>Se ligado, qualquer pessoa pode lhe seguir sem necessidade de aprovação.</small>
          </span>
        </label>
      </section>

      <section class="settings-section">
        <h2>Quem pode ver meu perfil</h2>
        <p class="section-hint">
          Controla quem pode acessar sua página pública. Seu nome e avatar continuam visíveis nas postagens.
        </p>
        <div class="radio-list">
          <label
            v-for="option in visibilityOptions"
            :key="option.value"
            class="setting-row radio"
          >
            <input
              type="radio"
              name="profile-visibility"
              :value="option.value"
              :checked="profileVisibility === option.value"
              :disabled="isSaving"
              @change="saveVisibility(option.value)"
            />
            <span>
              <strong>{{ option.label }}</strong>
              <small>{{ option.hint }}</small>
            </span>
          </label>
        </div>
      </section>

      <section class="settings-section">
        <h2>Notificações por email</h2>
        <p class="section-hint">Escolha quais eventos devem ser enviados para o seu email.</p>
        <label
          v-for="item in emailOptions"
          :key="item.key"
          class="setting-row"
        >
          <input
            type="checkbox"
            :checked="emailPrefs[item.key]"
            :disabled="isSaving"
            @change="toggleEmailPref(item.key, ($event.target as HTMLInputElement).checked)"
          />
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.hint }}</small>
          </span>
        </label>
      </section>

      <section class="settings-section">
        <h2>Usuários bloqueados</h2>
        <div v-if="isLoadingBlocked" class="loading-spinner">
          <LoadingMessage message="Carregando bloqueios..." />
        </div>
        <ul v-else-if="blockedUsers.length > 0" class="blocked-users-list">
          <li v-for="blocked in blockedUsers" :key="blocked.id" class="blocked-user-item">
            <NuxtLink :to="`/user/${blocked.username}`" class="blocked-user-link">
              <img
                :src="blocked.avatar_path ? `${avatarBucketPath}/${blocked.avatar_path}` : defaultAvatarUrl"
                :alt="blocked.username"
                class="blocked-avatar"
              />
              <span>{{ blocked.username }}</span>
            </NuxtLink>
            <button
              type="button"
              class="button-secondary unblock-btn"
              :disabled="unblockingId === blocked.id"
              @click="handleUnblock(blocked.id)"
            >
              <LoadingMessage v-if="unblockingId === blocked.id" message="..." :icon-size="14" />
              <template v-else>Desbloquear</template>
            </button>
          </li>
        </ul>
        <p v-else class="empty-message">Nenhum usuário bloqueado.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Profile, ProfileVisibility } from '~/types/app';
import type { BlockedUser } from '~/composables/useBlock';
import { PROFILE_VISIBILITY_OPTIONS, parseProfileVisibility } from '~/utils/profileVisibility';
import { useToast } from 'vue-toastification';

definePageMeta({
  middleware: 'auth',
});

useHead({ title: 'Configurações - TruthSeek Network' });

const supabase = useSupabaseClient();
const authUserId = useAuthUserId();
const userProfile = useProfile();
const toast = useToast();
const { listBlockedUsers, unblockUser } = useBlock();

const defaultAvatarUrl = '/images/default-avatar.png';
const avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

const visibilityOptions = PROFILE_VISIBILITY_OPTIONS;
const emailOptions = [
  { key: 'email_notify_like' as const, label: 'Curtidas', hint: 'Quando alguém curtir suas postagens ou comentários.' },
  { key: 'email_notify_comment' as const, label: 'Comentários', hint: 'Quando alguém comentar nas suas postagens.' },
  { key: 'email_notify_reply' as const, label: 'Respostas', hint: 'Quando alguém responder aos seus comentários.' },
  { key: 'email_notify_endorse' as const, label: 'Endossos', hint: 'Quando alguém endossar um viés seu.' },
];

const isSaving = ref(false);
const defaultModeratedPosts = ref(false);
const autoAcceptFollowRequests = ref(false);
const profileVisibility = ref<ProfileVisibility>('public');
const emailPrefs = reactive({
  email_notify_like: true,
  email_notify_comment: true,
  email_notify_reply: true,
  email_notify_endorse: true,
});

const blockedUsers = ref<BlockedUser[]>([]);
const isLoadingBlocked = ref(false);
const unblockingId = ref<string | null>(null);

function applyFromProfile(profile: Profile) {
  defaultModeratedPosts.value = !!profile.default_moderated_posts;
  autoAcceptFollowRequests.value = !!profile.auto_accept_follow_requests;
  profileVisibility.value = parseProfileVisibility(profile.profile_visibility);
  emailPrefs.email_notify_like = profile.email_notify_like !== false;
  emailPrefs.email_notify_comment = profile.email_notify_comment !== false;
  emailPrefs.email_notify_reply = profile.email_notify_reply !== false;
  emailPrefs.email_notify_endorse = profile.email_notify_endorse !== false;
}

async function persist(patch: Partial<Profile>) {
  if (!authUserId.value) return;
  isSaving.value = true;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', authUserId.value)
      .select()
      .single();
    if (error) throw error;
    if (data && userProfile.value) {
      userProfile.value = { ...userProfile.value, ...data };
    } else if (data) {
      userProfile.value = data;
    }
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível salvar a configuração.');
    if (userProfile.value) applyFromProfile(userProfile.value);
  } finally {
    isSaving.value = false;
  }
}

async function toggleDefaultModerated(value: boolean) {
  defaultModeratedPosts.value = value;
  await persist({ default_moderated_posts: value });
}

async function toggleAutoAcceptFollow(value: boolean) {
  autoAcceptFollowRequests.value = value;
  await persist({ auto_accept_follow_requests: value });
}

async function saveVisibility(value: ProfileVisibility) {
  profileVisibility.value = value;
  await persist({ profile_visibility: value });
}

async function toggleEmailPref(key: keyof typeof emailPrefs, value: boolean) {
  emailPrefs[key] = value;
  await persist({ [key]: value });
}

async function fetchBlockedUsers() {
  isLoadingBlocked.value = true;
  try {
    blockedUsers.value = await listBlockedUsers();
  } catch (e) {
    console.error('Erro ao listar bloqueios:', e);
    blockedUsers.value = [];
  } finally {
    isLoadingBlocked.value = false;
  }
}

async function handleUnblock(userId: string) {
  unblockingId.value = userId;
  try {
    await unblockUser(userId);
    blockedUsers.value = blockedUsers.value.filter((user) => user.id !== userId);
    toast.success('Usuário desbloqueado.');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível desbloquear.');
  } finally {
    unblockingId.value = null;
  }
}

onMounted(async () => {
  if (userProfile.value) applyFromProfile(userProfile.value);
  if (!authUserId.value) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUserId.value)
    .single();
  if (!error && data) {
    userProfile.value = data;
    applyFromProfile(data);
  }
  await fetchBlockedUsers();
});
</script>

<style scoped>
.settings-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.settings-card {
  background-color: var(--card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
  max-width: 700px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 1.75rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.settings-header h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.7rem;
}

.settings-section {
  margin-top: 1.75rem;
  padding-top: 1.4rem;
  border-top: 1px solid var(--border-color);
}

.settings-section h2 {
  margin: 0 0 0.65rem;
  font-size: 1.15rem;
  color: var(--primary-color);
}

.section-hint {
  margin: 0 0 0.85rem;
  color: #666;
  font-size: 0.9rem;
}

.setting-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.15rem;
  cursor: pointer;
}

.setting-row input {
  margin-top: 0.3rem;
  flex-shrink: 0;
  accent-color: var(--primary-color);
}

.setting-row span {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.setting-row strong {
  font-weight: 600;
  color: var(--text-color);
}

.setting-row small {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.35;
}

.radio-list {
  display: flex;
  flex-direction: column;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.empty-message {
  padding: 1.5rem;
  text-align: center;
  color: #777;
  font-style: italic;
  background-color: #f9f9f9;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
}

.blocked-users-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.blocked-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-bottom: 1px solid var(--border-color);
}

.blocked-users-list li:last-child {
  border-bottom: none;
}

.blocked-user-link {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
}

.blocked-user-link:hover {
  color: var(--primary-color);
}

.blocked-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  flex-shrink: 0;
}

.unblock-btn {
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}
</style>
