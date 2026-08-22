-- Choice-mode quiz support (e.g. religion) + seed for religiao (BR).
-- Likert quizzes keep quiz_ideology_stances + answer smallint.
-- Choice quizzes use quiz_proposition_options + chosen_group_id.

CREATE TABLE IF NOT EXISTS public.quiz_proposition_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposition_id uuid NOT NULL REFERENCES public.quiz_propositions(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quiz_proposition_options_label_not_blank CHECK (length(btrim(label)) > 0),
  CONSTRAINT quiz_proposition_options_prop_group_unique UNIQUE (proposition_id, group_id)
);

COMMENT ON TABLE public.quiz_proposition_options IS
  'Multiple-choice answers for choice-mode quizzes; each option scores one target group.';

CREATE INDEX IF NOT EXISTS quiz_proposition_options_proposition_id_idx
  ON public.quiz_proposition_options (proposition_id, sort_order);

CREATE INDEX IF NOT EXISTS quiz_proposition_options_group_id_idx
  ON public.quiz_proposition_options (group_id);

ALTER TABLE public.quiz_proposition_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to quiz_proposition_options"
  ON public.quiz_proposition_options;
CREATE POLICY "Allow public read access to quiz_proposition_options"
  ON public.quiz_proposition_options FOR SELECT USING (true);

GRANT SELECT ON public.quiz_proposition_options TO anon, authenticated;

-- Persist either Likert answer or chosen group for choice quizzes
ALTER TABLE public.quiz_attempt_answers
  ALTER COLUMN answer DROP NOT NULL;

ALTER TABLE public.quiz_attempt_answers
  DROP CONSTRAINT IF EXISTS quiz_attempt_answers_answer_range;

ALTER TABLE public.quiz_attempt_answers
  ADD COLUMN IF NOT EXISTS chosen_group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempt_answers
  DROP CONSTRAINT IF EXISTS quiz_attempt_answers_one_form;

ALTER TABLE public.quiz_attempt_answers
  ADD CONSTRAINT quiz_attempt_answers_one_form CHECK (
    (
      answer IS NOT NULL
      AND chosen_group_id IS NULL
      AND answer BETWEEN -2 AND 2
    )
    OR (
      answer IS NULL
      AND chosen_group_id IS NOT NULL
    )
  );

COMMENT ON COLUMN public.quiz_attempt_answers.answer IS
  'Likert -2..2 for likert-mode quizzes; NULL when chosen_group_id is set.';
COMMENT ON COLUMN public.quiz_attempt_answers.chosen_group_id IS
  'Target group selected in choice-mode quizzes; NULL for likert answers.';

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
              'description', g.description
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
              'description', g.description
            )
            ORDER BY g.name
          )
          FROM public.get_quiz_target_groups(p_host_group_id) g
        )
      END
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
  'Active quiz payload for a host: mode likert|choice, target groups, propositions with stances or options.';

-- Seed religiao choice quiz (28 propositions × 6 options). Replaces prior seed for this host.
DELETE FROM public.quiz_propositions
WHERE host_group_id = (
  SELECT id FROM public.groups
  WHERE slug = 'religiao' AND country_code = 'br'
  LIMIT 1
);

