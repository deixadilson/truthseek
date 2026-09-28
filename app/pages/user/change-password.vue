<template>
  <div class="change-password-page container">
    <div class="change-password-card">
      <NuxtLink to="/user/settings" class="back-link">
        <Icon name="lucide:arrow-left" :size="16" />
        Voltar às configurações
      </NuxtLink>
      <h2>{{ hasPassword ? 'Alterar senha' : 'Criar senha' }}</h2>
      <p v-if="hasPassword">Informe a senha atual e escolha uma nova senha para a sua conta.</p>
      <p v-else>
        Você entrou com o Google. Defina uma senha para também poder entrar com email e senha.
        O login com o Google continuará funcionando.
      </p>

      <div v-if="isLoadingIdentity" class="loading-spinner">
        <LoadingMessage message="Carregando..." />
      </div>
      <form v-else class="password-form" @submit.prevent="handleChangePassword">
        <div v-if="hasPassword" class="form-group">
          <label for="current-password">Senha atual:</label>
          <input
            id="current-password"
            v-model="currentPassword"
            type="password"
            required
            autocomplete="current-password"
            :disabled="isChangingPassword"
            placeholder="Sua senha atual"
          />
        </div>
        <div class="form-group">
          <label for="new-password">Nova senha:</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            :disabled="isChangingPassword"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div class="form-group">
          <label for="confirm-password">Confirmar nova senha:</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            :disabled="isChangingPassword"
            placeholder="Repita a nova senha"
          />
        </div>
        <button
          type="submit"
          class="button-primary password-submit"
          :disabled="isChangingPassword"
        >
          <LoadingMessage
            v-if="isChangingPassword"
            message="Alterando..."
            :icon-size="16"
          />
          <template v-else>{{ hasPassword ? 'Alterar senha' : 'Criar senha' }}</template>
        </button>
      </form>

      <div v-if="hasPassword && !isLoadingIdentity" class="user-actions">
        <NuxtLink to="/user/password-recovery">Esqueceu a senha atual?</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

definePageMeta({
  middleware: 'auth',
});

useHead({ title: 'Alterar senha - TruthSeek Network' });

const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isChangingPassword = ref(false);
const isLoadingIdentity = ref(true);
const hasPassword = ref(true);

function userHasEmailIdentity(user: { identities?: { provider: string }[] | null; app_metadata?: { providers?: string[] } } | null): boolean {
  if (!user) return true;
  if (user.identities?.length) {
    return user.identities.some((identity) => identity.provider === 'email');
  }
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.length) {
    return providers.includes('email');
  }
  return true;
}

onMounted(async () => {
  try {
    const { data } = await supabase.auth.getUser();
    hasPassword.value = userHasEmailIdentity(data.user);
  } finally {
    isLoadingIdentity.value = false;
  }
});

async function handleChangePassword() {
  if (newPassword.value !== confirmPassword.value) {
    toast.error('As senhas novas não coincidem.');
    return;
  }
  if (newPassword.value.length < 8) {
    toast.error('A nova senha deve ter no mínimo 8 caracteres.');
    return;
  }
  if (hasPassword.value && newPassword.value === currentPassword.value) {
    toast.error('A nova senha deve ser diferente da senha atual.');
    return;
  }

  isChangingPassword.value = true;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const email = userData.user?.email;
    if (!email) {
      toast.error('Não foi possível identificar o email da conta.');
      return;
    }

    const accountHasPassword = userHasEmailIdentity(userData.user);
    if (accountHasPassword) {
      if (!hasPassword.value) {
        hasPassword.value = true;
        toast.info('Esta conta já tem senha. Informe a senha atual.');
        return;
      }
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword.value,
      });
      if (verifyError) {
        toast.error('Senha atual incorreta.');
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value,
    });
    if (updateError) throw updateError;

    toast.success(
      accountHasPassword
        ? 'Senha alterada com sucesso.'
        : 'Senha criada. Agora você também pode entrar com email e senha.',
    );
    await router.push('/user/settings');
  } catch (e: any) {
    toast.error(e.message || 'Não foi possível alterar a senha.');
  } finally {
    isChangingPassword.value = false;
  }
}
</script>

<style scoped>
.change-password-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.change-password-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.change-password-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.change-password-card > p {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.password-form .form-group {
  margin-bottom: 1.2rem;
}

.password-form label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.password-form input[type="password"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
  box-sizing: border-box;
}

.password-form input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.password-submit {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.user-actions {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>
