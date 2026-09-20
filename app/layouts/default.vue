<template>
  <div class="app-container">
    <header class="app-header">
      <NuxtLink to="/" class="logo-link">
        <img
          src="/images/logo.svg?v=3"
          alt="TruthSeek Network Logo"
          class="logo-img"
          width="31"
          height="38"
        />
        <h1>TruthSeek Network</h1>
      </NuxtLink>
      <nav class="main-nav">
        <div class="desktop-nav-items">
          <template v-if="user && userProfile">
            <NuxtLink to="/" class="nav-link">Início</NuxtLink>
            <span class="nav-separator">|</span>
            <NuxtLink to="/categories" class="nav-link">Categorias</NuxtLink>
            <span class="nav-separator">|</span>
            <NuxtLink to="/user/profile" class="nav-link user-profile-link">
              <img
                :src="userProfile.avatar_path ? `${avatarBucketPath}/${userProfile.avatar_path}` : defaultUserAvatar"
                alt="Avatar"
                class="nav-user-avatar"
                @error="onNavAvatarError"
              />
              <span>{{ userProfile.username }}</span>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/" class="nav-link">Início</NuxtLink>
            <span class="nav-separator">|</span>
            <NuxtLink to="/categories" class="nav-link">Categorias</NuxtLink>
            <span class="nav-auth-group">
              <NuxtLink to="/user/signup" class="nav-cta-primary">Criar meu perfil</NuxtLink>
              <NuxtLink to="/user/login" class="nav-cta-secondary">Entrar</NuxtLink>
            </span>
          </template>
        </div>
        <NotificationBell v-if="user && userProfile" class="nav-notification-bell" />
        <div v-if="user && userProfile" class="desktop-nav-items desktop-user-items">
          <span class="nav-separator">|</span>
          <a href="#" @click.prevent="handleLogout" class="nav-link">Sair</a>
        </div>
        <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Abrir menu" :aria-expanded="isMobileMenuOpen">
          <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>
      </nav>
    </header>

    <div class="mobile-nav-overlay" :class="{ 'open': isMobileMenuOpen }" @click="closeMobileMenu">
      <nav class="mobile-nav-content" :class="{ 'open': isMobileMenuOpen }">
        <template v-if="user && userProfile">
          <NuxtLink to="/user/profile" class="user-nav-link-mobile" @click="closeMobileMenu">
            <img :src="userProfile.avatar_path ? `${avatarBucketPath}/${userProfile.avatar_path}` : defaultUserAvatar" alt="Avatar" class="nav-user-avatar-mobile" @error="onNavAvatarError" />
            <span>Meu Perfil</span>
          </NuxtLink>
          <NuxtLink to="/" class="mobile-nav-item" @click="closeMobileMenu">
            <Icon name="lucide:home" :size="18" class="mobile-nav-icon" aria-hidden="true" />
            <span>Início</span>
          </NuxtLink>
          <NuxtLink to="/categories" class="mobile-nav-item" @click="closeMobileMenu">
            <Icon name="lucide:layout-grid" :size="18" class="mobile-nav-icon" aria-hidden="true" />
            <span>Categorias</span>
          </NuxtLink>
          <div class="mobile-nav-divider" aria-hidden="true" />
          <GroupShortcutsNav variant="mobile" @navigate="closeMobileMenu" />
          <div class="mobile-nav-divider" aria-hidden="true" />
          <a href="#" class="mobile-nav-item" @click.prevent="handleLogoutMobile">
            <Icon name="lucide:log-out" :size="18" class="mobile-nav-icon" aria-hidden="true" />
            <span>Sair</span>
          </a>
        </template>
        <template v-else>
          <NuxtLink to="/" class="mobile-nav-item" @click="closeMobileMenu">
            <Icon name="lucide:home" :size="18" class="mobile-nav-icon" aria-hidden="true" />
            <span>Início</span>
          </NuxtLink>
          <NuxtLink to="/categories" class="mobile-nav-item" @click="closeMobileMenu">
            <Icon name="lucide:layout-grid" :size="18" class="mobile-nav-icon" aria-hidden="true" />
            <span>Categorias</span>
          </NuxtLink>
          <div class="mobile-nav-auth">
            <NuxtLink
              to="/user/signup"
              class="mobile-cta-primary"
              @click="closeMobileMenu"
            >
              Criar meu perfil
            </NuxtLink>
            <NuxtLink
              to="/user/login"
              class="mobile-cta-secondary"
              @click="closeMobileMenu"
            >
              Entrar
            </NuxtLink>
          </div>
        </template>
      </nav>
    </div>

    <main class="main-content" :class="{'no-scroll': isMobileMenuOpen}">
      <slot />
    </main>
    <footer class="app-footer">
      <p>
        © {{ new Date().getFullYear() }} TruthSeek Network. Todos os direitos reservados.
        <br />
        <NuxtLink to="/how-it-works" class="footer-link">Como Funciona</NuxtLink> |
        <NuxtLink to="/faq" class="footer-link">FAQ</NuxtLink> |
        <NuxtLink to="/terms-of-service" class="footer-link">Termos de Serviço</NuxtLink> |
        <NuxtLink to="/privacy-policy" class="footer-link">Privacidade</NuxtLink>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

