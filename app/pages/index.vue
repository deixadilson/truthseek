<template>
  <TimelineFeed v-if="user" />

  <div v-else class="home-page">
    <section class="hero-section">
      <div class="container hero-content-wrapper">
        <div class="hero-text">
          <h2>Bem-vindo à TruthSeek Network</h2>
          <p>Uma rede social descentralizada para a busca da verdade através do debate estruturado e da troca de ideias.</p>
          <NuxtLink to="/user/signup" class="button-primary hero-cta">
            Criar meu perfil
          </NuxtLink>
        </div>
        <div class="hero-image-container">
          <img src="/images/hero.jpg" alt="Filósofos debatendo" class="hero-image" />
        </div>
      </div>
    </section>

    <section class="resources-section" aria-labelledby="resources-heading">
      <div class="container">
        <div class="resources-header">
          <h2 id="resources-heading">Recursos</h2>
          <NuxtLink to="/how-it-works" class="resources-more">Saiba mais</NuxtLink>
        </div>
        <ul class="resources-grid">
          <li v-for="item in resources" :key="item.title" class="resource-card">
            <div class="resource-title-row">
              <span class="resource-icon-wrap" aria-hidden="true">
                <Icon :name="item.icon" :size="20" class="resource-icon" />
              </span>
              <h3>{{ item.title }}</h3>
            </div>
            <p>{{ item.subtitle }}</p>
          </li>
        </ul>
      </div>
    </section>

    <div class="container page-content-wrapper">
      <aside class="login-section-top">
        <h3>Já é membro? Faça seu login</h3>
        <LoginForm />
        <div class="user-actions">
          <NuxtLink to="/user/signup">Criar meu perfil</NuxtLink> |
          <NuxtLink to="/user/password-recovery">Esqueceu a senha?</NuxtLink>
        </div>
      </aside>

      <section class="features-section">
        <h3>O que você pode fazer aqui?</h3>
        <ul>
          <li>Engajar-se em debates profundos sobre diversos temas.</li>
          <li>Aprender a identificar falácias e construir argumentos sólidos.</li>
          <li>Declarar vieses e participar de grupos alinhados às suas ideias.</li>
          <li>Acumular influência e subir nos rankings de usuários e vieses.</li>
          <li>Desbloquear novos recursos com gameficação conforme sua participação.</li>
          <li>Rsponder a quizzes para testar alinhamento com ideias e vieses.</li>
          <li>Participar de uma comunidade focada na evolução de ideias.</li>
        </ul>
        <div class="site-links">
          <NuxtLink to="/how-it-works">Como Funciona</NuxtLink> |
          <NuxtLink to="/faq">FAQ</NuxtLink> |
          <NuxtLink to="/terms-of-service">Termos de Serviço</NuxtLink> |
          <NuxtLink to="/privacy-policy">Privacidade</NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

const resources = [
  {
    title: 'Rede descentralizada',
    subtitle:
      'A governança da rede fica com os próprios usuários: regras, moderação e rumo de cada espaço nascem da comunidade.',
    icon: 'lucide:layout-freeform',
  },
  {
    title: 'Debate estruturado',
    subtitle:
      'Ferramentas para organizar ideias e promover debates com método — premissas, respostas e crítica encadeada.',
    icon: 'lucide:messages-square',
  },
  {
    title: 'Gamificação',
    subtitle:
      'Declare vieses, acumule influência e desbloqueie recursos conforme sua participação.',
    icon: 'lucide:trophy',
  },
  {
    title: 'Rankings de usuários e vieses',
    subtitle:
      'Veja quem influencia cada debate e compare a força relativa das ideias.',
    icon: 'lucide:podium',
  },
  {
    title: 'Quiz de vieses',
    subtitle:
      'Teste seu alinhamento com ideias, descubra nuances e compartilhe o resultado.',
    icon: 'lucide:list-checks',
  },
  {
    title: 'Confrontos entre vieses',
    subtitle:
      'Dois vieses no mesmo ringue: um espaço compartilhado para contrapor ideias.',
    icon: 'lucide:swords',
  },
  {
    title: 'Busca da verdade',
    subtitle:
      'O objetivo não é só vencer o outro — é expor ideias à crítica aberta e descobrir o que permanece de pé.',
    icon: 'lucide:search',
  },
] as const

useHead(() => ({
  title: user.value
    ? 'Meu feed — TruthSeek Network'
    : 'TruthSeek Network — Debate estruturado',
}))
</script>

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

.resources-section {
  padding: 2.75rem 0;
  border-bottom: 1px solid var(--border-color);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--primary-color) 6%, var(--body-bg)) 0%,
      var(--body-bg) 100%
    );
}

.resources-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.resources-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--primary-color);
}

.resources-more {
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.resources-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.15rem;
}

.resource-card {
  position: relative;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.35rem 1.35rem 1.4rem;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 6px 18px rgba(0, 113, 128, 0.07);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.resource-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--primary-color) 0%,
    var(--primary-color-hover) 100%
  );
}

.resource-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.06),
    0 12px 28px rgba(0, 113, 128, 0.12);
}

.resource-title-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.7rem;
}

.resource-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  flex-shrink: 0;
  border-radius: 10px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--primary-color) 14%, #fff) 0%,
    color-mix(in srgb, var(--primary-color-hover) 18%, #fff) 100%
  );
  border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.resource-icon {
  color: var(--primary-color-dark);
}

.resource-card h3 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
}

.resource-card p {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.55;
  color: color-mix(in srgb, var(--text-color) 78%, transparent);
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
}

.features-section h3 {
  font-size: 1.5rem;
  margin: 0 0 1rem;
  color: var(--primary-color);
}

.features-section ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
  flex: 1;
}

.features-section li {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.5;
}

.features-section li::before {
  content: '✔';
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: bold;
}

.site-links {
  margin-top: auto;
  padding-top: 1.25rem;
  font-size: 0.9rem;
  text-align: center;
  border-top: 1px solid var(--border-color);
}
.site-links a {
  margin: 0 0.5rem;
}

@media (min-width: 640px) {
  .resource-card {
    width: calc(50% - 0.5rem);
    max-width: none;
  }
}

@media (min-width: 992px) {
  .resources-grid {
    gap: 1.15rem;
  }

  .resource-card {
    /* 4 por linha → 2ª linha com 3 centralizada (flex + justify-content: center) */
    flex: 0 1 calc((100% - 3.45rem) / 4);
    width: calc((100% - 3.45rem) / 4);
    max-width: none;
  }

  .page-content-wrapper {
    flex-direction: row;
    align-items: stretch;
  }
  .login-section-top {
    flex-basis: 35%;
    max-width: 400px;
    flex-shrink: 0;
  }
  .features-section {
    flex: 1;
    min-width: 0;
  }
}

@media (min-width: 1200px) {
  .resource-card {
    flex: 0 1 calc((100% - 3.45rem) / 4);
    width: calc((100% - 3.45rem) / 4);
    max-width: none;
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
  .resources-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }
}
</style>
