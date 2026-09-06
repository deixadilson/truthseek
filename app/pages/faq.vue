<template>
  <div class="faq-page container">
    <article class="content-card">
      <h1>Perguntas Frequentes (FAQ)</h1>
      <p class="intro">
        Respostas alinhadas às regras de negócio da TruthSeek Network. Para o
        panorama completo, veja também
        <NuxtLink to="/how-it-works">Como Funciona</NuxtLink>.
      </p>

      <div class="faq-list">
        <div class="faq-item" :class="{ open: isOpen('objetivo') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('objetivo')"
            aria-controls="faq-answer-objetivo"
            @click="toggle('objetivo')"
          >
            Qual o principal objetivo da TruthSeek Network?
          </button>
          <div
            id="faq-answer-objetivo"
            class="faq-answer-expand"
            :class="{ open: isOpen('objetivo') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  Promover debates livres, justos e transparentes, para que ideias
                  concorram entre si e as mais coerentes sejam evidenciadas. O foco
                  não é “vencer o adversário”, e sim a busca pela verdade —
                  desenvolvendo competências como questionar, debater, identificar
                  falácias e conhecer ideias concorrentes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('vies') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('vies')"
            aria-controls="faq-answer-vies"
            @click="toggle('vies')"
          >
            O que é um “viés” na plataforma?
          </button>
          <div
            id="faq-answer-vies"
            class="faq-answer-expand"
            :class="{ open: isOpen('vies') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  Um viés é uma posição ou ideia específica que você declara
                  defender (ex.: Liberalismo, Catolicismo, Veganismo), dentro de
                  categorias raiz como Política, Filosofia, Religião ou Saúde.
                  Declarar um viés associa você àquela corrente e inicia sua
                  pontuação de influência nela.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('aberto-restrito') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('aberto-restrito')"
            aria-controls="faq-answer-aberto-restrito"
            @click="toggle('aberto-restrito')"
          >
            Qual a diferença entre grupo aberto e grupo restrito?
          </button>
          <div
            id="faq-answer-aberto-restrito"
            class="faq-answer-expand"
            :class="{ open: isOpen('aberto-restrito') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  <strong>Grupos abertos</strong> (incluindo categorias raiz) podem
                  ser acessados e usados para postar sem exigir influência no viés.
              <strong>Grupos restritos</strong> são de vieses específicos: para
              ver e criar postagens neles, é preciso declarar o viés e ter
              pelo menos <strong>20 pontos de influência</strong>
              <strong> ou</strong> estar entre os
              <strong>50% mais influentes</strong> do grupo (Apologista+).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('acesso-restrito') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('acesso-restrito')"
            aria-controls="faq-answer-acesso-restrito"
            @click="toggle('acesso-restrito')"
          >
            Como consigo acesso a um grupo restrito?
          </button>
          <div
            id="faq-answer-acesso-restrito"
            class="faq-answer-expand"
            :class="{ open: isOpen('acesso-restrito') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <ol>
                  <li>Declare o viés em Categorias (“Defender viés”) — você ganha 10 pontos.</li>
                  <li>Poste na categoria raiz desse viés para ser visto por outros defensores.</li>
                  <li>Receba endossos de quem defende o mesmo viés.</li>
                  <li>Ao chegar a 20 pontos de influência, o grupo restrito é liberado.</li>
                  <li>Ou, se você estiver entre os 50% mais influentes (Apologista+), o acesso também é liberado mesmo com menos de 20 pontos.</li>
                </ol>
                <p>
                  Detalhes passo a passo em
                  <NuxtLink to="/how-it-works">Como Funciona</NuxtLink>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('endosso') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('endosso')"
            aria-controls="faq-answer-endosso"
            @click="toggle('endosso')"
          >
            Como funciona o endosso?
          </button>
          <div
            id="faq-answer-endosso"
            class="faq-answer-expand"
            :class="{ open: isOpen('endosso') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  No avatar de um post, abra o popover do autor e use a seta para
                  cima no viés em comum. Só é possível endossar quem defende o
                  <strong>mesmo viés</strong> que você. O endosso aumenta a
                  influência do endossado conforme o poder de endossamento (P.E.)
                  de quem endossa. Se o seu P.E. no viés for 0, o endosso pode ser
                  registrado, mas não altera os pontos. Você também pode desendossar,
                  retirando os pontos que aquele endosso havia concedido.
                </p>
                <p>
                  <strong>Conteúdo anônimo</strong> não pode ser endossado nem
                  desendossado: como o autor não é identificado na interface, não
                  há como associar endosso a um perfil.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('vieses-opostos') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('vieses-opostos')"
            aria-controls="faq-answer-vieses-opostos"
            @click="toggle('vieses-opostos')"
          >
            Posso defender vieses opostos ao mesmo tempo?
          </button>
          <div
            id="faq-answer-vieses-opostos"
            class="faq-answer-expand"
            :class="{ open: isOpen('vieses-opostos') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  Não. A plataforma impede declarar vieses em oposição direta (por
                  exemplo, posições rivais cadastradas como opostas). Isso mantém
                  a coerência das alianças e dos endossos dentro de cada corrente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('niveis') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('niveis')"
            aria-controls="faq-answer-niveis"
            @click="toggle('niveis')"
          >
            O que são os níveis e privilégios de influência?
          </button>
          <div
            id="faq-answer-niveis"
            class="faq-answer-expand"
            :class="{ open: isOpen('niveis') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  A influência em um viés define seu título (de Aspirante a Líder) e
                  o poder de endossamento (P.E.). Molduras no avatar e badges em
                  formato de escudo mostram o nível no contexto de cada viés.
                  <strong>O P.E. já vale nos endossos</strong> (P.E. 0 não concede
                  pontos). Se o P.E. sobe ou desce por faixa absoluta, os endossos
                  já dados por aquela pessoa no viés são reajustados na hora
                  (1 salto); por percentil, no ciclo diário. Os demais privilégios
                  descritos em
                  <NuxtLink to="/how-it-works">Como Funciona</NuxtLink>
                  (debates, falácias, wiki, moderação, etc.)
                  <strong>ainda não estão ativos</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('debates') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('debates')"
            aria-controls="faq-answer-debates"
            @click="toggle('debates')"
          >
            O que são grupos de debate (Vs) e debates formais?
          </button>
          <div
            id="faq-answer-debates"
            class="faq-answer-expand"
            :class="{ open: isOpen('debates') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  Grupos Vs reúnem dois vieses da mesma categoria (ex.: Liberalismo
                  vs. Socialismo). Em geral, o acesso exige estar entre os 50% mais
                  influentes do viés. Desafios formais ficam disponíveis entre os
                  30% mais influentes. As notas de ambos os lados definem o
                  vencedor; votos de quem tem menos de 50 pontos têm peso zero.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('especialista') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('especialista')"
            aria-controls="faq-answer-especialista"
            @click="toggle('especialista')"
          >
            Preciso ser especialista para participar?
          </button>
          <div
            id="faq-answer-especialista"
            class="faq-answer-expand"
            :class="{ open: isOpen('especialista') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  Não. A plataforma é para quem quer aprender a debater, conhecer
                  críticas às próprias ideias e evoluir argumentos. Comece nas
                  categorias raiz, declare vieses com cuidado e construa influência
                  com contribuições de qualidade.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('anonimo-moderado') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('anonimo-moderado')"
            aria-controls="faq-answer-anonimo-moderado"
            @click="toggle('anonimo-moderado')"
          >
            O que significam postagens anônimas e moderadas?
          </button>
          <div
            id="faq-answer-anonimo-moderado"
            class="faq-answer-expand"
            :class="{ open: isOpen('anonimo-moderado') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  <strong>Anônimo:</strong> a postagem ou comentário não exibe seu
                  nome/avatar na interface. Por isso, conteúdos anônimos
                  <strong>não podem ser endossados nem desendossados</strong> —
                  o endosso depende de um autor identificado.
                </p>
                <p>
                  <strong>Moderado:</strong> conteúdo sinalizado como adequado a um
                  filtro mais restrito. Comentários em posts moderados também são
                  tratados como moderados. Denúncias por ofensa aplicam-se a posts
                  moderados.
                </p>
                <p>
                  Se você deseja participar apenas de debates de alto nível e
                  respeitosos, use os
                  <strong>filtros do grupo</strong> e selecione ver apenas conteúdo
                  moderado. Essa preferência fica salva até você desmarcá-la.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('abuso') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('abuso')"
            aria-controls="faq-answer-abuso"
            @click="toggle('abuso')"
          >
            Como a plataforma lida com abuso, spam e conteúdo inadequado?
          </button>
          <div
            id="faq-answer-abuso"
            class="faq-answer-expand"
            :class="{ open: isOpen('abuso') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  A moderação é comunitária e descentralizada: dislikes qualificados (de vieses
                  distintos) podem ocultar posts da visão padrão; denúncias
                  acumulam pontos e podem ocultar ou encaminhar conteúdo; e o
                  desendossamento reduz o poder de quem abusa de privilégios.
                  Violações dos
                  <NuxtLink to="/terms-of-service">Termos de Serviço</NuxtLink>
                  podem resultar em sanções.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('pouco-popular') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('pouco-popular')"
            aria-controls="faq-answer-pouco-popular"
            @click="toggle('pouco-popular')"
          >
            Posso defender um viés pouco popular?
          </button>
          <div
            id="faq-answer-pouco-popular"
            class="faq-answer-expand"
            :class="{ open: isOpen('pouco-popular') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  Sim. Popularidade não define validade. O que importa é a força
                  dos argumentos sob escrutínio. Ideias de qualquer corrente
                  respeitosa aos Termos de Serviço podem ser debatidas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-item" :class="{ open: isOpen('metagrupo') }">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="isOpen('metagrupo')"
            aria-controls="faq-answer-metagrupo"
            @click="toggle('metagrupo')"
          >
            O que é o MetaGrupo TruthSeek?
          </button>
          <div
            id="faq-answer-metagrupo"
            class="faq-answer-expand"
            :class="{ open: isOpen('metagrupo') }"
          >
            <div class="faq-answer-expand-inner">
              <div class="faq-answer">
                <p>
                  É o fórum da própria plataforma: discutir regras, propor
                  melhorias, apelar decisões de moderação e eleger Super
                  Moderadores com mandato transparente perante a comunidade.
                  Confira o
                  <NuxtLink to="/br/truthseek/details">ranking de influência</NuxtLink>
                  ou o
                  <NuxtLink to="/br/truthseek">grupo TruthSeek Network</NuxtLink>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