WITH host AS (
  SELECT id
  FROM public.groups
  WHERE slug = 'religiao'
    AND country_code = 'br'
  LIMIT 1
),
prop_src AS (
  SELECT * FROM (VALUES
  (10, $q$Sobre a existência de Deus ou deuses, o que mais se parece com o que você sente?$q$),
  (20, $q$Você acredita que o universo foi criado por alguma divindade?$q$),
  (30, $q$Dá para saber com segurança se Deus ou deuses existem?$q$),
  (40, $q$Você acredita que divindades interferem de fato na história e no dia a dia?$q$),
  (50, $q$Você acredita que existe revelação divina autorizada (livros sagrados, profetas, “palavra de Deus”)?$q$),
  (60, $q$Você acredita que milagres acontecem?$q$),
  (70, $q$Pedir a uma divindade pode mudar de verdade o que acontece?$q$),
  (80, $q$As pessoas têm o dever de adorar Deus ou deuses?$q$),
  (90, $q$Se religião tem um propósito, qual seria o principal para você?$q$),
  (100, $q$Se existe algo divino, como você o descreveria?$q$),
  (110, $q$Há um só Deus, nenhum, ou muitos?$q$),
  (120, $q$Instituições religiosas e líderes oficiais são necessários para uma vida espiritual verdadeira?$q$),
  (130, $q$Qual seria o final desejável da existência humana, para você?$q$),
  (140, $q$O que você acredita que acontece depois da morte?$q$),
  (150, $q$De onde vem, para você, a obrigação de fazer o bem?$q$),
  (160, $q$Como você explica o sofrimento e o mal?$q$),
  (170, $q$Quando alguém “erra” moralmente, qual quadro faz mais sentido para você?$q$),
  (180, $q$Você sente que deve tentar trazer outras pessoas para a sua visão?$q$),
  (190, $q$Religiões diferentes são caminhos igualmente válidos para a mesma verdade?$q$),
  (200, $q$A natureza é sagrada em si mesma?$q$),
  (210, $q$Cerimônias, rituais, festas e ofícios periódicos são essenciais para você?$q$),
  (220, $q$Oferendas ou sacrifícios a divindades são apropriados?$q$),
  (230, $q$Nossas vidas são guiadas ou determinadas por vontade divina?$q$),
  (240, $q$A sociedade deve marcar o espaço público com símbolos e calendário de uma religião verdadeira?$q$),
  (250, $q$Existem mediadores necessários entre a pessoa e o divino (santos, espíritos auxiliares, heróis divinos, etc.)?$q$),
  (260, $q$Como você decide se uma crença religiosa é verdadeira?$q$),
  (270, $q$Existe um juiz divino final de todas as ações humanas?$q$),
  (280, $q$Ofender verbalmente o divino é um mal objetivo grave?$q$)
  ) AS v(sort_order, statement)
),
inserted_props AS (
  INSERT INTO public.quiz_propositions (host_group_id, statement, sort_order, is_active)
  SELECT h.id, ps.statement, ps.sort_order, true
  FROM prop_src ps
  CROSS JOIN host h
  RETURNING id, sort_order
),
opt_src AS (
  SELECT * FROM (VALUES
  (10, $q$religiao/ateismo$q$, 10, $q$Acho que não existe Deus nem deuses. O mundo se explica sem divindades.$q$),
  (10, $q$religiao/agnosticismo$q$, 20, $q$Eu simplesmente não sei se existe Deus ou deuses — e talvez ninguém possa saber de verdade.$q$),
  (10, $q$religiao/budismo$q$, 30, $q$Para mim, a pergunta “existe um Deus criador?” não é a mais importante. O que importa é entender o sofrimento e como evitá-lo.$q$),
  (10, $q$religiao/deismo$q$, 40, $q$Creio que existe um Criador, mas não o Deus das religiões que intervêm e exigem culto o tempo todo.$q$),
  (10, $q$religiao/monoteismo$q$, 50, $q$Creio que existe um único Deus verdadeiro, pessoal e vivo.$q$),
  (10, $q$religiao/politeismo$q$, 60, $q$Creio que existem vários deuses ou divindades de verdade, cada um com seu jeito e seu domínio.$q$),
  (20, $q$religiao/ateismo$q$, 10, $q$Não. O universo não precisa de um ato divino para existir.$q$),
  (20, $q$religiao/agnosticismo$q$, 20, $q$Não tenho como saber se houve criação divina.$q$),
  (20, $q$religiao/budismo$q$, 30, $q$Não vejo a existência como algo que começa com um Deus pessoal criando tudo do zero. O que vejo é um fluxo de causas e efeitos.$q$),
  (20, $q$religiao/deismo$q$, 40, $q$Sim. Um Criador deu origem ao universo — e depois o mundo segue a ordem que Ele estabeleceu.$q$),
  (20, $q$religiao/monoteismo$q$, 50, $q$Sim. Um único Deus criou tudo e continua sustentando o que existe.$q$),
  (20, $q$religiao/politeismo$q$, 60, $q$A origem do mundo envolve vários deuses ou forças sagradas, não um único criador exclusivo.$q$),
  (30, $q$religiao/ateismo$q$, 10, $q$Sim: pelo que vemos, a ideia de Deus não se sustenta. Dá para concluir que não há deuses.$q$),
  (30, $q$religiao/agnosticismo$q$, 20, $q$Não. Isso está além do que a gente consegue provar.$q$),
  (30, $q$religiao/budismo$q$, 30, $q$O conhecimento que realmente muda a vida é sobre a mente e o sofrimento — não uma “prova de Deus”.$q$),
  (30, $q$religiao/deismo$q$, 40, $q$Sim, olhando a razão e a natureza — não precisando de livros sagrados nem igrejas.$q$),
  (30, $q$religiao/monoteismo$q$, 50, $q$Sim. Deus se dá a conhecer por sinais, fé e o que Ele revelou.$q$),
  (30, $q$religiao/politeismo$q$, 60, $q$Sim. A gente conhece o sagrado pela tradição, pelo culto e pela presença das divindades na vida.$q$),
  (40, $q$religiao/ateismo$q$, 10, $q$Não. Não há divindades para interferir.$q$),
  (40, $q$religiao/agnosticismo$q$, 20, $q$Não tenho base para afirmar que o sobrenatural mexe nos acontecimentos.$q$),
  (40, $q$religiao/budismo$q$, 30, $q$O que mais define o rumo das coisas são nossas ações e condições — não a vontade de um Deus que manda em tudo.$q$),
  (40, $q$religiao/deismo$q$, 40, $q$Não no sentido de milagres constantes. O Criador fez a ordem do mundo; o resto segue essa ordem.$q$),
  (40, $q$religiao/monoteismo$q$, 50, $q$Sim. Deus age, responde e governa.$q$),
  (40, $q$religiao/politeismo$q$, 60, $q$Sim. Deuses ajudam, cobram, protegem ou castigam — e se relacionam conosco.$q$),
  (50, $q$religiao/ateismo$q$, 10, $q$Não. Textos chamados sagrados são feitos por pessoas.$q$),
  (50, $q$religiao/agnosticismo$q$, 20, $q$Não há como validar que um texto veio mesmo de Deus.$q$),
  (50, $q$religiao/budismo$q$, 30, $q$Não creio numa revelação de um Deus criador ditando a verdade. Creio em ensinamentos práticos sobre como viver melhor e sofrer menos.$q$),
  (50, $q$religiao/deismo$q$, 40, $q$Não. O que vale é a razão e a natureza — não escrituras de religião organizada.$q$),
  (50, $q$religiao/monoteismo$q$, 50, $q$Sim. Deus se revelou de forma normativa, e isso orienta a vida.$q$),
  (50, $q$religiao/politeismo$q$, 60, $q$Há histórias, hinos e tradições que transmitem o sagrado — sem precisar de um único livro exclusivo para todo mundo.$q$),
  (60, $q$religiao/ateismo$q$, 10, $q$Não. Relatos de milagre têm explicação natural, engano ou invenção.$q$),
  (60, $q$religiao/agnosticismo$q$, 20, $q$Não sei se milagres existem; prefiro não afirmar.$q$),
  (60, $q$religiao/budismo$q$, 30, $q$Podem existir relatos extraordinários, mas meu caminho não depende de milagres de um Deus.$q$),
  (60, $q$religiao/deismo$q$, 40, $q$Em geral não. Um Criador que fica violando as leis da natureza o tempo todo não faz sentido para mim.$q$),
  (60, $q$religiao/monoteismo$q$, 50, $q$Sim. Deus pode fazer milagres.$q$),
  (60, $q$religiao/politeismo$q$, 60, $q$Sim. Divindades se manifestam com sinais, prodígios e presença.$q$),
  (70, $q$religiao/ateismo$q$, 10, $q$Não. Pedir não produz efeito sobrenatural.$q$),
  (70, $q$religiao/agnosticismo$q$, 20, $q$Não vejo evidência suficiente de que oração mude eventos.$q$),
  (70, $q$religiao/budismo$q$, 30, $q$O que realmente transforma é mudar a mente e as ações. Pedir a um Deus não é o centro disso.$q$),
  (70, $q$religiao/deismo$q$, 40, $q$Não como súplica a um Deus que controla cada detalhe do mundo.$q$),
  (70, $q$religiao/monoteismo$q$, 50, $q$Sim. Deus pode atender pedidos, do jeito que Ele julgar certo.$q$),
  (70, $q$religiao/politeismo$q$, 60, $q$Sim. Prece, oferenda e rito podem conquistar o favor de certas divindades.$q$),
  (80, $q$religiao/ateismo$q$, 10, $q$Não. Não há a quem adorar, e culto não é obrigação moral.$q$),
  (80, $q$religiao/agnosticismo$q$, 20, $q$Sem certeza sobre Deus, não vejo dever universal de adoração.$q$),
  (80, $q$religiao/budismo$q$, 30, $q$O essencial para mim é praticar ética, atenção e sabedoria — não adorar um Criador.$q$),
  (80, $q$religiao/deismo$q$, 40, $q$Respeito a ideia de um Criador, mas não sinto dever de liturgia ou culto obrigatório.$q$),
  (80, $q$religiao/monoteismo$q$, 50, $q$Sim. Devemos adorar o Deus único.$q$),
  (80, $q$religiao/politeismo$q$, 60, $q$Sim. Honrar e cultuar as divindades faz parte da ordem das coisas.$q$),
  (90, $q$religiao/ateismo$q$, 10, $q$Religião é coisa humana — consolo, poder, pertencimento ou equívoco. Não é contato real com o divino.$q$),
  (90, $q$religiao/agnosticismo$q$, 20, $q$Pode valer como cultura ou ética, mas não prova que a gente “fale” com uma realidade divina conhecida.$q$),
  (90, $q$religiao/budismo$q$, 30, $q$Servir para libertar do sofrimento e despertar. Não para cultuar um Deus.$q$),
  (90, $q$religiao/deismo$q$, 40, $q$Ajudar a viver com razão e virtude, alinhado à ordem do Criador — sem aparato clerical.$q$),
  (90, $q$religiao/monoteismo$q$, 50, $q$Honrar a Deus, viver em relação com Ele e caminhar rumo à salvação/comunhão.$q$),
  (90, $q$religiao/politeismo$q$, 60, $q$Manter relações certas com várias potências sagradas e cuidar da harmonia do mundo e da comunidade.$q$),
  (100, $q$religiao/ateismo$q$, 10, $q$Não existe divino.$q$),
  (100, $q$religiao/agnosticismo$q$, 20, $q$Se existir, não sei definir — e talvez não dê para definir com segurança.$q$),
  (100, $q$religiao/budismo$q$, 30, $q$O que importa para mim não é um Deus pessoal criador. Importa despertar e ver as coisas como são.$q$),
  (100, $q$religiao/deismo$q$, 40, $q$Uma inteligência criadora, conhecida pela razão — não pelo dogma de igreja.$q$),
  (100, $q$religiao/monoteismo$q$, 50, $q$Um Deus pessoal, único, consciente, bom e distinto do mundo que criou.$q$),
  (100, $q$religiao/politeismo$q$, 60, $q$Várias divindades com personalidade, histórias e áreas de atuação.$q$),
  (110, $q$religiao/ateismo$q$, 10, $q$Nenhum.$q$),
  (110, $q$religiao/agnosticismo$q$, 20, $q$Não afirmo número nenhum — não sei.$q$),
  (110, $q$religiao/budismo$q$, 30, $q$Essa conta de “um Deus ou muitos” não é o centro do que eu busco.$q$),
  (110, $q$religiao/deismo$q$, 40, $q$Um Criador — não um panteão.$q$),
  (110, $q$religiao/monoteismo$q$, 50, $q$Um só Deus verdadeiro; os outros não são Deus de verdade.$q$),
  (110, $q$religiao/politeismo$q$, 60, $q$Muitos deuses ou muitas potências sagradas com culto próprio.$q$),
  (120, $q$religiao/ateismo$q$, 10, $q$Não. São estruturas humanas de tradição e poder.$q$),
  (120, $q$religiao/agnosticismo$q$, 20, $q$Podem organizar cultura, mas não garantem acesso a uma verdade divina.$q$),
  (120, $q$religiao/budismo$q$, 30, $q$Companheirismo e orientação ajudam, mas a transformação depende da minha prática.$q$),
  (120, $q$religiao/deismo$q$, 40, $q$Não. Religião organizada costuma atrapalhar mais do que ajudar.$q$),
  (120, $q$religiao/monoteismo$q$, 50, $q$Em geral sim: comunidade e ensino fiéis ajudam a viver a relação com Deus.$q$),
  (120, $q$religiao/politeismo$q$, 60, $q$Em geral sim: quem conduz o rito importa para fazer o culto do jeito certo.$q$),
  (130, $q$religiao/ateismo$q$, 10, $q$Não há salvação sobrenatural. Sentido e ética se fazem nesta vida, entre humanos.$q$),
  (130, $q$religiao/agnosticismo$q$, 20, $q$Não sei o que vem depois; o que posso cuidar é desta vida.$q$),
  (130, $q$religiao/budismo$q$, 30, $q$Libertar-se do ciclo de sofrimento e despertar de verdade.$q$),
  (130, $q$religiao/deismo$q$, 40, $q$Viver com virtude e razão. O além, se existir, não depende de dogmas de igreja.$q$),
  (130, $q$religiao/monoteismo$q$, 50, $q$Estar em comunhão com o Deus único — a salvação.$q$),
  (130, $q$religiao/politeismo$q$, 60, $q$Um destino ligado às relações com deuses, ancestrais e a ordem do mundo — não um único “céu” igual para todos.$q$),
  (140, $q$religiao/ateismo$q$, 10, $q$Acaba a consciência pessoal. Não há além espiritual.$q$),
  (140, $q$religiao/agnosticismo$q$, 20, $q$Não sei.$q$),
  (140, $q$religiao/budismo$q$, 30, $q$Há continuidade: a gente renasce de acordo com as ações, até se libertar.$q$),
  (140, $q$religiao/deismo$q$, 40, $q$Pode haver alma ou algum desfecho racional — mas sem o drama das religiões reveladas.$q$),
  (140, $q$religiao/monoteismo$q$, 50, $q$Há julgamento divino e um destino eterno perante o Deus único.$q$),
  (140, $q$religiao/politeismo$q$, 60, $q$Há continuidade com ancestrais, outros reinos ou potências que acolhem ou cobram.$q$),
  (150, $q$religiao/ateismo$q$, 10, $q$De empatia, razão, acordos e consequências humanas — sem base divina.$q$),
  (150, $q$religiao/agnosticismo$q$, 20, $q$É possível ter ética sem saber se Deus existe.$q$),
  (150, $q$religiao/budismo$q$, 30, $q$De entender o sofrimento, a interdependência e agir de forma que não cause mais dano.$q$),
  (150, $q$religiao/deismo$q$, 40, $q$Da razão natural, alinhada à ordem do Criador.$q$),
  (150, $q$religiao/monoteismo$q$, 50, $q$Da vontade e da lei do Deus único.$q$),
  (150, $q$religiao/politeismo$q$, 60, $q$Dos deveres sagrados, dos costumes e do respeito às divindades e à comunidade.$q$),
  (160, $q$religiao/ateismo$q$, 10, $q$Causas naturais, sociais e humanas — sem plano divino.$q$),
  (160, $q$religiao/agnosticismo$q$, 20, $q$Não tenho uma explicação divina confiável; o sofrimento não decide a questão de Deus.$q$),
  (160, $q$religiao/budismo$q$, 30, $q$Sofrimento nasce do apego, da ignorância e do desejo. A saída é transformar isso — não aplacar um Deus.$q$),
  (160, $q$religiao/deismo$q$, 40, $q$O mundo segue leis. O mal não exige um Deus que microgerencia cada detalhe com carinho pastoral.$q$),
  (160, $q$religiao/monoteismo$q$, 50, $q$Há mistério nisso, mas Deus continua justo e bom; o mal não anula a Ele.$q$),
  (160, $q$religiao/politeismo$q$, 60, $q$Vem de conflitos entre deuses, destinos, ofensas rituais e forças do mundo.$q$),
  (170, $q$religiao/ateismo$q$, 10, $q$Causa de dano ou injustiça. Ponto. Sem “pecado” cósmico.$q$),
  (170, $q$religiao/agnosticismo$q$, 20, $q$Prefiro falar de ética humana; “pecado contra Deus” eu não consigo afirmar.$q$),
  (170, $q$religiao/budismo$q$, 30, $q$São ações e estados mentais que geram consequências — não ofensa a um legislador divino único.$q$),
  (170, $q$religiao/deismo$q$, 40, $q$São vícios e virtudes racionais — não pecado de sacramento.$q$),
  (170, $q$religiao/monoteismo$q$, 50, $q$É pecado: ofensa a Deus e quebra da relação/lei com Ele.$q$),
  (170, $q$religiao/politeismo$q$, 60, $q$É ofender divindades, quebrar tabu, ficar impuro ritualmente ou desequilibrar a ordem.$q$),
  (180, $q$religiao/ateismo$q$, 10, $q$Posso argumentar contra crenças religiosas, mas não estou oferecendo uma “salvação”.$q$),
  (180, $q$religiao/agnosticismo$q$, 20, $q$Em geral não. Se eu mesmo não tenho certeza, isso não faz sentido.$q$),
  (180, $q$religiao/budismo$q$, 30, $q$Posso compartilhar o que ajuda a sofrer menos, sem o modelo de converter alguém a um Deus.$q$),
  (180, $q$religiao/deismo$q$, 40, $q$Prefiro convencer pela razão, não por campanha religiosa.$q$),
  (180, $q$religiao/monoteismo$q$, 50, $q$Sim, faz sentido testemunhar: há uma verdade que salva.$q$),
  (180, $q$religiao/politeismo$q$, 60, $q$Em geral não sinto dever de converter o mundo inteiro; cultos podem ser locais e de quem pertence.$q$),
  (190, $q$religiao/ateismo$q$, 10, $q$Não. A maioria está errada sobre o sobrenatural.$q$),
  (190, $q$religiao/agnosticismo$q$, 20, $q$Não sabemos qual (se alguma) está certa; exclusivismos soam pretensiosos.$q$),
  (190, $q$religiao/budismo$q$, 30, $q$Nem tudo equivale: dá para distinguir o que realmente reduz sofrimento do que não reduz.$q$),
  (190, $q$religiao/deismo$q$, 40, $q$As religiões organizadas divergem e erram; a verdade está na via racional/natural.$q$),
  (190, $q$religiao/monoteismo$q$, 50, $q$Não. Há uma revelação verdadeira — as outras não são iguais.$q$),
  (190, $q$religiao/politeismo$q$, 60, $q$Pode haver espaço para muitos deuses e cultos; exclusividade de um só Deus me soa estranha.$q$),
  (200, $q$religiao/ateismo$q$, 10, $q$A natureza é o que existe. “Sagrado” é projeção nossa.$q$),
  (200, $q$religiao/agnosticismo$q$, 20, $q$Posso sentir reverência; afirmar sacralidade absoluta é outra história.$q$),
  (200, $q$religiao/budismo$q$, 30, $q$Importa não causar sofrimento aos seres e ver a interdependência — não transformar a natureza num panteão.$q$),
  (200, $q$religiao/deismo$q$, 40, $q$A natureza mostra a ordem do Criador, mas não é um conjunto de deuses.$q$),
  (200, $q$religiao/monoteismo$q$, 50, $q$A criação é boa e aponta para Deus, mas não se confunde com Deus.$q$),
  (200, $q$religiao/politeismo$q$, 60, $q$Sim. Lugares, forças e aspectos do mundo são habitados ou personificados por divindades.$q$),
  (210, $q$religiao/ateismo$q$, 10, $q$São costumes. Não são obrigação por verdade metafísica.$q$),
  (210, $q$religiao/agnosticismo$q$, 20, $q$Podem ter valor social; não provam o divino.$q$),
  (210, $q$religiao/budismo$q$, 30, $q$Prática regular importa; festejar um Deus não é o centro.$q$),
  (210, $q$religiao/deismo$q$, 40, $q$Não são essenciais. Dá para viver alinhado ao Criador sem liturgia obrigatória.$q$),
  (210, $q$religiao/monoteismo$q$, 50, $q$Sim, em grande medida: tempos e ritos sagrados fazem parte da vida com Deus.$q$),
  (210, $q$religiao/politeismo$q$, 60, $q$Sim. O calendário ritual mantém a reciprocidade com os deuses.$q$),
  (220, $q$religiao/ateismo$q$, 10, $q$Não a entidades reais.$q$),
  (220, $q$religiao/agnosticismo$q$, 20, $q$Não há base para crer que oferendas “cheguem” a deuses.$q$),
  (220, $q$religiao/budismo$q$, 30, $q$Generosidade e boas ações importam; sacrificar a deuses não é o meu modelo.$q$),
  (220, $q$religiao/deismo$q$, 40, $q$Não. O Criador não “consome” culto desse tipo.$q$),
  (220, $q$religiao/monoteismo$q$, 50, $q$Oferendas a outros deuses ou ídolos são erradas; o culto legítimo é só a Deus, do modo que Ele estipula.$q$),
  (220, $q$religiao/politeismo$q$, 60, $q$Sim. Oferendas são a linguagem normal de relação com deuses.$q$),
  (230, $q$religiao/ateismo$q$, 10, $q$Não. Há causas naturais e escolhas humanas.$q$),
  (230, $q$religiao/agnosticismo$q$, 20, $q$Não sei se existe providência.$q$),
  (230, $q$religiao/budismo$q$, 30, $q$O rumo segue causas e consequências das ações — não o roteiro de um Deus único.$q$),
  (230, $q$religiao/deismo$q$, 40, $q$Há uma ordem geral criada, não um microrroteiro divino de cada dia.$q$),
  (230, $q$religiao/monoteismo$q$, 50, $q$Sim, há providência de Deus, mesmo com liberdade humana.$q$),
  (230, $q$religiao/politeismo$q$, 60, $q$Destino, favor divino e disputas entre deuses influenciam a vida.$q$),
  (240, $q$religiao/ateismo$q$, 10, $q$Não. O espaço público deve ser secular quanto a pretensões divinas.$q$),
  (240, $q$religiao/agnosticismo$q$, 20, $q$Prefiro neutralidade: não sabemos qual religião (se alguma) é a verdadeira.$q$),
  (240, $q$religiao/budismo$q$, 30, $q$A ética pública pode se inspirar em reduzir sofrimento; privilégio a uma religião de Deus único não me convence.$q$),
  (240, $q$religiao/deismo$q$, 40, $q$Moral pública racional sim; privilégio a uma igreja revelada não.$q$),
  (240, $q$religiao/monoteismo$q$, 50, $q$Em algum grau, sim: a verdade sobre Deus pode e deve aparecer na vida coletiva.$q$),
  (240, $q$religiao/politeismo$q$, 60, $q$Prefiro espaço para festas e cultos plurais, sem exclusividade de um só Deus.$q$),
  (250, $q$religiao/ateismo$q$, 10, $q$Não há esfera divina para mediar.$q$),
  (250, $q$religiao/agnosticismo$q$, 20, $q$Afirmar mediadores sobrenaturais vai além do que sei.$q$),
  (250, $q$religiao/budismo$q$, 30, $q$Guias e exemplos ajudam no caminho; ninguém substitui a minha prática.$q$),
  (250, $q$religiao/deismo$q$, 40, $q$Não. Chego ao Criador pela razão, sem corte de intermediários cultuais.$q$),
  (250, $q$religiao/monoteismo$q$, 50, $q$Pode haver mensageiros ou intercessores, mas a adoração é só a Deus — nunca a ídolos.$q$),
  (250, $q$religiao/politeismo$q$, 60, $q$Sim. Divindades menores, espíritos e heróis fazem parte normal do culto.$q$),
  (260, $q$religiao/ateismo$q$, 10, $q$Por evidência e coerência. Afirmações sobrenaturais costumam falhar.$q$),
  (260, $q$religiao/agnosticismo$q$, 20, $q$Na dúvida, não afirmo. Falta de prova não autoriza dogma.$q$),
  (260, $q$religiao/budismo$q$, 30, $q$Pelo fruto: se reduz sofrimento e se confirma na prática.$q$),
  (260, $q$religiao/deismo$q$, 40, $q$Se combina com a razão e a ordem natural.$q$),
  (260, $q$religiao/monoteismo$q$, 50, $q$Se combina com o que Deus revelou e com a tradição fiel.$q$),
  (260, $q$religiao/politeismo$q$, 60, $q$Se é fiel aos mitos, aos ritos que funcionam e à linhagem do culto.$q$),
  (270, $q$religiao/ateismo$q$, 10, $q$Não.$q$),
  (270, $q$religiao/agnosticismo$q$, 20, $q$Não sei.$q$),
  (270, $q$religiao/budismo$q$, 30, $q$Há consequências das ações — não um tribunal de um Deus pessoal único.$q$),
  (270, $q$religiao/deismo$q$, 40, $q$Pode haver um desfecho racional perante o Criador, sem o drama mitológico das religiões organizadas.$q$),
  (270, $q$religiao/monoteismo$q$, 50, $q$Sim. Deus julgará.$q$),
  (270, $q$religiao/politeismo$q$, 60, $q$Há cobranças e juízos ligados a deuses diversos — não necessariamente um tribunal único para todos.$q$),
  (280, $q$religiao/ateismo$q$, 10, $q$Pode ser rude. Não é crime metafísico.$q$),
  (280, $q$religiao/agnosticismo$q$, 20, $q$Sem certeza do divino, “blasfêmia” não se sustenta como ofensa real ao absoluto.$q$),
  (280, $q$religiao/budismo$q$, 30, $q$Falar de forma prejudicial faz mal — mas o quadro não é “ultraje a Deus”.$q$),
  (280, $q$religiao/deismo$q$, 40, $q$Criticar religiões organizadas é legítimo; blasfêmia eclesial não me vincula.$q$),
  (280, $q$religiao/monoteismo$q$, 50, $q$Sim, ofender a Deus é grave.$q$),
  (280, $q$religiao/politeismo$q$, 60, $q$Sim, ofender deuses ou ritos pode ser impiedade perigosa.$q$)
  ) AS v(prop_sort, group_slug, sort_order, label)
)
INSERT INTO public.quiz_proposition_options (proposition_id, group_id, label, sort_order)
SELECT ip.id, g.id, os.label, os.sort_order
FROM opt_src os
JOIN inserted_props ip ON ip.sort_order = os.prop_sort
JOIN public.groups g ON g.slug = os.group_slug AND g.country_code = 'br';
