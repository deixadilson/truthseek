<template>
  <div class="register-page container">
    <div class="register-card">
      <h2>Criar sua Conta</h2>
      <p>Junte-se à rede TruthSeek e participe dos debates.</p>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">Nome de Usuário:</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
            maxlength="50"
            placeholder="Escolha um nome de usuário único"
          />
        </div>

        <div class="form-group">
          <label for="email">Email:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            maxlength="256"
            placeholder="seu.email@exemplo.com"
          />
        </div>

        <!-- Campo País -->
        <div class="form-group">
          <label for="country">País:</label>
          <select id="country" v-model="country" required>
            <option disabled value="">Selecione seu país</option>
            <!-- Lista de países - Placeholder -->
            <option value="br">Brasil</option>
            <option value="pt">Portugal</option>
            <option value="us">Estados Unidos</option>
            <!-- Idealmente, popular isso dinamicamente ou com uma lista completa -->
          </select>
        </div>

        <div class="form-group">
          <label for="gender">Sexo:</label>
          <select id="gender" v-model="gender" required>
            <option disabled value="">Selecione</option>
            <option value="m">Masculino</option>
            <option value="f">Feminino</option>
            <!-- Poderíamos adicionar "Prefiro não informar" ou "Outro" -->
          </select>
        </div>

        <div class="form-group">
          <label for="birthDate">Data de Nascimento:</label>
          <input type="date" id="birthDate" v-model="birthDate" required />
        </div>

        <div class="form-group">
          <label for="password">Senha:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            minlength="8"
            placeholder="Mínimo 8 caracteres"
          />
          <!-- Adicionar requisitos de senha (maiúscula, número, etc.) depois -->
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Senha:</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Digite a senha novamente"
          />
        </div>

        <div class="form-group terms">
          <input type="checkbox" id="terms" v-model="acceptedTerms" required>
          <label for="terms">
            Li e concordo com os <NuxtLink to="/terms-of-service" target="_blank">Termos de Serviço</NuxtLink>.
          </label>
        </div>

        <button type="submit" class="button-primary register-button" :disabled="isLoading">
          {{ isLoading ? 'Cadastrando...' : 'Cadastrar' }}
        </button>
      </form>

      <div class="login-link">
        Já tem uma conta? <NuxtLink to="/user/login">Faça login</NuxtLink>.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification';

const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

// --- State
const username = ref('');
const email = ref('');
const country = ref('');
const gender = ref('');
const birthDate = ref('');
const password = ref('');
const confirmPassword = ref('');
const acceptedTerms = ref(false);
const isLoading = ref(false);

// --- Methods ---
async function handleRegister(): Promise<void> {
  isLoading.value = true;

  // --- Validações Básicas ---
  if (password.value !== confirmPassword.value) {
    toast.error('As senhas não coincidem.');
    isLoading.value = false;
    return;
  }
  if (password.value.length < 8) {
    toast.error('A senha deve ter no mínimo 8 caracteres.');
    isLoading.value = false;
    return;
  }
  if (!acceptedTerms.value) {
    toast.error('Você deve aceitar os Termos de Serviço para continuar.');
    isLoading.value = false;
    return;
  }

  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          username: username.value,
          country_code: country.value,
          gender: gender.value,
          birth_date: birthDate.value,
        }
      }
    });

    if (signUpError) {
      console.error('Erro no SignUp:', signUpError);
      toast.error(signUpError.message || 'Ocorreu um erro durante o cadastro.');
      isLoading.value = false;
      return;
    }

    if (signUpData.user || (signUpData.session === null && !signUpError)) {
      toast.success('Cadastro realizado! Por favor, verifique seu email para confirmar sua conta.');
      router.push('/user/login');
    } else {
      toast.warning('Ocorreu uma situação inesperada com o cadastro. Verifique seu email ou tente fazer login.');
    }
  } catch (e: any) {
    console.error('Erro inesperado no handleRegister:', e);
    toast.error(e.message || 'Ocorreu um erro inesperado.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.register-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 550px;
  width: 100%;
}

.register-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.register-card p {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
}

.register-form .form-group {
  margin-bottom: 1.2rem;
}

/* Estilos para label e input podem ser herdados ou definidos como no login */
.register-form label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.register-form input[type="text"],
.register-form input[type="email"],
.register-form input[type="password"],
.register-form input[type="date"],
.register-form select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
  line-height: 1.5;
}

.register-form input:focus,
.register-form select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

/* Estilo específico para o select não parecer desabilitado */
.register-form select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23333333' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3E%3C/svg%3E"); /* Ícone de seta customizado */
  background-repeat: no-repeat;
  background-position: right 0.7em top 50%;
  background-size: 0.9em auto;
  padding-right: 2.5em;
}
.register-form select:required:invalid { /* Estilo para quando for obrigatório e vazio */
  color: #6c757d;
}
.register-form option[value=""][disabled] {
  display: none; /* Esconde a opção placeholder */
}
.register-form option {
  color: #000; /* Cor normal das opções */
}

/* Estilos para termos de serviço */
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
 .form-group.terms label a {
  text-decoration: underline;
 }

.register-button {
  width: 100%;
  padding: 0.9rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.login-link {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>
