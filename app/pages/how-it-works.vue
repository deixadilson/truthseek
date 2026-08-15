<template>
  <div class="how-it-works-page container">
    <article class="content-card">
      <h1>Como Funciona a TruthSeek Network</h1>
      <p class="intro">
        TruthSeek Network é uma rede social voltada para debates. O objetivo é
        fornecer as ferramentas necessárias para promover o debate de ideias da
        forma mais <strong>livre</strong>, <strong>justa</strong> e
        <strong>transparente</strong> possível, submetendo as diversas ideias a um
        ambiente de concorrência — uma seleção natural que evidencia as ideias
        mais coerentes.
      </p>
      <p class="intro">
        O nome TruthSeek enfatiza que o objetivo do debate não deve ser apenas
        “vencer”, mas a <strong>busca pela verdade</strong>. A plataforma incentiva
        cinco competências essenciais para um debate produtivo.
      </p>

      <section>
        <h2>As 5 competências essenciais</h2>
        <ol class="competencies-list">
          <li>
            <strong>Questionar tudo:</strong> não aceite informações passivamente;
            busque evidências e questione premissas.
          </li>
          <li>
            <strong>Aprender a debater:</strong> desenvolva argumentação lógica,
            escuta ativa e refutação construtiva.
          </li>
          <li>
            <strong>Identificar falácias:</strong> reconheça erros comuns de
            raciocínio para não ser enganado e para fortalecer seus argumentos.
          </li>
          <li>
            <strong>Criticar artigos científicos:</strong> distinga estudos sérios
            de tendenciosos ou falhos, entendendo metodologia e vieses.
          </li>
          <li>
            <strong>Conhecer ideias concorrentes:</strong> explore argumentos a
            favor e contra, sem se limitar ao senso comum ou à “versão oficial”.
          </li>
        </ol>
      </section>

      <section>
        <h2>Estrutura: categorias, vieses e grupos</h2>
        <p>
          A plataforma organiza discussões em <strong>categorias raiz</strong>
          (como Política, Filosofia, Religião e Saúde) e em
          <strong>vieses</strong> — ideias ou posições específicas dentro dessas
          categorias (ex.: Liberalismo, Socialismo).
        </p>
        <ul>
          <li>
            <strong>Grupos abertos:</strong> qualquer pessoa pode acessar o feed
            e participar das discussões (incluindo categorias raiz).
          </li>
          <li>
            <strong>Grupos restritos:</strong> grupos de um viés específico. Para
            ver e criar postagens, é necessário declarar o viés e acumular
            influência suficiente.
          </li>
        </ul>
      </section>

      <section>
        <h2>Como entrar em um grupo restrito</h2>

        <h3>1. Declarar o viés</h3>
        <p>
          Na página de <NuxtLink to="/categories">Categorias</NuxtLink>, escolha
          um grupo restrito e clique em <strong>Defender viés</strong>. Ao
          declarar, você recebe <strong>10 pontos de influência</strong> naquele
          viés — ainda sem acesso completo ao grupo.
        </p>

        <h3>2. Postar na categoria raiz</h3>
        <p>
          Publique na <strong>categoria raiz</strong> do viés (ex.: Política). Assim, outros defensores do mesmo viés podem
          vê-lo e endossá-lo.
        </p>

        <h3>3. Receber endossos</h3>
        <p>
          Outros usuários que defendem o <strong>mesmo viés</strong> podem
          endossá-lo no popover do avatar (seta para cima na lista de vieses).
          A seta só aparece quando ambos defendem o mesmo viés.
        </p>
        <p>
          Cada endosso adiciona pontos de influência, conforme o nível de quem
          endossa. Também é possível <strong>desendossar</strong>, removendo
          esses pontos.
        </p>

        <h3>4. Atingir 20 pontos</h3>
        <p>
          Com <strong>20 pontos de influência</strong> no viés, você libera o
          acesso ao grupo restrito: pode ver e criar postagens.
        </p>
      </section>

      <section>
        <h2>Níveis de influência e privilégios</h2>
        <p>
          Em função do nível de influência em um viés, o usuário recebe um
          <strong>título</strong>, um <strong>poder de endossamento (P.E.)</strong>
          e privilégios adicionais. Insígnias no perfil e molduras no avatar
          refletem o título em cada viés.
        </p>
        <div class="table-wrap">
          <table class="privileges-table">
            <thead>
              <tr>
                <th>NV</th>
                <th>Critério</th>
                <th>Título</th>
                <th>P.E.</th>
                <th>Privilégio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>0 a 19 pontos</td>
                <td>Aspirante</td>
                <td>0</td>
                <td>Pode endossar e ser endossado por outros usuários</td>
              </tr>
              <tr>
                <td>2</td>
                <td>20 a 29 pontos</td>
                <td>Neófito</td>
                <td>0</td>
                <td>Participar de grupos restritos sem rivais</td>
              </tr>
              <tr>
                <td>3</td>
                <td>30 a 49 pontos</td>
                <td>Iniciado</td>
                <td>1</td>
                <td>
                  Participar de grupos restritos com rivais<br />
                  Pode desendossar outros usuários
                </td>
              </tr>
              <tr>
                <td>4</td>
                <td>Mais de 49 pontos</td>
                <td>Seguidor</td>
                <td>1</td>
                <td>Voto conta nos debates</td>
              </tr>
              <tr>
                <td>5</td>
                <td>50% mais influente</td>
                <td>Apologista</td>
                <td>2</td>
                <td>Participar de grupos de debates</td>
              </tr>
              <tr>
                <td>6</td>
                <td>30% mais influente</td>
                <td>Entusiasta</td>
                <td>3</td>
                <td>Desafiar usuários para debates</td>
              </tr>
              <tr>
                <td>7</td>
                <td>20% mais influente</td>
                <td>Defensor</td>
                <td>4</td>
                <td>
                  Marcar posts como falaciosos<br />
                  Criar argumentos nas issues
                </td>
              </tr>
              <tr>
                <td>8</td>
                <td>10% mais influente</td>
                <td>Adepto</td>
                <td>5</td>
                <td>
                  Desmarcar posts como falaciosos<br />
                  Criar e editar artigos na wiki
                </td>
              </tr>
              <tr>
                <td>9</td>
                <td>5% mais influente</td>
                <td>Perito</td>
                <td>7</td>
                <td>Silenciar temporariamente membros do grupo</td>
              </tr>
              <tr>
                <td>10</td>
                <td>1% mais influente</td>
                <td>Elite</td>
                <td>10</td>
                <td>Criar Issues. Criar eventos</td>
              </tr>
              <tr>
                <td>11</td>
                <td>Top 25 mais influentes</td>
                <td>Mestre</td>
                <td>12</td>
                <td>
                  Banir membros com menos de 50 pontos de influência<br />
                  Excluir postagens
                </td>
              </tr>
              <tr>
                <td>12</td>
                <td>Top 5 mais influentes</td>
                <td>Grande-Mestre</td>
                <td>15</td>
                <td>Alterar a bandeira e capa do grupo</td>
              </tr>
              <tr>
                <td>13</td>
                <td>Top 1</td>
                <td>Líder</td>
                <td>20</td>
                <td>Conceder poderes a outros membros</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="note">
          <strong>P.E.</strong> = poder de endossamento: quantos pontos de
          influência o endossado recebe quando você o endossa naquele viés.
        </p>
      </section>

      <section>
        <h2>Grupos de debate e debates formais</h2>
        <p>
          <strong>Grupos de debate (Vs)</strong> reúnem membros de dois vieses
          da mesma categoria (ex.: Liberalismo vs. Socialismo). O acesso exige
          estar entre os <strong>50% mais influentes</strong> do viés.
        </p>
        <p>
          Entre os <strong>30% mais influentes</strong>, o usuário pode desafiar
          outros para debates formais. Membros dos dois vieses avaliam os
          participantes (notas de 0 a 10). Votos de quem tem menos de 50 pontos
          de influência têm peso 0; os demais, peso 1.
        </p>
        <p>
          O vencedor é quem obtém a maior soma das médias das notas dadas pelos
          defensores do próprio viés e do viés adversário. Observadores de
          outros vieses podem votar apenas como referência. Todos os votos são
          públicos, por transparência.
        </p>
        <p>
          Os resultados alimentam rankings de ideias — evidenciando quais
          posições suportam mais escrutínio.
        </p>
      </section>

      <section>
        <h2>Moderação comunitária e governança</h2>
        <p>
          A moderação é descentralizada: a comunidade regula o conteúdo e o
          poder dos membros.
        </p>
        <ul>
          <li>
            <strong>Dislikes qualificados:</strong> posts podem ser ocultados da
            visão padrão se receberem muitos dislikes de usuários de vieses
            distintos (evitando censura por um único grupo).
          </li>
          <li>
            <strong>Denúncias:</strong> categorias como nsfw, gore, offense,
            spam e off-topic. Posts marcados como <em>moderados</em> permitem
            denúncia por ofensa.
          </li>
          <li>
            <strong>Filtro de conteúdo moderado:</strong> se você deseja
            participar apenas de debates respeitosos e de alto nível,
            selecione ver apenas conteúdo moderado nos filtros do grupo. A
            preferência permanece salva até você desmarcá-la.
          </li>
          <li>
            <strong>Desendossamento:</strong> se um líder abusar dos poderes, a
            comunidade pode retirar endossos — um “impeachment orgânico” que
            reduz influência e privilégios.
          </li>
          <li>
            <strong>MetaGrupo TruthSeek:</strong> fórum sobre a própria
            plataforma, regras e melhorias, com eleição futura de Super Moderadores.
            Acesse o grupo
            <NuxtLink to="/br/truthseek">TruthSeek Network</NuxtLink>
            na seção Plataforma em
            <NuxtLink to="/categories">Categorias</NuxtLink>.
          </li>
        </ul>
      </section>

      <section>
        <h2>Ferramentas dos grupos de viés</h2>
        <p>
          Grupos de viés específico poderão organizar argumentos com
          <strong>premissas</strong> (bases do viés, com contra-argumentos e
          respostas), <strong>wiki</strong> colaborativa,
          <strong>quizzes</strong> para ajudar a escolher subvieses, e
          marcação de <strong>falácias</strong> por usuários com privilégio
          adequado.
        </p>
      </section>

      <section class="cta-section">
        <h2>Comece agora</h2>
        <p>
          Cadastre-se, explore as categorias, declare os vieses que defende e
          participe da busca pela coerência das ideias.
        </p>
        <div class="cta-actions">
          <NuxtLink to="/user/register" class="cta-btn cta-btn-primary">Criar conta</NuxtLink>
          <NuxtLink to="/categories" class="cta-btn cta-btn-secondary">Explorar categorias</NuxtLink>
          <NuxtLink to="/faq" class="cta-btn cta-btn-secondary">Ver FAQ</NuxtLink>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Como Funciona - TruthSeek Network',
  meta: [
    {
      name: 'description',
      content:
        'Entenda como funciona a TruthSeek Network: vieses, endossos, influência, grupos restritos, debates e moderação comunitária.',
    },
  ],
});
</script>

