<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="container hero-content-wrapper">
        <div class="hero-text">
          <h2>Bem-vindo à TruthSeek Network</h2>
          <p>Uma rede social para a busca da verdade através do debate estruturado e da troca de ideias.</p>
          <NuxtLink to="/user/register" class="button-primary hero-cta">
            Junte-se a Nós
          </NuxtLink>
        </div>
        <div class="hero-image-container">
          <img src="/images/hero.jpg" alt="Filósofos debatendo" class="hero-image" />
        </div>
      </div>
    </section>

    <div class="container page-content-wrapper">
      <aside class="login-section-top">
        <h3>Já é membro? Faça seu login</h3>
        <LoginForm />
        <div class="user-actions">
          <NuxtLink to="/user/register">Criar conta</NuxtLink> |
          <NuxtLink to="/user/password-recovery">Esqueceu a senha?</NuxtLink>
        </div>
      </aside>

      <section class="features-section">
        <h3>O que você pode fazer aqui?</h3>
        <ul>
          <li>Engajar em debates profundos sobre diversos temas.</li>
          <li>Aprender a identificar falácias e construir argumentos sólidos.</li>
          <li>Defender seus vieses e desafiar outros.</li>
          <li>Participar de uma comunidade focada na evolução de ideias.</li>
        </ul>
        <div class="site-links">
          <NuxtLink to="/como-funciona">Como Funciona</NuxtLink> |
          <NuxtLink to="/faq">FAQ</NuxtLink> |
          <NuxtLink to="/termos-de-servico">Termos de Serviço</NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  background-color: var(--card-bg);
  padding: 3rem 0;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.hero-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.hero-text {
  flex-basis: 55%;
}

.hero-text h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}
.hero-text p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  line-height: 1.7;
}
.hero-cta {
  font-size: 1.1rem;
  padding: 0.8em 1.5em;
}

.hero-image-container {
  flex-basis: 40%;
  text-align: center;
}

.hero-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.page-content-wrapper {
  padding-top: 2rem;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.login-section-top {
  background-color: var(--card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
}

.login-section-top h3 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: var(--text-color);
}

.user-actions {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}
.user-actions a {
  margin: 0 0.3rem;
}


.features-section {
  background-color: var(--card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
}
.features-section h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.features-section ul {
  list-style: none;
  padding-left: 0;
}

.features-section li {
  margin-bottom: 0.7rem;
  padding-left: 1.5rem;
  position: relative;
}
.features-section li::before {
  content: '✔';
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: bold;
}

.site-links {
  margin-top: 2rem;
  font-size: 0.9rem;
  text-align: center;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}
.site-links a {
  margin: 0 0.5rem;
}

@media (min-width: 992px) {
  .page-content-wrapper {
    flex-direction: row;
    align-items: flex-start;
  }
  .login-section-top {
    flex-basis: 35%;
    max-width: 400px;
    position: sticky;
    top: calc(60px + 1.5rem);
  }
  .features-section {
    flex-basis: 65%;
  }
}
@media (max-width: 767px) {
  .hero-content-wrapper {
    flex-direction: column-reverse;
    text-align: center;
  }
  .hero-text h2 {
    font-size: 2rem;
  }
  .hero-text p {
    font-size: 1rem;
  }
}
</style>