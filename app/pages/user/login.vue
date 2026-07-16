<template>
  <div class="login-page container">
    <div class="login-card">
      <h2>Acesse sua Conta</h2>
      <p>Bem-vindo de volta à TruthSeek Network!</p>
      <LoginForm />
      <div class="user-actions-login">
        <NuxtLink to="/user/password-recovery">Esqueceu a senha?</NuxtLink>
        <p>
          Não tem uma conta?
          <NuxtLink to="/user/register">Cadastre-se aqui</NuxtLink>.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px - 3rem);
}

.login-card {
  background-color: var(--card-bg);
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.login-card h2 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.login-card p {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
}

.user-actions-login {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}
.user-actions-login p {
  margin-top: 1rem;
}
</style>