const user = useSupabaseUser();
const authUserId = useAuthUserId();
const supabase = useSupabaseClient();
const userProfile = useProfile();
const router = useRouter();
const toast = useToast();
const { refreshBlockedIds, blockedIds } = useBlock();

const isMobileMenuOpen = ref(false);
const defaultUserAvatar = '/images/default-avatar.png';
const avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

async function fetchAndSetUserProfile(userId: string) {
  if (
    userProfile.value
    && userProfile.value.id === userId
    && userProfile.value.profile_visibility != null
  ) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_path, country_code, gender, birth_date, created_at, default_moderated_posts, profile_visibility, email_notify_like, email_notify_comment, email_notify_reply, email_notify_endorse')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      userProfile.value = data;
    } else {
      userProfile.value = null;
      console.warn(`Perfil não encontrado para o usuário ${userId}`);
    }
  } catch (e: any) {
    console.error('Erro ao buscar perfil do usuário para o estado:', e);
    userProfile.value = null;
  }
}

function toggleMobileMenu() { isMobileMenuOpen.value = !isMobileMenuOpen.value; }
function closeMobileMenu() { isMobileMenuOpen.value = false; }

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) { toast.error(error.message || 'Falha ao sair.'); }
  else { toast.success('Você saiu com sucesso!'); router.push('/'); }
}

async function handleLogoutMobile() {
  await handleLogout();
  closeMobileMenu();
}

function onNavAvatarError(event: Event) {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement.src !== defaultUserAvatar) { imgElement.src = defaultUserAvatar; }
}

watch(authUserId, (userId) => {
  if (userId) {
    fetchAndSetUserProfile(userId);
    void refreshBlockedIds();
    void useGroupShortcuts().ensureLoaded();
  } else {
    userProfile.value = null;
    blockedIds.value = [];
    useGroupShortcuts().clear();
  }
}, { immediate: true });
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 100%;
  overflow-x: clip;
}

.app-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 1.5rem;
  background-color: var(--header-bg); color: var(--header-text);
  position: sticky; top: 0; z-index: 1010;
  left: 0;
  right: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid color-mix(in srgb, var(--header-text) 15%, transparent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.logo-link { display: flex; align-items: center; text-decoration: none; color: inherit; gap: 0.5rem; min-width: 0; }
.logo-img { height: 38px; width: auto; display: block; flex-shrink: 0; }
.logo-link h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--header-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-link, .main-nav .desktop-nav-items a:not(.nav-cta-primary):not(.nav-cta-secondary) {
  color: var(--header-text);
  text-decoration: none;
  padding: 0.4em 0.6em;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.nav-link:hover, .main-nav .desktop-nav-items a:not(.nav-cta-primary):not(.nav-cta-secondary):hover {
  color: var(--primary-color-light);
}

.main-nav { display: flex; align-items: center; }
.desktop-nav-items {
  display: none;
  align-items: center;
  gap: 0.25rem;
}
.nav-separator {
  color: color-mix(in srgb, var(--header-text) 50%, transparent);
  margin: 0 0.5rem;
  font-weight: 300;
}

.nav-auth-group {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.nav-cta-primary,
.nav-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45em 1.1em;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  text-decoration: none;
  box-sizing: border-box;
  border-radius: 999px;
  transition: color 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s ease;
}

/* Higher specificity than `.main-nav .desktop-nav-items a` (white header text + radius 4px). */
.main-nav .desktop-nav-items a.nav-cta-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45em 1.15em;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.25;
  background-color: #fff;
  color: var(--primary-color);
  border: 1px solid #fff;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.main-nav .desktop-nav-items a.nav-cta-primary:hover,
.main-nav .desktop-nav-items a.nav-cta-primary:focus {
  color: var(--primary-color);
  background-color: #fff;
  border-color: #fff;
  border-radius: 999px;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.06),
    0 12px 28px rgba(0, 113, 128, 0.18);
}

.main-nav .desktop-nav-items a.nav-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45em 1.15em;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.25;
  background-color: transparent;
  color: var(--header-text);
  border: 1px solid color-mix(in srgb, var(--header-text) 70%, transparent);
  border-radius: 999px;
}

.main-nav .desktop-nav-items a.nav-cta-secondary:hover,
.main-nav .desktop-nav-items a.nav-cta-secondary:focus {
  color: var(--primary-color-light);
  background-color: transparent;
  border-color: var(--primary-color-light);
  border-radius: 999px;
}

.mobile-nav-auth {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.5rem;
}

.mobile-nav-content .mobile-cta-primary,
.mobile-nav-content .mobile-cta-secondary {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.8rem 1.15rem;
  border-bottom: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  box-sizing: border-box;
  text-decoration: none;
}

.mobile-nav-content a.mobile-cta-primary {
  color: var(--primary-color) !important;
  background-color: #fff;
  border: 1px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: color 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s ease;
}

