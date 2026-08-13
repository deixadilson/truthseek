# Generates SQL seed for premises + premise_oppositions
# Run: python scripts/seed_premises.py > /tmp/seed_premises.sql

from __future__ import annotations

# slug -> list of (sort_order, axis_key, name, description)
PREMISES: dict[str, list[tuple[int, str, str, str]]] = {
    # --- Filosofia / Agência ---
    "filosofia/metafisica/ontologia/agencia/determinismo": [
        (1, "free_will", "Não existe livre-arbítrio metafísico", "Todo evento, inclusive decisões humanas, é consequência necessária de estados anteriores e leis naturais."),
        (2, "moral_responsibility", "Responsabilidade moral deve ser reconcebida", "Elogio e culpa só fazem sentido como instrumentos de previsão e influência social, não como mérito metafísico."),
        (3, "agency_illusion", "A sensação de escolha é epifenômeno", "A experiência subjetiva de poder ter agido de outro modo não prova possibilidade real alternativa."),
    ],
    "filosofia/metafisica/ontologia/agencia/compatibilismo": [
        (1, "free_will", "Livre-arbítrio é compatível com determinismo", "Agir livremente é agir segundo razões, desejos e caráter próprios, ainda que causalmente determinados."),
        (2, "moral_responsibility", "Responsabilidade moral é sustentável", "Podemos responsabilizar agentes quando suas ações expressam razões e controle racional suficiente."),
        (3, "agency_illusion", "A experiência de agência é informativa", "A fenomenologia da escolha acompanha mecanismos reais de deliberação e autocontrole."),
    ],
    "filosofia/metafisica/ontologia/agencia/libertarianismo": [
        (1, "free_will", "Existe livre-arbítrio genuino", "Agentes podem iniciar cadeias causais e realmente poderiam ter feito diferente nas mesmas condições."),
        (2, "moral_responsibility", "Mérito moral exige indeterminismo agentivo", "Culpa e louvor pressupõem que o agente não estava absolutamente determinado a agir assim."),
        (3, "agency_illusion", "A escolha consciente é causalmente eficaz", "Decisões conscientes não são meros ecos de processos impessoais anteriores."),
    ],
    # --- Substância ---
    "filosofia/metafisica/ontologia/substancia/materialismo": [
        (1, "mind_matter", "Tudo o que existe é físico", "Não há substâncias ou propriedades irredutivelmente não físicas."),
        (2, "consciousness_base", "A consciência depende do físico", "Estados mentais supervêm ou se identificam com estados cerebrais/físicos."),
        (3, "ontology_priority", "A física fundamental descreve a base do real", "Explicações últimas devem ser compatíveis com a imagem científica do mundo."),
    ],
    "filosofia/metafisica/ontologia/substancia/dualismo": [
        (1, "mind_matter", "Mente e matéria são irredutivelmente distintas", "Propriedades mentais não se esgotam em descrições físicas."),
        (2, "consciousness_base", "A consciência não é meramente física", "Há um aspecto qualitativo da experiência que a física atual não captura."),
        (3, "ontology_priority", "O mental tem estatuto ontológico próprio", "Pessoas e mentes não são apenas arranjos de partículas."),
    ],
    "filosofia/metafisica/ontologia/substancia/idealismo": [
        (1, "mind_matter", "A realidade é fundamentalmente mental", "O físico é aparência, construção ou dependência do mental."),
        (2, "consciousness_base", "A consciência é ontologicamente básica", "Não se reduz a processos materiais independentes da mente."),
        (3, "ontology_priority", "O mental tem prioridade explicativa", "Explicar o mundo começa pela experiência e pelo sujeito."),
    ],
    "filosofia/metafisica/ontologia/substancia/panpsiquismo": [
        (1, "mind_matter", "A mente está disseminada na natureza", "Propriedades proto-mentais ou experienciais existem em níveis fundamentais."),
        (2, "consciousness_base", "A consciência emerge de combinações de microexperiências", "O mental humano não surge do absolutamente não-mental."),
        (3, "ontology_priority", "Físico e mental são aspectos cooriginários", "Uma ontologia adequada integra ambos sem eliminar o mental."),
    ],
    # --- Temporalidade ---
    "filosofia/metafisica/ontologia/temporalidade/presentismo": [
        (1, "time_ontology", "Só o presente existe", "Passado e futuro não são reais da mesma forma que o agora."),
        (2, "temporal_change", "A passagem do tempo é objetiva", "Há um agora privilegiado que avança genuinamente."),
        (3, "temporal_truth", "Verdades sobre o passado dependem de rastros presentes", "Afirmações sobre o que foi dependem do que existe agora."),
    ],
    "filosofia/metafisica/ontologia/temporalidade/eternalismo": [
        (1, "time_ontology", "Passado, presente e futuro são igualmente reais", "Todos os eventos ocupam posições no bloco espaço-temporal."),
        (2, "temporal_change", "A passagem do tempo é perspectival", "O “fluxo” reflete nossa localização temporal, não uma exclusão ontológica."),
        (3, "temporal_truth", "Verdades temporais são indexadas a posições no bloco", "Fatos sobre qualquer tempo existem no mesmo sentido."),
    ],
    "filosofia/metafisica/ontologia/temporalidade/growing-block": [
        (1, "time_ontology", "Passado e presente existem; o futuro não", "O bloco do ser cresce à medida que novos eventos se tornam presentes."),
        (2, "temporal_change", "Há crescimento objetivo da realidade", "O tornar-se presente acrescenta ser ao mundo."),
        (3, "temporal_truth", "O futuro é ontologicamente aberto", "Ainda não há fatos futuros completos no mesmo sentido dos passados."),
    ],
    # --- Abstração ---
    "filosofia/metafisica/ontologia/abstracao/realismo-platonico": [
        (1, "universals", "Universais e abstratos existem", "Números, propriedades e relações têm realidade além dos particulares concretos."),
        (2, "math_ontology", "Entidades matemáticas são descobertas", "A matemática descreve um domínio objetivo independente da mente."),
        (3, "shared_properties", "Objetos distintos compartilham propriedades reais", "A vermelhidão comum não é só um nome conveniente."),
    ],
    "filosofia/metafisica/ontologia/abstracao/nominalismo": [
        (1, "universals", "Não existem universais reais", "Só há particulares; predicados gerais são convenções linguísticas ou semelhanças."),
        (2, "math_ontology", "A matemática é útil, não um reino platônico", "Números não exigem existência abstrata independente."),
        (3, "shared_properties", "Semelhança não implica entidades compartilhadas", "Classificar objetos juntos não cria um universal correspondente."),
    ],
    # --- Cosmogênese / Pluralidade / Finalidade ---
    "filosofia/metafisica/cosmologia/cosmogenese/naturalismo": [
        (1, "cosmogenesis", "A origem do cosmos é natural", "Não é necessário invocar um agente sobrenatural criador."),
        (2, "divine_action", "Não há intervenção divina no mundo", "Explicações científicas bastam para a ordem natural."),
        (3, "ultimate_ground", "O fundamento último é imanente", "A realidade se explica sem transcendência pessoal."),
    ],
    "filosofia/metafisica/cosmologia/cosmogenese/teismo": [
        (1, "cosmogenesis", "Há um Deus criador pessoal", "O universo depende de um ser necessário, consciente e intencional."),
        (2, "divine_action", "Deus pode agir no mundo", "A providência e/ou milagres são metafisicamente possíveis."),
        (3, "ultimate_ground", "O fundamento último é transcendente e pessoal", "A ordem e a existência apontam para inteligência divina."),
    ],
    "filosofia/metafisica/cosmologia/cosmogenese/panteismo": [
        (1, "cosmogenesis", "Deus e o universo não são radicalmente distintos", "O divino se identifica com a totalidade do real ou o permeia."),
        (2, "divine_action", "O sagrado opera como natureza do todo", "Não há um criador externo separado da criação."),
        (3, "ultimate_ground", "O fundamento é a unidade do ser", "Tudo participa de uma realidade divina imanente."),
    ],
    "filosofia/metafisica/cosmologia/pluralidade/multiverso": [
        (1, "cosmic_fine_tuning", "Há uma pluralidade de universos", "Nosso cosmos é um entre muitos domínios com leis/constantes variadas."),
        (2, "anthropic_status", "O ajuste fino é seleção observacional", "Parece fino porque só universos habitáveis são observados."),
        (3, "cosmos_uniqueness", "Nosso universo não é ontologicamente único", "Não há privilégio metafísico de um único cosmos."),
    ],
    "filosofia/metafisica/cosmologia/pluralidade/principio-antropico": [
        (1, "cosmic_fine_tuning", "O ajuste fino exige explicação especial", "As condições para a vida não são mera coincidência casual."),
        (2, "anthropic_status", "O princípio antrópico destaca restrições reais", "Observadores só existem sob parâmetros estreitos e isso informa cosmologia."),
        (3, "cosmos_uniqueness", "Nosso universo tem relevância explicativa privilegiada", "A habitabilidade não deve ser dissolvida apenas em pluralidade especulativa."),
    ],
    "filosofia/metafisica/cosmologia/finalidade/teleologia": [
        (1, "natural_purpose", "Há finalidade na natureza", "Processos naturais podem ser inteligivelmente descritos como orientados a fins."),
        (2, "explanation_type", "Explicações por fins são legítimas", "Nem toda explicação boa se reduz a mecanismos cegos."),
        (3, "design_signal", "Ordem funcional sugere direção", "Organização complexa aponta para teleologia real ou irredutível."),
    ],
    "filosofia/metafisica/cosmologia/finalidade/mecanicismo": [
        (1, "natural_purpose", "Não há fins intrínsecos na natureza", "Causas eficientes e leis bastam; finalidade é projeção humana."),
        (2, "explanation_type", "Explicações mecânicas têm prioridade", "Apelos a propósitos devem ser traduzidos em mecanismos."),
        (3, "design_signal", "Ordem não implica propósito cósmico", "Complexidade surge de processos não teleológicos."),
    ],
    # --- Política / Ideologias ---
    "politica/ideologias/liberalismo": [
        (1, "property_rights", "Direitos individuais e propriedade privada são centrais", "Liberdades civis e econômicas protegem a autonomia frente ao Estado e a maiorias."),
        (2, "market_vs_plan", "Mercados voluntários alocam melhor recursos", "Trocas livres e concorrência superam planejamento central amplo."),
        (3, "state_role", "O Estado deve ser limitado", "Funções estatais se concentram em regras gerais, direitos e bens públicos essenciais."),
    ],
    "politica/ideologias/libertarianismo": [
        (1, "property_rights", "Autopropriedade e propriedade justa são invioláveis", "Agressão iniciatória contra pessoas e haveres legítimos é ilegítima."),
        (2, "market_vs_plan", "Ordem espontânea de mercado é preferível", "Intervenção coercitiva distorce informação e liberdade."),
        (3, "state_role", "O poder estatal deve ser mínimo ou nulo", "Impostos e regulações coercitivas exigem justificativa excepcional."),
    ],
    "politica/ideologias/socialismo": [
        (1, "property_rights", "A propriedade dos meios de produção deve ser social", "Controle privado amplo desses meios gera exploração e desigualdade injusta."),
        (2, "market_vs_plan", "Coordenação democrática/social supera o mercado irrestrito", "Necessidades humanas não devem ficar só ao sabor do lucro."),
        (3, "state_role", "Ação coletiva forte é necessária", "Instituições públicas devem garantir igualdade substantiva e bens sociais."),
    ],
    "politica/ideologias/comunismo": [
        (1, "property_rights", "Abolir a propriedade privada dos meios de produção", "Classes e exploração cessam com propriedade comum dos meios produtivos."),
        (2, "market_vs_plan", "A produção deve orientar-se ao uso comum", "O mercado capitalista não é o horizonte final da organização econômica."),
        (3, "state_role", "O Estado de classe deve ser superado", "A emancipação aponta para uma sociedade sem dominação de classe."),
    ],
    "politica/ideologias/social-democracia": [
        (1, "property_rights", "Mercado e propriedade privada com correções sociais", "Aceita-se economia de mercado regulada sob forte redistribuição."),
        (2, "market_vs_plan", "Capitalismo regulado com Estado de bem-estar", "Direitos sociais amplos complementam (e limitam) o mercado."),
        (3, "state_role", "Estado democrático robusto é desejável", "Serviços públicos, tributação progressiva e regulação são legítimos."),
    ],
    "politica/ideologias/conservadorismo": [
        (1, "social_change", "Tradições e instituições herdadas têm sabedoria acumulada", "Mudanças abruptas arriscam erosão de ordem e sentido social."),
        (2, "authority_custom", "Autoridade, costume e continuidade importam", "Normas espontâneas e herança cultural estabilizam a vida comum."),
        (3, "human_nature_politics", "A natureza humana é limitada e imperfeita", "Política deve ser prudente ante utopias de transformação total."),
    ],
    "politica/ideologias/progressismo": [
        (1, "social_change", "Reformas progressivas são moralmente urgentes", "Instituições devem atualizar-se para ampliar inclusão e justiça."),
        (2, "authority_custom", "Costume não justifica opressão", "Tradições devem ser criticadas quando perpetuam desigualdades."),
        (3, "human_nature_politics", "Arranjos sociais são moldáveis", "Política pode melhorar substancialmente condições e relações de poder."),
    ],
    "politica/ideologias/anarquismo": [
        (1, "state_legitimacy", "O Estado é uma forma ilegítima de dominação", "Hierarquias coercitivas centralizadas devem ser rejeitadas."),
        (2, "voluntary_order", "Ordem pode surgir sem governo", "Associações voluntárias e mutualismo sustentam cooperação."),
        (3, "hierarchy", "Hierarquias injustificadas devem ser desmanteladas", "Autoridade só se justifica por consentimento e utilidade evidentes."),
    ],
    "politica/ideologias/anarquismo/anarcocapitalismo": [
        (1, "post_state_property", "Propriedade privada permanece sem Estado", "Mercados e defesa privada podem substituir monopólio estatal."),
        (2, "state_legitimacy", "O Estado viola direitos de propriedade", "Imposto e monopólio da força são agressões institucionalizadas."),
        (3, "voluntary_order", "Ordem de mercado espontânea basta", "Contratos e concorrência geram normas e segurança."),
    ],
    "politica/ideologias/anarquismo/anarcocomunismo": [
        (1, "post_state_property", "Propriedade privada capitalista deve ser abolida", "Sem Estado, a economia se organiza pelo comum e pela necessidade."),
        (2, "state_legitimacy", "Estado e capital são dominações conjugadas", "Libertar-se exige superar ambos."),
        (3, "voluntary_order", "Comunismo libertário é ordem voluntária", "Mutualidade e autogestão substituem mercado e governo."),
    ],
    "politica/ideologias/feminismo": [
        (1, "gender_equality", "Há desigualdade estrutural de gênero a combater", "Relações de poder entre gêneros não são apenas preferências individuais."),
        (2, "gender_politics", "O pessoal é político", "Família, trabalho e corpo são arenas legítimas de contestação política."),
        (3, "gender_emancipation", "Emancipação de gênero é objetivo coletivo", "Direitos formais não bastam sem transformação social."),
    ],
    "politica/ideologias/ambientalismo": [
        (1, "eco_priority", "Limites ecológicos devem restringir a política econômica", "Crescimento e consumo não podem ignorar capacidade do planeta."),
        (2, "eco_value", "A natureza tem valor moral/político relevante", "Não é apenas recurso instrumental ilimitado."),
        (3, "eco_action", "Ação coletiva ambiental é urgente", "Regulação e coordenação são necessárias ante danos sistêmicos."),
    ],
    # --- Formas de governo / estado / regimes ---
    "politica/sistemas-de-governo/formas-de-governo/monarquia": [
        (1, "sovereign_form", "A soberania personificada é legítima", "Um monarca pode simbolizar e estabilizar a continuidade do Estado."),
        (2, "succession_principle", "Sucessão hereditária ou dinástica pode ser desejável", "Previsibilidade sucessória reduz disputas pelo poder máximo."),
        (3, "political_unity", "Unidade política se beneficia de um vértice pessoal", "A figura do monarca concentra representação da nação."),
    ],
    "politica/sistemas-de-governo/formas-de-governo/republica": [
        (1, "sovereign_form", "A soberania reside no povo via instituições", "Cargos públicos não devem ser propriedade hereditária."),
        (2, "succession_principle", "Mandatos eletivos e temporários são preferíveis", "Alternância institucional limita personalização permanente do poder."),
        (3, "political_unity", "Unidade se constrói por lei e cidadania", "A res publica, não uma dinastia, articula o comum político."),
    ],
    "politica/sistemas-de-governo/formas-de-governo/anarquia": [
        (1, "sovereign_form", "Não deve haver soberano coercitivo central", "A ausência de governo é preferível a qualquer monopólio da força."),
        (2, "succession_principle", "Não há trono ou cargo soberano a suceder", "Poder político permanente concentrado é indesejável."),
        (3, "political_unity", "Unidade política coercitiva não é necessária", "Comunidades voluntárias bastam à cooperação."),
    ],
    "politica/sistemas-de-governo/formas-de-governo/teocracia": [
        (1, "sovereign_form", "A soberania última é divina", "A lei religiosa/moral transcendente deve ordenar o poder político."),
        (2, "succession_principle", "Autoridade política deriva de legitimidade religiosa", "Quem governa o faz sob mandato sagrado ou interpretação autorizada."),
        (3, "political_unity", "Unidade política e religiosa se integram", "Separar completamente fé e ordem pública enfraquece o bem comum teológico."),
    ],
    "politica/sistemas-de-governo/formas-de-estado/federalismo": [
        (1, "territorial_power", "O poder deve ser dividido entre esfera central e unidades", "Autonomias federadas protegem diversidade e limitam concentração."),
        (2, "local_autonomy", "Entes subnacionais têm competência própria", "Nem tudo deve ser decidido no centro."),
        (3, "constitutional_division", "A divisão territorial do poder é constitucional", "Competências são garantidas contra usurpação unilateral."),
    ],
    "politica/sistemas-de-governo/formas-de-estado/confederalismo": [
        (1, "territorial_power", "A soberania principal permanece nas unidades", "O centro é delegação frágil dos membros soberanos."),
        (2, "local_autonomy", "Máxima autonomia das partes associadas", "O vínculo confederal é voluntário e reversível em espírito."),
        (3, "constitutional_division", "O centro não deve absorver as partes", "Instituições comuns servem coordenação, não hierarquia rígida."),
    ],
    "politica/sistemas-de-governo/formas-de-estado/unitarismo": [
        (1, "territorial_power", "A soberania é una e indivisível no centro", "Unidades locais exercem poder derivado, não soberano."),
        (2, "local_autonomy", "Autonomia local é administrativa, não soberana", "Pode haver descentralização, sem federalização da soberania."),
        (3, "constitutional_division", "Unidade jurídica nacional é prioritária", "Fragmentar soberania enfraquece coerência estatal."),
    ],
    "politica/sistemas-de-governo/regimes-politicos/democracia": [
        (1, "regime_legitimacy", "Legitimidade vem do consentimento popular", "Governo justo depende de participação e accountability eleitoral."),
        (2, "power_access", "Cidadãos devem poder influenciar o poder", "Direitos políticos amplos são essenciais."),
        (3, "regime_limits", "Maiorias também precisam de limites", "Direitos e instituições protegem minorias e o próprio processo democrático."),
    ],
    "politica/sistemas-de-governo/regimes-politicos/autocracia": [
        (1, "regime_legitimacy", "Concentração decisória em um centro é eficaz", "Unidade de comando pode superar paralisia pluralista."),
        (2, "power_access", "Acesso amplo ao poder não é necessário", "Governo pode ser legítimo sem contestação eleitoral aberta."),
        (3, "regime_limits", "Ordem e autoridade prevalecem sobre dispersão", "Restrições à contestação podem ser justificadas pela estabilidade."),
    ],
    "politica/sistemas-de-governo/regimes-politicos/oligarquia": [
        (1, "regime_legitimacy", "Uma elite competente deve dirigir", "Nem todos devem ter peso igual nas decisões políticas centrais."),
        (2, "power_access", "O poder cabe a poucos qualificados", "Mérito, riqueza ou status podem filtrar quem governa."),
        (3, "regime_limits", "Massas amplas não devem dominar a política", "Evitar captura por maiorias incompetentes ou voláteis."),
    ],
    # --- Religião ---
    "religiao/ateismo": [
        (1, "god_exists", "Deus não existe", "Não há ser divino real que sustente o mundo ou a moral."),
        (2, "religious_authority", "Autoridade religiosa não obriga", "Doutrinas reveladas não têm autoridade epistêmica especial."),
        (3, "afterlife", "Não há vida após a morte sobrenatural", "A existência pessoal cessa com a morte biológica."),
    ],
    "religiao/agnosticismo": [
        (1, "god_exists", "A existência de Deus é desconhecida ou indecidível", "Não se afirma teísmo nem ateísmo como certeza."),
        (2, "religious_authority", "Suspensão do juízo ante revelações", "Falta evidência suficiente para aderir dogmaticamente."),
        (3, "afterlife", "O pós-morte permanece incerto", "Não se compromete com céu, reencarnação ou aniquilação dogmática."),
    ],
    "religiao/deismo": [
        (1, "god_exists", "Há um criador racional, não necessariamente revelado", "Deus se conhece sobretudo pela razão/natureza, não por dogmas."),
        (2, "religious_authority", "Revelações positivas são suspeitas", "Religiões históricas não têm monopólio da verdade divina."),
        (3, "divine_action", "Deus não intervém rotineiramente", "O mundo segue leis sem milagres providenciais constantes."),
    ],
    "religiao/monoteismo": [
        (1, "god_exists", "Há um único Deus", "A divindade é una, não um panteão de deuses últimos."),
        (2, "religious_authority", "Há revelação ou relação válida com o Uno", "O monoteísmo estrutura culto, moral e comunidade."),
        (3, "divine_unity", "Somente um ser divino absoluto", "Outros “deuses” não compartilham a soberania última."),
    ],
    "religiao/politeismo": [
        (1, "god_exists", "Há múltiplas divindades reais", "O sagrado se manifesta em vários deuses/poderes."),
        (2, "religious_authority", "Cultos plurais são legítimos", "Não há um único deus exclusivo como única via."),
        (3, "divine_unity", "A pluralidade divina é ontologicamente genuína", "Reduzir tudo a um único Deus apaga diferenças reais."),
    ],
    "religiao/monoteismo/cristianismo": [
        (1, "christ_revelation", "Jesus Cristo é revelação central de Deus", "A fé cristã se organiza em torno da pessoa e obra de Cristo."),
        (2, "scripture_tradition", "Escrituras cristãs têm autoridade", "O cânone cristão orienta crença e prática."),
        (3, "salvation", "Há salvação em Cristo", "O destino humano se resolve na economia cristã da graça."),
    ],
    "religiao/monoteismo/cristianismo/catolicismo": [
        (1, "church_authority", "A Igreja Católica tem autoridade apostólica", "Magistério e tradição interpretam legitimamente a fé."),
        (2, "sacraments", "Os sacramentos são meios eficazes de graça", "Eucaristia e demais sacramentos têm realidade sacramental."),
        (3, "papacy_mary", "Papado e doutrina mariana são parte da fé", "Estruturas e dogmas católicos não são acidentais."),
    ],
    "religiao/monoteismo/cristianismo/protestantismo": [
        (1, "church_authority", "A Escritura tem primazia sobre o magistério romano", "Sola scriptura (em suas variantes) limita autoridade eclesiástica."),
        (2, "sacraments", "Os sacramentos não seguem o sistema católico pleno", "Rejeitam-se dogmas sacramentais e mediacionais específicos de Roma."),
        (3, "papacy_mary", "Papado e dogmas marianos católicos não obrigam", "A fé protestante dispensa essas exigências."),
    ],
    "religiao/monoteismo/islamismo": [
        (1, "prophetic_finality", "Maomé é o último profeta", "O Alcorão é revelação definitiva a ser seguida."),
        (2, "tawhid", "A unicidade absoluta de Deus (tawhid)", "Não há associação (shirk) com Allah."),
        (3, "sharia_practice", "A prática islâmica ordena a vida do crente", "Ibadat e normas reveladas estruturam a piedade."),
    ],
    "religiao/monoteismo/judaismo": [
        (1, "covenant_israel", "A aliança com Israel é central", "Torá e povo judeu estruturam a relação com Deus."),
        (2, "torah_authority", "A Torá tem autoridade normativa", "Lei e interpretação judaica orientam a vida fiel."),
        (3, "messiah_status", "A esperança messiânica judaica não se identifica com Jesus", "O messianismo cristão não é aceito como cumprimento."),
    ],
    "religiao/politeismo/hinduismo": [
        (1, "dharma_karma", "Dharma e carma ordenam a realidade moral", "Ações têm consequências além da vida imediata."),
        (2, "divine_plurality_forms", "O divino assume múltiplas formas", "Deidades e avatares expressam o sagrado."),
        (3, "moksha", "Há libertação do ciclo de renascimentos", "Moksha é horizonte soteriológico legítimo."),
    ],
    "religiao/politeismo/xintoismo": [
        (1, "kami_reality", "Kami são realidades veneráveis", "O sagrado habita lugares, antepassados e forças naturais."),
        (2, "ritual_purity", "Ritual e pureza importam", "Práticas xintoístas mantêm harmonia com o sagrado."),
        (3, "local_sacred", "O sagrado é fortemente local e imanente", "Santuários e terra têm densidade espiritual própria."),
    ],
    "religiao/budismo": [
        (1, "four_truths", "As Quatro Nobres Verdades são fundamentais", "Sofrimento, origem, cessação e caminho estruturam a libertação."),
        (2, "anatta_impermanence", "Não-eu e impermanência", "Apegar-se a um eu permanente é equívoco."),
        (3, "nirvana_path", "O Nirvana/libertação é alcançável pelo caminho", "Prática ética, meditativa e sapiencial conduz à cessação do sofrimento."),
    ],
    # --- Saúde / Dietas ---
    "saude/dietas/vegana": [
        (1, "animal_products", "Deve-se evitar produtos de origem animal", "Ética e/ou saúde justificam dieta sem carne, ovos e laticínios."),
        (2, "diet_health", "Dieta vegetal bem planejada é adequada", "Nutrientes necessários podem ser obtidos sem alimentos animais."),
        (3, "diet_ethics", "Exploração animal alimentar é moralmente problemática", "Consumir animais é, em geral, evitável e questionável."),
    ],
    "saude/dietas/carnivora": [
        (1, "animal_products", "Alimentos animais são centrais e desejáveis", "Carne e produtos animais formam a base alimentar preferível."),
        (2, "diet_health", "Dieta rica em animalidade pode ser saudável", "Excluir vegetais não é necessariamente deletério."),
        (3, "diet_ethics", "Comer animais é moralmente aceitável", "Não há dever geral de abster-se de produtos animais."),
    ],
    "saude/dietas/cetogenica": [
        (1, "carb_level", "Carboidratos devem ser drasticamente reduzidos", "Cetose nutricional é um estado metabólico desejável."),
        (2, "diet_macros", "Gorduras são o combustível principal", "A dieta privilegia lipídios sobre carboidratos."),
        (3, "metabolic_goal", "Controle glicêmico/cetose é objetivo central", "Estabilidade metabólica via baixa insulina é prioritária."),
    ],
    "saude/dietas/low-carb": [
        (1, "carb_level", "Carboidratos devem ser limitados", "Reduzir pães, açúcares e amidos melhora desfechos."),
        (2, "diet_macros", "Proteína e gordura ganham espaço relativo", "Não é necessário alto carboidrato para saúde."),
        (3, "metabolic_goal", "Melhorar metabolismo da glicose é central", "Controle de açúcar e insulina guia a dieta."),
    ],
    "saude/dietas/paleolitica": [
        (1, "ancestral_template", "O modelo ancestral deve orientar a dieta", "Alimentos pré-agrícolas são o referencial normativo."),
        (2, "processed_food", "Alimentos ultraprocessados e grãos modernos são problemáticos", "Deve-se priorizar comida “de verdade” ancestralmente plausível."),
        (3, "diet_health", "Adequação evolutiva implica saúde", "Descompasso com o ambiente alimentar moderno adoece."),
    ],
    "saude/dietas/mediterranea": [
        (1, "ancestral_template", "O padrão mediterrâneo é o referencial", "Azeite, vegetais, peixes e moderação orientam a dieta."),
        (2, "processed_food", "Qualidade e padrão alimentar importam mais que extremos", "Equilíbrio e alimentos integrais superam dogmas radicais."),
        (3, "diet_health", "Evidência epidemiológica favorece esse padrão", "Longevidade e saúde cardiovascular apoiam a abordagem."),
    ],
}


