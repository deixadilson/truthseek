-- Philosophy Likert quizzes (cosmologia + ontologia) with multi-axis results.
-- Extends get_quiz_for_group with parent_group_id on ideologies and axes[].

CREATE OR REPLACE FUNCTION public.get_quiz_for_group(p_host_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_is_choice boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.quiz_propositions p
    JOIN public.quiz_proposition_options o ON o.proposition_id = p.id
    WHERE p.host_group_id = p_host_group_id
      AND p.is_active
  )
  INTO v_is_choice;

  SELECT jsonb_build_object(
    'host_group_id', p_host_group_id,
    'mode', CASE WHEN v_is_choice THEN 'choice' ELSE 'likert' END,
    'ideologies', COALESCE((
      CASE
        WHEN v_is_choice THEN (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', g.id,
              'name', g.name,
              'slug', g.slug,
              'country_code', g.country_code,
              'flag_path', g.flag_path,
              'description', g.description,
              'parent_group_id', g.parent_group_id
            )
            ORDER BY g.name
          )
          FROM (
            SELECT DISTINCT o.group_id
            FROM public.quiz_propositions p
            JOIN public.quiz_proposition_options o ON o.proposition_id = p.id
            WHERE p.host_group_id = p_host_group_id
              AND p.is_active
          ) targets
          JOIN public.groups g ON g.id = targets.group_id
        )
        ELSE (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', g.id,
              'name', g.name,
              'slug', g.slug,
              'country_code', g.country_code,
              'flag_path', g.flag_path,
              'description', g.description,
              'parent_group_id', g.parent_group_id
            )
            ORDER BY g.name
          )
          FROM public.get_quiz_target_groups(p_host_group_id) g
        )
      END
    ), '[]'::jsonb),
    'axes', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', parent.id,
          'name', parent.name,
          'slug', parent.slug,
          'group_ids', (
            SELECT jsonb_agg(child.id ORDER BY child.name)
            FROM public.get_quiz_target_groups(p_host_group_id) child
            WHERE child.parent_group_id = parent.id
          )
        )
        ORDER BY parent.name
      )
      FROM (
        SELECT DISTINCT child.parent_group_id AS id
        FROM public.get_quiz_target_groups(p_host_group_id) child
        WHERE child.parent_group_id IS NOT NULL
          -- Skip direct children of the host (flat quizzes like ideologias)
          AND child.parent_group_id <> p_host_group_id
      ) axis_ids
      JOIN public.groups parent ON parent.id = axis_ids.id
      WHERE (
        SELECT count(*)
        FROM public.get_quiz_target_groups(p_host_group_id) child
        WHERE child.parent_group_id = parent.id
      ) >= 2
    ), '[]'::jsonb),
    'propositions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'issue_ids', COALESCE((
            SELECT jsonb_agg(qpi.issue_id ORDER BY qpi.issue_id)
            FROM public.quiz_proposition_issues qpi
            WHERE qpi.proposition_id = p.id
          ), '[]'::jsonb),
          'statement', p.statement,
          'sort_order', p.sort_order,
          'stances', CASE
            WHEN v_is_choice THEN '{}'::jsonb
            ELSE COALESCE((
              SELECT jsonb_object_agg(s.group_id::text, s.stance)
              FROM public.quiz_ideology_stances s
              WHERE s.proposition_id = p.id
            ), '{}'::jsonb)
          END,
          'options', CASE
            WHEN NOT v_is_choice THEN '[]'::jsonb
            ELSE COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', o.id,
                  'group_id', o.group_id,
                  'label', o.label,
                  'sort_order', o.sort_order
                )
                ORDER BY o.sort_order, o.label
              )
              FROM public.quiz_proposition_options o
              WHERE o.proposition_id = p.id
            ), '[]'::jsonb)
          END
        )
        ORDER BY p.sort_order, p.statement
      )
      FROM public.quiz_propositions p
      WHERE p.host_group_id = p_host_group_id
        AND p.is_active
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION public.get_quiz_for_group(uuid) IS
  'Quiz payload: mode, target groups (with parent_group_id), rival axes (parent containers with 2+ leaves), propositions.';


-- Seed cosmologia (21 propositions)
DELETE FROM public.quiz_propositions
WHERE host_group_id = (
  SELECT id FROM public.groups
  WHERE slug = $q$filosofia/metafisica/cosmologia$q$
    AND country_code = $q$br$q$
  LIMIT 1
);

