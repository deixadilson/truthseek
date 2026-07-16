<template>
  <div class="how-it-works-page container">
    <article class="content-card">
      <h1>Como Funciona a TruthSeek Network</h1>
      <p class="intro">
        A TruthSeek Network é uma rede social voltada para debates. Nosso objetivo é
        fornecer as ferramentas necessárias para promover o debate de ideias da
        forma mais livre, justa e transparente possível, submetendo as diversas
        ideias sobre diversos temas a um ambiente de concorrência/seleção
        natural que evidenciará as ideias mais coerentes.
      </p>
      <p class="intro">
        O nome TruthSeek enfatiza que o objetivo do debate não deve ser mostrar
        que você tem razão e vencer o debate, mas a busca pela verdade. A rede
        social se empenhará em divulgar este ponto, assim como as 5
        competências essenciais para um debate produtivo.
      </p>

      <section>
        <h2>As 5 Competências Essenciais</h2>
        <p>
          Incentivamos nossos usuários a desenvolver e praticar as seguintes
          competências:
        </p>
        <ol class="competencies-list">
          <li>
            <strong>Questionar tudo:</strong> Não aceite informações passivamente,
            busque evidências e questione premissas.
          </li>
          <li>
            <strong>Aprender a debater:</strong> Desenvolva habilidades de
            argumentação lógica, escuta ativa e refutação construtiva.
          </li>
          <li>
            <strong>Saber como identificar falácias:</strong> Reconheça erros comuns
            de raciocínio para não ser enganado e para construir argumentos
            mais fortes.
          </li>
          <li>
            <strong>Aprender a criticar artigos científicos:</strong> Distinga
            estudos sérios de tendenciosos ou falhos, entendendo a metodologia
            e potenciais vieses.
          </li>
          <li>
            <strong>Conhecer as várias ideias concorrentes:</strong> Explore os
            argumentos a favor e contra diferentes pontos de vista, não se
            limitando ao senso comum ou à "versão oficial dos fatos".
          </li>
        </ol>
      </section>

      <section>
        <h2>Acesso aos Grupos e Funcionamento da Plataforma</h2>
        <p>
          A plataforma é estruturada em torno de "vieses" (ideias ou pontos de
          vista específicos) agrupados em categorias raiz como Política,
          Filosofia, Direito, Saúde, Tecnologia, etc.
        </p>

        <h3>Cadastro e Definição de Vieses</h3>
        <p>
          Ao se cadastrar, o usuário poderá selecionar em sua página de perfil
          quais vieses defende. Inicialmente, isso concede <strong>10 pontos de influência</strong>
          no viés escolhido, mas ainda não dá acesso ao grupo de discussão
          específico daquele viés.
        </p>

        <h3>Endosso e Acesso a Grupos de Viés Específico</h3>
        <p>
          Para participar ativamente de um grupo de discussão de um viés
          específico, o usuário, após escolher defender o viés, deverá ser
          <strong>endossado</strong> por outros usuários que já defendem e participam
          daquele mesmo viés.
        </p>
        <p>
          Como fazer isso? O usuário deve postar no grupo da <strong>categoria raiz</strong>
          do viés escolhido (ex: no grupo "Política" se o viés for
          "Liberalismo"). Outros usuários que defendem o mesmo viés poderão
          então endossar essa postagem (clicando em um ícone de seta para cima).
        </p>
        <p>
          Ao ser endossado, o usuário ganhará mais pontos de influência no viés
          em questão, dependendo do nível de influência de quem o endossou.
          Ao acumular <strong>25 pontos de influência</strong> em um determinado viés,
          o usuário ganha acesso ao grupo de discussão específico daquele viés.
        </p>

        <h3>Influência e Privilégios</h3>
        <p>
          O nível de influência de um usuário em um viés determina seus
          privilégios e permissões dentro dos grupos daquele viés, como
          poder marcar posts como falaciosos, participar de debates formais,
          editar a wiki do viés, e até mesmo moderar o grupo em níveis mais
          altos.
        </p>

        <h3>Debates Formais</h3>
        <p>
          Usuários com alta influência podem desafiar outros usuários de vieses
          concorrentes para debates formais (escritos ou ao vivo). Esses
          debates são avaliados por membros de ambos os vieses (e também por
          observadores, embora seus votos não contem para o resultado oficial),
          e os resultados impactam um ranking de ideias, evidenciando quais
          argumentações se mostram mais coerentes e bem-sucedidas.
        </p>

        <h3>Governança Descentralizada</h3>
        <p>
          A TruthSeek Network é fundamentada em princípios de descentralização.
          A própria comunidade de usuários desempenha um papel crucial na
          moderação do conteúdo (via dislikes qualificados e denúncias) e na
          governança da plataforma, com mecanismos de desendossamento para
          remover privilégios de líderes que abusam de seu poder.
        </p>
      </section>

      <section>
        <h2>Nosso Compromisso</h2>
        <p>
          Acreditamos que um ambiente que promove o debate saudável, a
          argumentação lógica e o pensamento crítico é fundamental para a
          evolução das ideias e, consequentemente, da sociedade. Junte-se a
          nós nessa busca!
        </p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
// Nenhuma lógica de script específica é necessária para esta página informativa
// Apenas define o título da página, se desejado, usando useHead
useHead({
  title: 'Como Funciona - TruthSeek Network',
  meta: [
    { name: 'description', content: 'Entenda como a TruthSeek Network promove o debate de ideias, o sistema de vieses, endossos e a busca pela verdade.' }
  ]
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
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
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
  font-size: 1.8rem;
}

.content-card h3 {
  color: var(--text-color);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.4rem;
  font-weight: 600;
}

.content-card p, .content-card li {
  line-height: 1.7;
  margin-bottom: 1rem;
  color: #444;
}
.content-card p.intro {
    font-size: 1.1rem;
    color: #333;
    margin-bottom: 1.5rem;
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
  padding-left: 2em; /* Espaço para o ícone/número customizado */
  position: relative;
  margin-bottom: 1.2rem;
}
.competencies-list li::before {  
  counter-increment: competencies-counter;
  content: counter(competencies-counter) ".";
  position: absolute;
  left: 0;
  top: 2px;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1.2em;
}

.content-card section:last-child {
  margin-bottom: 0;
}
.content-card section:last-child p:last-child {
  margin-bottom: 0;
}
</style>