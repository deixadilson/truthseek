<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo-link">
        <img src="/images/logo.svg" alt="TruthSeek Network Logo" class="logo-img" />
        <h1>TruthSeek Network</h1>
      </div>
      <nav class="main-nav">
        <template v-if="user">
          <NuxtLink to="/categories">Categorias</NuxtLink>
          <NuxtLink to="/user/profile" class="user-greeting">
            Olá, {{ userProfile?.username || user.email }}
          </NuxtLink>
          <button @click="handleLogout" class="button-logout">Sair</button>
        </template>
        <template v-else>
          <NuxtLink to="/">Início</NuxtLink>
          <NuxtLink to="/user/login">Entrar</NuxtLink>
          <NuxtLink to="/user/register">Cadastrar</NuxtLink>
        </template>
      </nav>
    </header>
    <main class="main-content">
      <slot />
    </main>
    <footer class="app-footer">
      <p>
        © {{ new Date().getFullYear() }} TruthSeek Network. Todos os direitos reservados.
        <br />
        <NuxtLink to="/how-it-works" class="footer-link">Como Funciona</NuxtLink> |
        <NuxtLink to="/faq" class="footer-link">FAQ</NuxtLink> |
        <NuxtLink to="/terms-of-service" class="footer-link">Termos de Serviço</NuxtLink>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { useProfile } from '~/composables/useUserProfile';

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const userProfile = useProfile();
const router = useRouter();
const toast = useToast();

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
    } else { // Perfil não encontrado
      userProfile.value = null;
      console.warn(`Perfil não encontrado para o usuário ${userId}`);
    }
  } catch (e: any) {
    console.error('Erro ao buscar perfil do usuário para o estado:', e);
    userProfile.value = null;
  }
}

async function handleLogout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    toast.error(error.message || 'Falha ao sair.');
  } else {
    toast.success('Você saiu com sucesso!');
    router.push('/');
  }
}

watch(user, (currentUser) => {
  if (currentUser) {
    fetchAndSetUserProfile(currentUser.id);
  } else {
    userProfile.value = null; // Limpar perfil no logout
  }
}, { immediate: true }); // immediate: true para rodar na montagem e pegar o usuário inicial
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--header-bg);
  color: var(--header-text);
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  gap: 0.5rem;
}

.logo-img {
  height: 40px;
  /* Para SVGs brancos em fundos escuros, pode ser necessário ajustar no próprio SVG ou via CSS filter, mas geralmente funciona se o SVG for transparente ou tiver cor definida */
}

.logo-link h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--header-text);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.main-nav a, .main-nav .button-logout, .main-nav .user-greeting {
  text-decoration: none;
  color: var(--header-text);
  font-weight: 500;
  transition: color 0.2s;
  white-space: nowrap;
}

.main-nav a:hover,
.main-nav a.router-link-exact-active {
  color: var(--header-link-hover);
  text-decoration: none;
}

.user-greeting {
  font-size: 0.9em;
}

.button-logout {
  background-color: transparent;
  border: 1px solid var(--header-link-hover);
  padding: 0.4em 0.8em;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
}

.button-logout:hover {
  background-color: var(--header-link-hover);
  color: var(--primary-color);
}

.main-content {
  flex-grow: 1;
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