WITH host AS (
  SELECT id
  FROM public.groups
  WHERE slug = $q$filosofia/metafisica/cosmologia$q$
    AND country_code = $q$br$q$
  LIMIT 1
),
prop_src AS (
  SELECT * FROM (VALUES
  (10, $q$A origem e a ordem do cosmos se explicam sem invocar um criador consciente.$q$, $q$p10$q$),
  (20, $q$Não há intervenção divina no curso dos acontecimentos naturais.$q$, $q$p20$q$),
  (30, $q$O fundamento último da realidade é imanente: não depende de um Deus pessoal transcendente.$q$, $q$p30$q$),
  (40, $q$Existe um Deus pessoal, consciente e intencional, do qual o universo depende.$q$, $q$p40$q$),
  (50, $q$Deus pode agir no mundo — providência ou milagres são metafisicamente possíveis.$q$, $q$p50$q$),
  (60, $q$O fundamento último da realidade é transcendente e pessoal.$q$, $q$p60$q$),
  (70, $q$O divino e o universo não são radicalmente distintos: o sagrado se identifica com o todo ou o permeia.$q$, $q$p70$q$),
  (80, $q$Não há um criador externo separado da criação; o sagrado opera como natureza do todo.$q$, $q$p80$q$),
  (90, $q$O fundamento da realidade é a unidade do ser — tudo participa de uma realidade divina imanente.$q$, $q$p90$q$),
  (100, $q$Há uma pluralidade real de universos ou domínios com leis e constantes variadas.$q$, $q$p100$q$),
  (110, $q$O “ajuste fino” do nosso cosmos é sobretudo seleção observacional entre muitos mundos.$q$, $q$p110$q$),
  (120, $q$Nosso universo não é ontologicamente único nem privilegiado frente a outros possíveis.$q$, $q$p120$q$),
  (130, $q$O ajuste fino para a vida exige uma explicação especial — não é mera coincidência casual.$q$, $q$p130$q$),
  (140, $q$O princípio antrópico revela restrições reais: observadores só existem sob parâmetros estreitos.$q$, $q$p140$q$),
  (150, $q$Nosso universo tem relevância explicativa privilegiada; a habitabilidade não se dissolve só em pluralidade especulativa.$q$, $q$p150$q$),
  (160, $q$Há finalidade real na natureza: processos podem ser inteligivelmente descritos como orientados a fins.$q$, $q$p160$q$),
  (170, $q$Explicações por fins são legítimas; nem toda boa explicação se reduz a mecanismos cegos.$q$, $q$p170$q$),
  (180, $q$Ordem e organização funcional apontam para teleologia real ou irredutível.$q$, $q$p180$q$),
  (190, $q$Não há fins intrínsecos na natureza: causas eficientes e leis bastam; “finalidade” é projeção humana.$q$, $q$p190$q$),
  (200, $q$Explicações mecânicas têm prioridade: apelos a propósitos devem traduzir-se em mecanismos.$q$, $q$p200$q$),
  (210, $q$Ordem e complexidade não implicam propósito cósmico; surgem de processos não teleológicos.$q$, $q$p210$q$)
  ) AS v(sort_order, statement, prop_key)
),
inserted AS (
  INSERT INTO public.quiz_propositions (host_group_id, statement, sort_order, is_active)
  SELECT h.id, ps.statement, ps.sort_order, true
  FROM prop_src ps
  CROSS JOIN host h
  RETURNING id, sort_order
),
keyed AS (
  SELECT i.id AS proposition_id, ps.prop_key
  FROM inserted i
  JOIN prop_src ps ON ps.sort_order = i.sort_order
),
stance_src AS (
  SELECT * FROM (VALUES
  ($q$p10$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, 2::smallint),
  ($q$p10$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -2::smallint),
  ($q$p10$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p20$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, 2::smallint),
  ($q$p20$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -2::smallint),
  ($q$p20$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, 0::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, 2::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -2::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, 2::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, 2::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, 2::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -1::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, 2::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -1::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -2::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, 2::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -1::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, 2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, 2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, -1::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, 2::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, -2::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, 2::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, -1::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, -1::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, 2::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, -1::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, 2::smallint),
  ($q$p150$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, -2::smallint),
  ($q$p150$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, 2::smallint),
  ($q$p160$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, 2::smallint),
  ($q$p160$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, -2::smallint),
  ($q$p170$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, 2::smallint),
  ($q$p170$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, -2::smallint),
  ($q$p180$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, 2::smallint),
  ($q$p180$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, -2::smallint),
  ($q$p190$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, -2::smallint),
  ($q$p190$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, 2::smallint),
  ($q$p200$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, -2::smallint),
  ($q$p200$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, 2::smallint),
  ($q$p210$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, -2::smallint),
  ($q$p210$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, 2::smallint)
  ) AS v(prop_key, group_slug, stance)
)
INSERT INTO public.quiz_ideology_stances (proposition_id, group_id, stance)
SELECT k.proposition_id, g.id, s.stance
FROM stance_src s
JOIN keyed k ON k.prop_key = s.prop_key
JOIN public.groups g ON g.slug = s.group_slug AND g.country_code = $q$br$q$;


