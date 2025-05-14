<template>
  <div class="terms-page container">
    <article class="content-card">
      <h1>Termos de Serviço</h1>
      <p class="effective-date">Última atualização: 14/05/2025</p>

      <p class="intro">
        Bem-vindo à TruthSeek Network! Estes Termos de Serviço ("Termos")
        regem o seu uso da nossa plataforma de debates online, incluindo
        nosso website, aplicativos e quaisquer serviços relacionados
        (coletivamente, os "Serviços"). Ao acessar ou usar nossos Serviços,
        você concorda em cumprir estes Termos. Se você não concordar com
        estes Termos, por favor, não use nossos Serviços.
      </p>

      <section>
        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao criar uma conta ou usar os Serviços, você afirma que tem pelo
          menos 13 anos de idade (ou a idade mínima exigida em sua jurisdição
          para consentir com o processamento de seus dados pessoais) e que
          aceita estes Termos. Se você estiver usando os Serviços em nome de
          uma organização, você declara e garante que tem autoridade para
          vincular essa organização a estes Termos.
        </p>
      </section>

      <section>
        <h2>2. Sua Conta</h2>
        <p>
          Você é responsável por manter a confidencialidade de sua senha e
          conta. Você concorda em nos notificar imediatamente sobre qualquer
          uso não autorizado de sua conta. Não nos responsabilizamos por
          quaisquer perdas ou danos decorrentes do seu incumprimento desta
          obrigação de segurança.
        </p>
      </section>

      <section>
        <h2>3. Conduta do Usuário e Conteúdo</h2>
        <p>
          Você é o único responsável por todo o conteúdo que postar,
          compartilhar ou de outra forma tornar disponível através dos
          Serviços ("Seu Conteúdo"). Você concorda em não usar os Serviços
          para:
        </p>
        <ul>
          <li>
            Publicar conteúdo ilegal, prejudicial, ameaçador, abusivo,
            assediador, difamatório, vulgar, obsceno, odioso, ou
            racialmente, etnicamente ou de outra forma censurável.
          </li>
          <li>Violar quaisquer leis ou regulamentos aplicáveis.</li>
          <li>Personificar qualquer pessoa ou entidade.</li>
          <li>
            Publicar ou transmitir qualquer material que contenha vírus de
            software ou qualquer outro código de computador, arquivos ou
            programas projetados para interromper, destruir ou limitar a
            funcionalidade de qualquer software ou hardware de computador
            ou equipamento de telecomunicações.
          </li>
          <li>
            Coletar ou armazenar dados pessoais sobre outros usuários sem o
            seu consentimento expresso.
          </li>
          <li>Engajar em spam ou publicidade não solicitada.</li>
        </ul>
        <p>
          Reservamo-nos o direito, mas não a obrigação, de remover ou
          recusar a distribuição de qualquer Conteúdo do Usuário que viole
          estes Termos ou que seja de outra forma censurável, a nosso
          critério exclusivo.
        </p>
      </section>

      <section>
        <h2>4. Propriedade Intelectual</h2>
        <p>
          Os Serviços e seu conteúdo original (excluindo o Conteúdo do
          Usuário), características e funcionalidades são e permanecerão
          propriedade exclusiva da TruthSeek Network e seus licenciadores. Os
          Serviços são protegidos por direitos autorais, marcas registradas e
          outras leis.
        </p>
        <p>
          Ao postar Seu Conteúdo, você nos concede uma licença mundial, não
          exclusiva, isenta de royalties, sublicenciável e transferível para
          usar, reproduzir, distribuir, preparar trabalhos derivados, exibir
          e executar Seu Conteúdo em conexão com os Serviços e nossos
          negócios.
        </p>
      </section>

      <section>
        <h2>5. Modificação e Rescisão dos Serviços</h2>
        <p>
          Reservamo-nos o direito de modificar ou descontinuar, temporária ou
          permanentemente, os Serviços (ou qualquer parte deles) com ou sem
          aviso prévio. Podemos também encerrar ou suspender sua conta e seu
          acesso aos Serviços imediatamente, sem aviso prévio ou
          responsabilidade, por qualquer motivo, incluindo, sem limitação, se
          você violar os Termos.
        </p>
      </section>

      <section>
        <h2>6. Isenção de Garantias e Limitação de Responsabilidade</h2>
        <p>
          OS SERVIÇOS SÃO FORNECIDOS "COMO ESTÃO" E "CONFORME DISPONÍVEIS",
          SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS. EM NENHUMA
          HIPÓTESE A TRUTHSEEK NETWORK SERÁ RESPONSÁVEL POR QUAISQUER DANOS
          INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS OU PUNITIVOS.
        </p>
        <p>
          <strong>[ESTA É UMA CLÁUSULA LEGAL MUITO IMPORTANTE. CONSULTE UM ADVOGADO.]</strong>
        </p>
      </section>

      <section>
        <h2>7. Alterações nos Termos</h2>
        <p>
          Reservamo-nos o direito, a nosso critério exclusivo, de modificar
          ou substituir estes Termos a qualquer momento. Se uma revisão for
          material, tentaremos fornecer um aviso prévio de pelo menos 30 dias
          antes que quaisquer novos termos entrem em vigor. O que constitui
          uma alteração material será determinado a nosso critério exclusivo.
        </p>
      </section>

      <section>
        <h2>8. Contato</h2>
        <p>
          Se você tiver alguma dúvida sobre estes Termos, entre em contato
          conosco em [seu email de contato ou link para página de contato].
        </p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Termos de Serviço - TruthSeek Network',
  meta: [
    { name: 'description', content: 'Leia os Termos de Serviço que regem o uso da plataforma TruthSeek Network.' }
  ]
});
</script>

<style scoped>
.terms-page {
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
  margin-bottom: 0.5rem; /* Menos espaço abaixo do H1 */
  font-size: 2.2rem;
}

.effective-date {
  text-align: center;
  font-style: italic;
  color: #777;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.content-card h2 {
  color: var(--primary-color);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--primary-color-light);
  padding-bottom: 0.5rem;
  font-size: 1.6rem; /* Um pouco menor que na página Como Funciona */
}

.content-card p, .content-card li {
  line-height: 1.7;
  margin-bottom: 1rem;
  color: #444;
}
.content-card p.intro {
  font-size: 1.05rem; /* Um pouco menor que o intro da outra página */
  color: #333;
  margin-bottom: 1.5rem;
}

.content-card strong {
  color: var(--text-color);
  font-weight: 600;
}

.content-card ul {
  list-style: disc; /* Marcadores de lista padrão */
  padding-left: 2rem; /* Recuo para a lista */
  margin-bottom: 1rem;
}
.content-card ul li {
    margin-bottom: 0.5rem;
}

.content-card section:last-child p:last-child {
  margin-bottom: 0;
}
</style>