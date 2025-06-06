<template>
  <div class="app-container">
    <header class="app-header">
      <NuxtLink to="/" class="logo-link">
        <img src="/images/logo.svg" alt="TruthSeek Network Logo" class="logo-img" />
        <h1>TruthSeek Network</h1>
      </NuxtLink>
      <nav class="main-nav">
        <div class="desktop-nav-items">
          <template v-if="user && userProfile">
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
            <span class="nav-separator">|</span>
            <a href="#" @click.prevent="handleLogout" class="nav-link">Sair</a>
          </template>
          <template v-else>
            <NuxtLink to="/" class="nav-link">Início</NuxtLink>
            <span class="nav-separator">|</span>
            <NuxtLink to="/user/login" class="nav-link">Entrar</NuxtLink>
            <span class="nav-separator">|</span>
            <NuxtLink to="/user/register" class="nav-link">Cadastrar</NuxtLink>
          </template>
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
          <NuxtLink to="/user/profile" class="user-nav-link-mobile">
            <img :src="userProfile.avatar_path ? `${avatarBucketPath}/${userProfile.avatar_path}` : defaultUserAvatar" alt="Avatar" class="nav-user-avatar-mobile" @error="onNavAvatarError" />
            <span>Meu Perfil</span>
          </NuxtLink>
          <NuxtLink to="/categories">Categorias</NuxtLink>
          <a href="#" @click.prevent="handleLogoutMobile">Sair</a>
        </template>
        <template v-else>
          <NuxtLink to="/">Início</NuxtLink>
          <NuxtLink to="/user/login">Entrar</NuxtLink>
          <NuxtLink to="/user/register">Cadastrar</NuxtLink>
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
        <NuxtLink to="/como-funciona" class="footer-link">Como Funciona</NuxtLink> |
        <NuxtLink to="/faq" class="footer-link">FAQ</NuxtLink> |
        <NuxtLink to="/terms-of-service" class="footer-link">Termos de Serviço</NuxtLink>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const userProfile = useProfile();
const router = useRouter();
const toast = useToast();

const isMobileMenuOpen = ref(false);
const defaultUserAvatar = '/images/default-avatar.png';
const avatarBucketPath = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';

async function fetchAndSetUserProfile(userId: string) {
  if (userProfile.value && userProfile.value.id === userId) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_path, country_code, gender, birth_date, created_at')
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

watch(user, (currentUser) => {
  if (currentUser) {
    fetchAndSetUserProfile(currentUser.id);
  } else {
    userProfile.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 1.5rem;
  background-color: var(--header-bg); color: var(--header-text);
  position: sticky; top: 0; z-index: 1010;
  border-bottom: 1px solid color-mix(in srgb, var(--header-text) 15%, transparent);
}
.logo-link { display: flex; align-items: center; text-decoration: none; color: inherit; gap: 0.5rem; }
.logo-img { height: 38px; }
.logo-link h1 { margin: 0; font-size: 1.4rem; font-weight: 600; color: var(--header-text); }

.nav-link, .main-nav .desktop-nav-items a {
  color: var(--header-text);
  text-decoration: none;
  padding: 0.4em 0.6em;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}
.nav-link:hover, .main-nav .desktop-nav-items a:hover {
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
.mobile-nav-content a:last-of-type, .mobile-nav-content button:last-of-type { border-bottom: none; }
.mobile-nav-content a:hover, .mobile-nav-content button:hover { color: var(--primary-color-light); }
.mobile-nav-content hr {
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--header-text) 30%, transparent);
  margin: 0.75rem 0;
}
.user-nav-link-mobile {
  display: flex !important; align-items: center; gap: 0.75rem;
  padding: 0.9rem 0 !important;
}
.nav-user-avatar-mobile { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }

@media (min-width: 768px) {
  .desktop-nav-items { display: flex; }
  .mobile-menu-toggle { display: none; }
  .mobile-nav-overlay { display: none; }
  .mobile-nav-content { display: none; }
}

.main-content {
  flex-grow: 1;
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
  text-decoration: underline;
  margin: 0 0.5rem;
}
.footer-link:hover {
  color: #fff;
}
</style>