-- Seed ontologia (36 propositions)
DELETE FROM public.quiz_propositions
WHERE host_group_id = (
  SELECT id FROM public.groups
  WHERE slug = $q$filosofia/metafisica/ontologia$q$
    AND country_code = $q$br$q$
  LIMIT 1
);

WITH host AS (
  SELECT id
  FROM public.groups
  WHERE slug = $q$filosofia/metafisica/ontologia$q$
    AND country_code = $q$br$q$
  LIMIT 1
),
prop_src AS (
  SELECT * FROM (VALUES
  (10, $q$Não existe livre-arbítrio metafísico: decisões humanas são consequência necessária de estados anteriores e leis.$q$, $q$p10$q$),
  (20, $q$Responsabilidade moral deve ser reconcebida — elogio e culpa como instrumentos sociais, não mérito metafísico absoluto.$q$, $q$p20$q$),
  (30, $q$A sensação de “poder ter feito diferente” é ilusória quanto à possibilidade real alternativa.$q$, $q$p30$q$),
  (40, $q$Livre-arbítrio é compatível com determinismo: agir livremente é agir segundo razões e caráter próprios.$q$, $q$p40$q$),
  (50, $q$Responsabilidade moral se sustenta quando a ação expressa razões e controle racional suficiente.$q$, $q$p50$q$),
  (60, $q$A experiência de agência acompanha deliberação e autocontrole reais — não é mero epifenômeno inútil.$q$, $q$p60$q$),
  (70, $q$Existe livre-arbítrio genuino: o agente poderia ter feito diferente nas mesmas condições antecedentes.$q$, $q$p70$q$),
  (80, $q$Mérito moral exige indeterminismo agentivo — culpa e louvor pressupõem que o agente não estava absolutamente determinado.$q$, $q$p80$q$),
  (90, $q$A escolha consciente é causalmente eficaz, não mero eco de processos impessoais anteriores.$q$, $q$p90$q$),
  (100, $q$Tudo o que existe é físico: não há substâncias ou propriedades irredutivelmente não físicas.$q$, $q$p100$q$),
  (110, $q$A consciência depende do físico — estados mentais supervêm ou se identificam com estados cerebrais.$q$, $q$p110$q$),
  (120, $q$A física fundamental descreve a base do real; explicações últimas devem caber na imagem científica do mundo.$q$, $q$p120$q$),
  (130, $q$Mente e matéria são irredutivelmente distintas: o mental não se esgota em descrições físicas.$q$, $q$p130$q$),
  (140, $q$A consciência tem um aspecto qualitativo que a física atual não captura.$q$, $q$p140$q$),
  (150, $q$Pessoas e mentes têm estatuto ontológico próprio — não são apenas arranjos de partículas.$q$, $q$p150$q$),
  (160, $q$A realidade é fundamentalmente mental: o físico é aparência, construção ou dependência do mental.$q$, $q$p160$q$),
  (170, $q$A consciência é ontologicamente básica — não se reduz a processos materiais independentes da mente.$q$, $q$p170$q$),
  (180, $q$Explicar o mundo começa pela experiência e pelo sujeito; o mental tem prioridade explicativa.$q$, $q$p180$q$),
  (190, $q$A mente está disseminada na natureza: há propriedades proto-mentais em níveis fundamentais.$q$, $q$p190$q$),
  (200, $q$A consciência humana não surge do absolutamente não-mental — combina microexperiências.$q$, $q$p200$q$),
  (210, $q$Físico e mental são aspectos cooriginários; uma ontologia adequada integra ambos sem eliminar o mental.$q$, $q$p210$q$),
  (220, $q$Só o presente existe: passado e futuro não são reais da mesma forma que o agora.$q$, $q$p220$q$),
  (230, $q$A passagem do tempo é objetiva — há um “agora” privilegiado que avança genuinamente.$q$, $q$p230$q$),
  (240, $q$Verdades sobre o passado dependem, em última análise, de rastros e do que existe agora.$q$, $q$p240$q$),
  (250, $q$Passado, presente e futuro são igualmente reais no bloco espaço-temporal.$q$, $q$p250$q$),
  (260, $q$A “passagem” do tempo é perspectival — reflete nossa localização, não uma exclusão ontológica.$q$, $q$p260$q$),
  (270, $q$Fatos sobre qualquer tempo existem no mesmo sentido; verdades temporais indexam posições no bloco.$q$, $q$p270$q$),
  (280, $q$Passado e presente existem; o futuro ainda não — o bloco do ser cresce com novos eventos.$q$, $q$p280$q$),
  (290, $q$Há crescimento objetivo da realidade: tornar-se presente acrescenta ser ao mundo.$q$, $q$p290$q$),
  (300, $q$O futuro é ontologicamente aberto: ainda não há fatos futuros completos como os passados.$q$, $q$p300$q$),
  (310, $q$Universais e abstratos existem: números, propriedades e relações têm realidade além dos particulares.$q$, $q$p310$q$),
  (320, $q$Entidades matemáticas são descobertas — a matemática descreve um domínio objetivo.$q$, $q$p320$q$),
  (330, $q$Objetos distintos compartilham propriedades reais; a “vermelhidão” comum não é só um nome conveniente.$q$, $q$p330$q$),
  (340, $q$Não existem universais reais: só há particulares; predicados gerais são convenções ou semelhanças.$q$, $q$p340$q$),
  (350, $q$A matemática é útil sem exigir um reino platônico de números independentes.$q$, $q$p350$q$),
  (360, $q$Semelhança não cria entidades compartilhadas: classificar juntos não implica um universal correspondente.$q$, $q$p360$q$)
  ) AS v(sort_order, statement, prop_key)
),
inserted AS (
  INSERT INTO public.quiz_propositions (host_group_id, statement, sort_order, is_active)
  SELECT h.id, ps.statement, ps.sort_order, true
  FROM prop_src ps
  CROSS JOIN host h
  RETURNING id, sort_order
),
keyed AS (
  SELECT i.id AS proposition_id, ps.prop_key
  FROM inserted i
  JOIN prop_src ps ON ps.sort_order = i.sort_order
),
stance_src AS (
  SELECT * FROM (VALUES
  ($q$p10$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, 2::smallint),
  ($q$p10$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, -1::smallint),
  ($q$p10$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, -2::smallint),
  ($q$p20$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, 2::smallint),
  ($q$p20$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, -1::smallint),
  ($q$p20$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, -2::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, 2::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, -1::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, -2::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, -1::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, 2::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, -1::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, -1::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, 2::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, -1::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, -1::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, 2::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, 0::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, -2::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, -1::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, 2::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, -2::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, -1::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, 2::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/ontologia/agencia/determinismo$q$, -2::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/ontologia/agencia/compatibilismo$q$, 0::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/ontologia/agencia/libertarianismo$q$, 2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, 2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, -1::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, 2::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -2::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -2::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, -1::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, 2::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -1::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -2::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, 0::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, 2::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -1::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, -1::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, 2::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, 0::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, -1::smallint),
  ($q$p150$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p150$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, 2::smallint),
  ($q$p150$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -1::smallint),
  ($q$p150$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, 0::smallint),
  ($q$p160$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p160$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -1::smallint),
  ($q$p160$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, 2::smallint),
  ($q$p160$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, -1::smallint),
  ($q$p170$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p170$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -1::smallint),
  ($q$p170$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, 2::smallint),
  ($q$p170$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, 0::smallint),
  ($q$p180$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p180$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -1::smallint),
  ($q$p180$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, 2::smallint),
  ($q$p180$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, -1::smallint),
  ($q$p190$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p190$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -1::smallint),
  ($q$p190$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -1::smallint),
  ($q$p190$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, 2::smallint),
  ($q$p200$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -2::smallint),
  ($q$p200$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, -1::smallint),
  ($q$p200$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, 0::smallint),
  ($q$p200$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, 2::smallint),
  ($q$p210$q$, $q$filosofia/metafisica/ontologia/substancia/materialismo$q$, -1::smallint),
  ($q$p210$q$, $q$filosofia/metafisica/ontologia/substancia/dualismo$q$, 0::smallint),
  ($q$p210$q$, $q$filosofia/metafisica/ontologia/substancia/idealismo$q$, -1::smallint),
  ($q$p210$q$, $q$filosofia/metafisica/ontologia/substancia/panpsiquismo$q$, 2::smallint),
  ($q$p220$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, 2::smallint),
  ($q$p220$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, -2::smallint),
  ($q$p220$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, -1::smallint),
  ($q$p230$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, 2::smallint),
  ($q$p230$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, -2::smallint),
  ($q$p230$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, 0::smallint),
  ($q$p240$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, 2::smallint),
  ($q$p240$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, -1::smallint),
  ($q$p240$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, -1::smallint),
  ($q$p250$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, -2::smallint),
  ($q$p250$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, 2::smallint),
  ($q$p250$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, -1::smallint),
  ($q$p260$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, -2::smallint),
  ($q$p260$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, 2::smallint),
  ($q$p260$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, -1::smallint),
  ($q$p270$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, -1::smallint),
  ($q$p270$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, 2::smallint),
  ($q$p270$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, -1::smallint),
  ($q$p280$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, -1::smallint),
  ($q$p280$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, -2::smallint),
  ($q$p280$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, 2::smallint),
  ($q$p290$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, 0::smallint),
  ($q$p290$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, -2::smallint),
  ($q$p290$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, 2::smallint),
  ($q$p300$q$, $q$filosofia/metafisica/ontologia/temporalidade/presentismo$q$, -1::smallint),
  ($q$p300$q$, $q$filosofia/metafisica/ontologia/temporalidade/eternalismo$q$, -2::smallint),
  ($q$p300$q$, $q$filosofia/metafisica/ontologia/temporalidade/growing-block$q$, 2::smallint),
  ($q$p310$q$, $q$filosofia/metafisica/ontologia/abstracao/realismo-platonico$q$, 2::smallint),
  ($q$p310$q$, $q$filosofia/metafisica/ontologia/abstracao/nominalismo$q$, -2::smallint),
  ($q$p320$q$, $q$filosofia/metafisica/ontologia/abstracao/realismo-platonico$q$, 2::smallint),
  ($q$p320$q$, $q$filosofia/metafisica/ontologia/abstracao/nominalismo$q$, -2::smallint),
  ($q$p330$q$, $q$filosofia/metafisica/ontologia/abstracao/realismo-platonico$q$, 2::smallint),
  ($q$p330$q$, $q$filosofia/metafisica/ontologia/abstracao/nominalismo$q$, -2::smallint),
  ($q$p340$q$, $q$filosofia/metafisica/ontologia/abstracao/realismo-platonico$q$, -2::smallint),
  ($q$p340$q$, $q$filosofia/metafisica/ontologia/abstracao/nominalismo$q$, 2::smallint),
  ($q$p350$q$, $q$filosofia/metafisica/ontologia/abstracao/realismo-platonico$q$, -2::smallint),
  ($q$p350$q$, $q$filosofia/metafisica/ontologia/abstracao/nominalismo$q$, 2::smallint),
  ($q$p360$q$, $q$filosofia/metafisica/ontologia/abstracao/realismo-platonico$q$, -2::smallint),
  ($q$p360$q$, $q$filosofia/metafisica/ontologia/abstracao/nominalismo$q$, 2::smallint)
  ) AS v(prop_key, group_slug, stance)
)
INSERT INTO public.quiz_ideology_stances (proposition_id, group_id, stance)
SELECT k.proposition_id, g.id, s.stance
FROM stance_src s
JOIN keyed k ON k.prop_key = s.prop_key
JOIN public.groups g ON g.slug = s.group_slug AND g.country_code = $q$br$q$;

