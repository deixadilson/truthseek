<template>
  <div class="faq-page container">
    <article class="content-card">
      <h1>Perguntas Frequentes (FAQ)</h1>
      <p class="intro">
        Encontre respostas para as dúvidas mais comuns sobre a TruthSeek
        Network. Se sua pergunta não estiver aqui, entre em contato conosco.
      </p>

      <div class="faq-list">
        <details class="faq-item" open> <!-- 'open' para deixar o primeiro item aberto por padrão -->
          <summary class="faq-question">
            Qual o principal objetivo da TruthSeek Network?
          </summary>
            <div class="faq-answer">
              <p>
                O principal objetivo é fornecer uma plataforma para debates
                estruturados e aprofundados, onde ideias possam ser
                analisadas criticamente, promovendo a "seleção natural" das
                ideias mais coerentes e bem fundamentadas. Buscamos incentivar
                o pensamento crítico e a busca pela verdade.
              </p>
            </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Como funciona o sistema de "vieses" e "endossos"?
          </summary>
          <div class="faq-answer">
            <p>
              Usuários declaram os "vieses" (pontos de vista) que defendem.
              Para participar ativamente de um grupo de discussão de um viés
              específico, é preciso ser "endossado" por outros membros
              daquele viés, geralmente após contribuir em discussões na
              categoria raiz. Endossos aumentam sua influência no viés,
              desbloqueando acesso e privilégios.
            </p>
            <p>
              Para mais detalhes, consulte nossa página
              <NuxtLink to="/como-funciona">Como Funciona</NuxtLink>.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Preciso ser um especialista para participar dos debates?
          </summary>
          <div class="faq-answer">
            <p>
              Não necessariamente. Incentivamos a participação de todos que
              estejam dispostos a aprender, argumentar logicamente e
              respeitar os outros participantes. A plataforma visa também
              ajudar os usuários a desenvolverem suas habilidades de debate e
              pensamento crítico.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Como a plataforma lida com desinformação e discursos de ódio?
          </summary>
          <div class="faq-answer">
            <p>
              A plataforma terá mecanismos de moderação comunitária (denúncias,
              dislikes qualificados) e ferramentas para identificar falácias.
              Também há uma opção para filtrar postagens potencialmente ofensivas.
              Violações claras dos Termos de Serviço não serão toleradas e podem
              levar a sanções, incluindo o banimento da plataforma. O foco é no
              debate de ideias, não em ataques pessoais ou propagação de conteúdo prejudicial.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Posso defender um viés que não é popular?
          </summary>
          <div class="faq-answer">
            <p>
              Sim. A TruthSeek Network é projetada para ser um espaço onde
              todas as ideias (desde que respeitem os Termos de Serviço)
              possam ser debatidas. A "popularidade" de um viés não determina
              sua validade. O objetivo é que as ideias sejam avaliadas pela
              força de seus argumentos.
            </p>
          </div>
        </details>

        <!-- Adicione mais perguntas e respostas aqui -->
        <!--
        <details class="faq-item">
          <summary class="faq-question">
            Outra Pergunta Importante?
          </summary>
          <div class="faq-answer">
            <p>
              Resposta detalhada para esta pergunta.
            </p>
          </div>
        </details>
        -->
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'FAQ - TruthSeek Network',
  meta: [
    { name: 'description', content: 'Respostas para as perguntas mais frequentes sobre a plataforma de debates TruthSeek Network.' }
  ]
});
</script>

<style scoped>
.faq-page {
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.content-card {
  background-color: var(--card-bg);
  padding: 2rem 2.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  max-width: 900px;
  margin: 0 auto;
}

.content-card h1 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 2.2rem;
}
.content-card p.intro {
  text-align: center;
  font-size: 1.05rem;
  color: #555;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.faq-list {
  margin-top: 2rem;
}

.faq-item {
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}
.faq-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.faq-question {
  font-weight: 600;
  padding: 1rem 0.5rem;
  cursor: pointer;
  position: relative;
  color: var(--text-color);
  font-size: 1.15rem;
  list-style: none; /* Remove marcador padrão do summary em alguns browsers */
}
.faq-question::-webkit-details-marker { /* Remove marcador padrão do summary no Chrome/Safari */
  display: none;
}

.faq-question::after { /* Indicador de expandir/recolher (seta) */
  content: '▼'; /* Seta para baixo */
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8em;
  color: var(--primary-color);
  transition: transform 0.2s ease-in-out;
}

.faq-item[open] > .faq-question::after {
  transform: translateY(-50%) rotate(180deg); /* Seta para cima quando aberto */
}

.faq-answer {
  padding: 0.5rem 0.75rem 1.5rem 0.75rem;
  line-height: 1.7;
  color: #444;
}
.faq-answer p {
  margin-bottom: 0.75rem;
}
.faq-answer p:last-child {
  margin-bottom: 0;
}
</style>