<style scoped>
.how-it-works-page {
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
  counter-reset: competencies-counter;
}

.content-card h1 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 2.2rem;
}

.content-card h2 {
  color: var(--primary-color);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--primary-color-light);
  padding-bottom: 0.5rem;
  font-size: 1.6rem;
}

.content-card h3 {
  color: var(--text-color);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.content-card p,
.content-card li {
  line-height: 1.7;
  margin-bottom: 1rem;
  color: #444;
}

.content-card p.intro {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.content-card ul {
  padding-left: 1.25rem;
  margin-bottom: 1rem;
}

.content-card strong {
  color: var(--text-color);
  font-weight: 600;
}

.competencies-list {
  list-style: none;
  padding-left: 0;
}

.competencies-list li {
  padding-left: 2em;
  position: relative;
  margin-bottom: 1.2rem;
}

.competencies-list li::before {
  counter-increment: competencies-counter;
  content: counter(competencies-counter) '.';
  position: absolute;
  left: 0;
  top: 2px;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1.2em;
}

.table-wrap {
  overflow-x: auto;
  margin: 1rem 0 1.25rem;
}

.privileges-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.privileges-table th,
.privileges-table td {
  border: 1px solid var(--border-color);
  padding: 0.65rem 0.75rem;
  text-align: left;
  vertical-align: top;
}

.privileges-table th:nth-child(1),
.privileges-table td:nth-child(1),
.privileges-table th:nth-child(4),
.privileges-table td:nth-child(4) {
  text-align: center;
  white-space: nowrap;
}

.privileges-table th {
  background-color: color-mix(in srgb, var(--primary-color) 12%, white);
  color: var(--text-color);
  font-weight: 600;
}

.privileges-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.note {
  font-size: 0.95rem;
  color: #555;
}

.cta-section {
  margin-top: 2.5rem;
  padding-top: 0.5rem;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.7em 1.35em;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  border-radius: 4px;
  border: 1px solid transparent;
  text-decoration: none;
  box-sizing: border-box;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.cta-btn:hover {
  text-decoration: none;
}

.cta-btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-on-primary);
}

.cta-btn-primary:hover {
  background-color: var(--primary-color-hover);
  border-color: var(--primary-color-hover);
  color: var(--text-on-primary);
  box-shadow: 0 5px 15px var(--button-shadow-color);
  transform: translateY(-2px);
}

.cta-btn-secondary {
  background-color: transparent;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.cta-btn-secondary:hover {
  background-color: var(--primary-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
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
