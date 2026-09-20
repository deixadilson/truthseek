<template>
  <div class="complete-page container">
    <div class="complete-card">
      <h2>Complete seu perfil</h2>
      <p>Falta pouco! Preencha os dados abaixo para começar a participar.</p>

      <form class="complete-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">Nome de Usuário:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            maxlength="50"
            placeholder="Escolha um nome de usuário único"
          />
        </div>

        <div class="form-group">
          <label for="country">País:</label>
          <select id="country" v-model="country" required>
            <option disabled value="">Selecione seu país</option>
            <option value="br">Brasil</option>
            <option value="pt">Portugal</option>
            <option value="us">Estados Unidos</option>
          </select>
        </div>

        <div class="form-group">
          <label for="gender">Sexo:</label>
          <select id="gender" v-model="gender" required>
            <option disabled value="">Selecione</option>
            <option value="m">Masculino</option>
            <option value="f">Feminino</option>
          </select>
        </div>

        <div class="form-group">
          <label for="birthDate">Data de Nascimento:</label>
          <input id="birthDate" v-model="birthDate" type="date" required />
        </div>

        <div class="form-group terms">
          <input id="terms" v-model="acceptedTerms" type="checkbox" required>
          <label for="terms">
            Li e concordo com os
            <NuxtLink to="/terms-of-service" target="_blank">Termos de Serviço</NuxtLink>
            e a
            <NuxtLink to="/privacy-policy" target="_blank">Política de Privacidade</NuxtLink>.
          </label>
        </div>

        <button type="submit" class="button-primary submit-button" :disabled="isLoading">
          <LoadingMessage v-if="isLoading" message="Salvando..." :icon-size="16" />
          <template v-else>Concluir cadastro</template>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

definePageMeta({
  middleware: ['auth'],
});

useHead({ title: 'Completar perfil - TruthSeek Network' });

const supabase = useSupabaseClient();
const authUserId = useAuthUserId();
const userProfile = useProfile();
const router = useRouter();
const toast = useToast();

const username = ref('');
const country = ref('');
const gender = ref('');
const birthDate = ref('');
const acceptedTerms = ref(false);
const isLoading = ref(false);

const profileSelect
  = 'id, username, avatar_path, country_code, gender, birth_date, created_at, default_moderated_posts, profile_visibility, email_notify_like, email_notify_comment, email_notify_reply, email_notify_endorse';

async function loadProfile() {
  const userId = authUserId.value;
  if (!userId) return;

  const { data, error } = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar perfil:', error);
    toast.error('Não foi possível carregar seu perfil.');
    return;
  }

  if (data && isProfileComplete(data)) {
    userProfile.value = data;
    await router.replace('/');
    return;
  }

  if (data) {
    username.value = data.username || '';
    country.value = data.country_code || '';
    gender.value = data.gender || '';
    birthDate.value = data.birth_date || '';
    userProfile.value = data;
  } else {
    const { data: authData } = await supabase.auth.getUser();
    const emailLocal = (authData.user?.email || '').split('@')[0] || '';
    username.value = emailLocal;
  }
}

async function handleSubmit() {
  if (!acceptedTerms.value) {
    toast.error('Você deve aceitar os Termos de Serviço para continuar.');
    return;
  }

  const userId = authUserId.value;
  if (!userId) {
    toast.error('Sessão inválida. Faça login novamente.');
    await router.push('/user/login');
    return;
  }

  const trimmedUsername = username.value.trim();
  if (!trimmedUsername) {
    toast.error('Escolha um nome de usuário.');
    return;
  }

  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: trimmedUsername,
        country_code: country.value,
        gender: gender.value,
        birth_date: birthDate.value,
      })
      .eq('id', userId)
      .select(profileSelect)
      .single();

    if (error) {
      console.error('Erro ao completar perfil:', error);
      if (error.code === '23505' || error.message?.toLowerCase().includes('unique')) {
        toast.error('Este nome de usuário já está em uso. Escolha outro.');
      } else {
        toast.error(error.message || 'Não foi possível salvar o perfil.');
      }
      return;
    }

    userProfile.value = data;
    toast.success('Perfil completo! Bem-vindo à TruthSeek.');

    let nextPath = '/';
    try {
      const stored = sessionStorage.getItem('ts_post_auth_redirect');
      if (stored && stored.startsWith('/')) {
        sessionStorage.removeItem('ts_post_auth_redirect');
        nextPath = stored;
      }
    } catch {
      // ignore
    }

    await router.push(nextPath);
  } catch (e: any) {
    console.error('Erro inesperado ao completar perfil:', e);
    toast.error(e?.message || 'Ocorreu um erro inesperado.');
  } finally {
    isLoading.value = false;
  }
}

watch(authUserId, (id) => {
  if (id) void loadProfile();
}, { immediate: true });
</script>

<style scoped>
.complete-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.complete-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 550px;
  width: 100%;
}

.complete-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.complete-card > p {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
}

.complete-form .form-group {
  margin-bottom: 1.2rem;
}

.complete-form label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.complete-form input[type="text"],
.complete-form input[type="date"],
.complete-form select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
  line-height: 1.5;
}

.complete-form input:focus,
.complete-form select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.complete-form select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23333333' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7em top 50%;
  background-size: 0.9em auto;
  padding-right: 2.5em;
}

.form-group.terms {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group.terms input[type="checkbox"] {
  width: auto;
  margin-top: -2px;
}

.form-group.terms label {
  margin-bottom: 0;
  font-size: 0.85rem;
  font-weight: normal;
}

.submit-button {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.1rem;
  font-weight: 500;
}
</style>