const openIds = ref<Set<string>>(new Set(['objetivo']));

function isOpen(id: string) {
  return openIds.value.has(id);
}

function toggle(id: string) {
  const next = new Set(openIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  openIds.value = next;
}

useHead({
  title: 'FAQ - TruthSeek Network',
  meta: [
    {
      name: 'description',
      content:
        'Perguntas frequentes sobre vieses, endossos, grupos restritos, influência, debates e moderação na TruthSeek Network.',
    },
  ],
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
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
  margin-bottom: 0.25rem;
  padding-bottom: 0.25rem;
}

.faq-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.faq-question {
  display: block;
  width: 100%;
  text-align: left;
  font-weight: 600;
  padding: 1rem 2rem 1rem 0.5rem;
  cursor: pointer;
  position: relative;
  color: var(--text-color);
  font-size: 1.1rem;
  background: none;
  border: none;
  font-family: inherit;
  line-height: 1.35;
}

.faq-question::after {
  content: '▼';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8em;
  color: var(--primary-color);
  transition: transform 0.28s ease;
}

.faq-item.open > .faq-question::after {
  transform: translateY(-50%) rotate(180deg);
}

.faq-answer-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease;
}

.faq-answer-expand.open {
  grid-template-rows: 1fr;
}

.faq-answer-expand:not(.open) {
  pointer-events: none;
}

.faq-answer-expand-inner {
  overflow: hidden;
  min-height: 0;
}

.faq-answer {
  padding: 0.15rem 0.75rem 1.35rem 0.75rem;
  line-height: 1.7;
  color: #444;
}

.faq-answer p,
.faq-answer li {
  margin-bottom: 0.75rem;
}

.faq-answer p:last-child,
.faq-answer li:last-child {
  margin-bottom: 0;
}

.faq-answer ol {
  padding-left: 1.25rem;
  margin: 0 0 0.75rem;
}

@media (max-width: 640px) {
  .content-card {
    padding: 1.5rem 1.25rem;
  }

  .content-card h1 {
    font-size: 1.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-answer-expand,
  .faq-question::after {
    transition: none;
  }
}
</style>
