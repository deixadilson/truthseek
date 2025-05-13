<template>
  <div class="app-container">
    <header class="app-header">
      <NuxtLink to="/" class="logo-link">
        <img src="/images/logo.svg" alt="TruthSeek Network Logo" class="logo-img" />
        <h1>TruthSeek Network</h1>
      </NuxtLink>
      <nav class="main-nav">
        <NuxtLink to="/">Início</NuxtLink>
        <NuxtLink to="/user/login">Login</NuxtLink>
        <NuxtLink to="/user/register">Cadastro</NuxtLink>
      </nav>
    </header>
    <main class="main-content">
      <slot />
    </main>
    <footer class="app-footer">
      <p>© {{ new Date().getFullYear() }} TruthSeek Network. Todos os direitos reservados.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Lógica do layout, se necessário no futuro
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

.main-nav a {
  margin-left: 1.2rem;
  text-decoration: none;
  color: var(--header-text);
  font-weight: 500;
  transition: color 0.2s;
}

.main-nav a:hover,
.main-nav a.router-link-exact-active {
  color: var(--header-link-hover);
  text-decoration: none;
}

.main-content {
  flex-grow: 1;
  padding-top: 60px;
}

.app-footer {
  background-color: var(--footer-bg);
  color: var(--footer-text);
  text-align: center;
  padding: 1.5rem 1rem;
  font-size: 0.9rem;
}
</style>