.mobile-nav-content a.mobile-cta-primary:hover {
  color: var(--primary-color) !important;
  background-color: #fff;
  border-color: #fff;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.06),
    0 12px 28px rgba(0, 113, 128, 0.18);
}

.mobile-nav-content a.mobile-cta-secondary {
  color: var(--header-text) !important;
  background-color: transparent;
  border: 1px solid color-mix(in srgb, var(--header-text) 65%, transparent);
  transition: color 0.2s, border-color 0.2s;
}

.mobile-nav-content a.mobile-cta-secondary:hover {
  color: var(--primary-color-light) !important;
  background-color: transparent;
  border-color: var(--primary-color-light);
}
.user-profile-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.nav-user-avatar {
  width: 28px; height: 28px;
  border-radius: 50%; object-fit: cover;
  border: 1px solid var(--primary-color-light);
}

.mobile-menu-toggle {
  display: block; background: none; border: none;
  color: var(--header-text); cursor: pointer; padding: 0.5rem;
  z-index: 1020; margin-left: 0.5rem;
}

.nav-notification-bell {
  display: inline-flex;
  align-items: center;
  margin: 0 0.15rem 0 0.35rem;
}

.mobile-nav-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  opacity: 0; visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  z-index: 998;
}
.mobile-nav-overlay.open { opacity: 1; visibility: visible; }

.mobile-nav-content {
  display: flex; flex-direction: column;
  position: fixed; top: 0; right: -300px;
  width: 280px; height: 100vh;
  background-color: var(--header-bg); color: var(--header-text);
  padding: calc(50px + 1rem) 1.5rem 1.5rem 1.5rem; /* altura_header_aprox + padding */
  box-shadow: -3px 0 10px rgba(0,0,0,0.2);
  transition: right 0.3s ease-in-out;
  z-index: 999; overflow-y: auto;
}
.mobile-nav-content.open { right: 0; }

.mobile-nav-content a, .mobile-nav-content button {
  color: var(--header-text); text-decoration: none;
  padding: 0.9rem 0; display: block;
  border-bottom: 1px solid color-mix(in srgb, var(--header-text) 15%, transparent);
  font-size: 1.05rem; font-weight: 500;
  background: none; border-left: none; border-right: none; border-top: none;
  width: 100%; text-align: left; cursor: pointer;
}
.mobile-nav-content .mobile-nav-item {
  display: flex !important;
  align-items: center;
  gap: 0.7rem;
}
.mobile-nav-icon {
  flex-shrink: 0;
  opacity: 0.92;
}
.mobile-nav-content .mobile-nav-item:last-child {
  border-bottom: none;
}
.mobile-nav-content .mobile-nav-item:has(+ .mobile-nav-divider),
.mobile-nav-content .user-nav-link-mobile:has(+ .mobile-nav-divider) {
  border-bottom: none;
}
.mobile-nav-content a:hover, .mobile-nav-content button:hover { color: var(--primary-color-light); }
.mobile-nav-divider {
  height: 0;
  margin: 0.55rem 0;
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--header-text) 28%, transparent);
}
.mobile-nav-content :deep(.group-shortcuts-nav) {
  margin: 0;
  padding: 0;
}
.mobile-nav-content :deep(.group-shortcuts-nav a) {
  border-bottom: 1px solid color-mix(in srgb, var(--header-text) 10%, transparent);
  padding: 0.55rem 0;
  font-size: 0.95rem;
}
.mobile-nav-content :deep(.group-shortcuts-nav .shortcuts-section) {
  border-bottom: none;
}
.mobile-nav-content :deep(.group-shortcuts-nav .shortcuts-section + .shortcuts-section) {
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px solid color-mix(in srgb, var(--header-text) 18%, transparent);
}
.mobile-nav-content :deep(.group-shortcuts-nav .shortcuts-list li:last-child a) {
  border-bottom: none;
}
.user-nav-link-mobile {
  display: flex !important; align-items: center; gap: 0.75rem;
  padding: 0.9rem 0 !important;
}
.nav-user-avatar-mobile { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }

.desktop-user-items {
  display: none;
}

@media (min-width: 768px) {
  .desktop-nav-items { display: flex; }
  .desktop-user-items { display: flex; align-items: center; gap: 0.25rem; }
  .mobile-menu-toggle { display: none; }
  .mobile-nav-overlay { display: none; }
  .mobile-nav-content { display: none; }
}

.main-content {
  flex-grow: 1;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
}
.main-content.no-scroll {
  overflow: hidden;
}
.app-footer {
  background-color: var(--footer-bg);
  color: var(--footer-text);
  text-align: center;
  padding: 1.5rem 1rem;
  font-size: 0.9rem;
}
.footer-link {
  color: var(--primary-color-light);
  text-decoration: none;
  margin: 0 0.5rem;
  transition: color 0.15s ease, opacity 0.15s ease;
}
.footer-link:hover {
  color: #fff;
  opacity: 0.95;
}
</style>
