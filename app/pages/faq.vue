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
        <details class="faq-item" open>
          <summary class="faq-question">
            Qual o principal objetivo da TruthSeek Network?
          </summary>
          <div class="faq-answer">
            <p>
              Promover debates livres, justos e transparentes, para que ideias
              concorram entre si e as mais coerentes sejam evidenciadas. O foco
              não é “vencer o adversário”, e sim a busca pela verdade —
              desenvolvendo competências como questionar, debater, identificar
              falácias e conhecer ideias concorrentes.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            O que é um “viés” na plataforma?
          </summary>
          <div class="faq-answer">
            <p>
              Um viés é uma posição ou ideia específica que você declara
              defender (ex.: Liberalismo, Catolicismo, Veganismo), dentro de
              categorias raiz como Política, Filosofia, Religião ou Saúde.
              Declarar um viés associa você àquela corrente e inicia sua
              pontuação de influência nela.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Qual a diferença entre grupo aberto e grupo restrito?
          </summary>
          <div class="faq-answer">
            <p>
              <strong>Grupos abertos</strong> (incluindo categorias raiz) podem
              ser acessados e usados para postar sem exigir influência no viés.
              <strong>Grupos restritos</strong> são de vieses específicos: para
              ver e criar postagens neles, é preciso declarar o viés e acumular
              pelo menos <strong>20 pontos de influência</strong>.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Como consigo acesso a um grupo restrito?
          </summary>
          <div class="faq-answer">
            <ol>
              <li>Declare o viés em Categorias (“Defender viés”) — você ganha 10 pontos.</li>
              <li>Poste na categoria raiz desse viés para ser visto por outros defensores.</li>
              <li>Receba endossos de quem defende o mesmo viés.</li>
              <li>Ao chegar a 20 pontos de influência, o grupo restrito é liberado.</li>
            </ol>
            <p>
              Detalhes passo a passo em
              <NuxtLink to="/how-it-works">Como Funciona</NuxtLink>.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Como funciona o endosso?
          </summary>
          <div class="faq-answer">
            <p>
              No avatar de um post, abra o popover do autor e use a seta para
              cima no viés em comum. Só é possível endossar quem defende o
              <strong>mesmo viés</strong> que você. O endosso aumenta a
              influência do endossado conforme o poder de endossamento (P.E.)
              de quem endossa. Você também pode desendossar, retirando esses
              pontos.
            </p>
            <p>
              <strong>Conteúdo anônimo</strong> não pode ser endossado nem
              desendossado: como o autor não é identificado na interface, não
              há como associar endosso a um perfil.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Posso defender vieses opostos ao mesmo tempo?
          </summary>
          <div class="faq-answer">
            <p>
              Não. A plataforma impede declarar vieses em oposição direta (por
              exemplo, posições rivais cadastradas como opostas). Isso mantém
              a coerência das alianças e dos endossos dentro de cada corrente.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            O que são os níveis e privilégios de influência?
          </summary>
          <div class="faq-answer">
            <p>
              A influência em um viés define seu título (de Aspirante a Líder) e
              desbloqueia privilégios: acesso a grupos, voto em debates,
              desafiar debatedores, marcar falácias, editar wiki, moderar e
              até conceder poderes. Quanto maior o nível, maior o poder de
              endossamento (P.E.).
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            O que são grupos de debate (Vs) e debates formais?
          </summary>
          <div class="faq-answer">
            <p>
              Grupos Vs reúnem dois vieses da mesma categoria (ex.: Liberalismo
              vs. Socialismo). Em geral, o acesso exige estar entre os 50% mais
              influentes do viés. Desafios formais ficam disponíveis entre os
              30% mais influentes. As notas de ambos os lados definem o
              vencedor; votos de quem tem menos de 50 pontos têm peso zero.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Preciso ser especialista para participar?
          </summary>
          <div class="faq-answer">
            <p>
              Não. A plataforma é para quem quer aprender a debater, conhecer
              críticas às próprias ideias e evoluir argumentos. Comece nas
              categorias raiz, declare vieses com cuidado e construa influência
              com contribuições de qualidade.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            O que significam postagens anônimas e moderadas?
          </summary>
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
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Como a plataforma lida com abuso, spam e conteúdo inadequado?
          </summary>
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
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            Posso defender um viés pouco popular?
          </summary>
          <div class="faq-answer">
            <p>
              Sim. Popularidade não define validade. O que importa é a força
              dos argumentos sob escrutínio. Ideias de qualquer corrente
              respeitosa aos Termos de Serviço podem ser debatidas.
            </p>
          </div>
        </details>

        <details class="faq-item">
          <summary class="faq-question">
            O que é o MetaGrupo TruthSeek?
          </summary>
          <div class="faq-answer">
            <p>
              É o fórum da própria plataforma: discutir regras, propor
              melhorias, apelar decisões de moderação e eleger Super
              Moderadores com mandato transparente perante a comunidade.
            </p>
          </div>
        </details>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
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
  margin-bottom: 1rem;
}

.faq-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.faq-question {
  font-weight: 600;
  padding: 1rem 2rem 1rem 0.5rem;
  cursor: pointer;
  position: relative;
  color: var(--text-color);
  font-size: 1.1rem;
  list-style: none;
}

.faq-question::-webkit-details-marker {
  display: none;
}

.faq-question::after {
  content: '▼';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8em;
  color: var(--primary-color);
  transition: transform 0.2s ease-in-out;
}

.faq-item[open] > .faq-question::after {
  transform: translateY(-50%) rotate(180deg);
}

.faq-answer {
  padding: 0.5rem 0.75rem 1.5rem 0.75rem;
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
</style>