def esc(s: str) -> str:
    return s.replace("'", "''")


def main() -> None:
    print("-- Seed premises for all closed groups")
    print("BEGIN;")
    print("DELETE FROM public.premise_oppositions;")
    print("DELETE FROM public.premises;")
    print()
    print("INSERT INTO public.premises (group_id, name, description, sort_order, axis_key)")
    print("SELECT g.id, v.name, v.description, v.sort_order, v.axis_key")
    print("FROM (VALUES")

    rows = []
    for slug, items in PREMISES.items():
        for sort_order, axis_key, name, description in items:
            rows.append(
                f"  ('{esc(slug)}', {sort_order}, '{esc(axis_key)}', '{esc(name)}', '{esc(description)}')"
            )
    print(",\n".join(rows))
    print(") AS v(slug, sort_order, axis_key, name, description)")
    print("JOIN public.groups g ON g.slug = v.slug AND g.is_open = false;")
    print()
    print("-- Pair opposing premises: same axis_key + groups already opposed")
    print("INSERT INTO public.premise_oppositions (premise_id_a, premise_id_b)")
    print("SELECT DISTINCT LEAST(p1.id, p2.id), GREATEST(p1.id, p2.id)")
    print("FROM public.premises p1")
    print("JOIN public.premises p2")
    print("  ON p1.axis_key IS NOT NULL")
    print(" AND p1.axis_key = p2.axis_key")
    print(" AND p1.id < p2.id")
    print("JOIN public.groups g1 ON g1.id = p1.group_id")
    print("JOIN public.groups g2 ON g2.id = p2.group_id")
    print("JOIN public.group_oppositions go")
    print("  ON go.group_id_a = LEAST(g1.id, g2.id)")
    print(" AND go.group_id_b = GREATEST(g1.id, g2.id)")
    print("ON CONFLICT DO NOTHING;")
    print()
    print("-- Extra diet oppositions among sibling diet groups with same axis")
    print("INSERT INTO public.premise_oppositions (premise_id_a, premise_id_b)")
    print("SELECT DISTINCT LEAST(p1.id, p2.id), GREATEST(p1.id, p2.id)")
    print("FROM public.premises p1")
    print("JOIN public.premises p2")
    print("  ON p1.axis_key IS NOT NULL")
    print(" AND p1.axis_key = p2.axis_key")
    print(" AND p1.id < p2.id")
    print("JOIN public.groups g1 ON g1.id = p1.group_id")
    print("JOIN public.groups g2 ON g2.id = p2.group_id")
    print("WHERE g1.parent_group_id IS NOT NULL")
    print("  AND g1.parent_group_id = g2.parent_group_id")
    print("  AND g1.slug LIKE 'saude/dietas/%'")
    print("  AND g2.slug LIKE 'saude/dietas/%'")
    print("ON CONFLICT DO NOTHING;")
    print()
    print("COMMIT;")


if __name__ == "__main__":
    main()
