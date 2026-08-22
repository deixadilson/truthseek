-- Seed cosmologia quiz: 2 propositions per closed group (14 total).
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
  (10, $q$O universo surgiu e funciona sozinho, sem ninguém criando ou dirigindo isso.$q$, $q$p10$q$),
  (20, $q$Não há um criador consciente por trás do cosmos — só causas e leis naturais.$q$, $q$p20$q$),
  (30, $q$Existe um Deus vivo e consciente que quis que o universo existisse.$q$, $q$p30$q$),
  (40, $q$No fundo, a realidade depende de alguém pessoal e maior do que o universo.$q$, $q$p40$q$),
  (50, $q$Deus não é um ser separado “acima” do mundo — o divino é o próprio todo, ou está em tudo.$q$, $q$p50$q$),
  (60, $q$Tudo o que existe participa de uma só realidade sagrada; o divino e o mundo são inseparáveis.$q$, $q$p60$q$),
  (70, $q$Nosso universo é só um entre muitos — outros “mundos” com regras diferentes também existem ou existiram.$q$, $q$p70$q$),
  (80, $q$Parece que tudo está “ajustado” para a vida porque só em universos habitáveis alguém poderia estar olhando.$q$, $q$p80$q$),
  (90, $q$As condições do nosso universo para haver vida são tão estreitas que pedem uma explicação de verdade — não “foi sorte”.$q$, $q$p90$q$),
  (100, $q$O fato de só podermos existir sob certos parâmetros diz algo importante sobre como o cosmos é.$q$, $q$p100$q$),
  (110, $q$Na natureza há direção e propósito — as coisas não são só “empurrões cegos”.$q$, $q$p110$q$),
  (120, $q$A ordem e a complexidade do mundo sugerem que há finalidade real, não só aparência de propósito.$q$, $q$p120$q$),
  (130, $q$Na natureza não há “para quê” embutido — só causas, leis e consequências.$q$, $q$p130$q$),
  (140, $q$Complexidade e ordem nascem sem um plano cósmico; não precisam de finalidade real.$q$, $q$p140$q$)
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
  ($q$p20$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, 2::smallint),
  ($q$p30$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, 2::smallint),
  ($q$p40$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, -1::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -1::smallint),
  ($q$p50$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, 2::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/naturalismo$q$, -2::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/teismo$q$, -1::smallint),
  ($q$p60$q$, $q$filosofia/metafisica/cosmologia/cosmogenese/panteismo$q$, 2::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, 2::smallint),
  ($q$p70$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, -1::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, 2::smallint),
  ($q$p80$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, -2::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, -1::smallint),
  ($q$p90$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, 2::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/cosmologia/pluralidade/multiverso$q$, -1::smallint),
  ($q$p100$q$, $q$filosofia/metafisica/cosmologia/pluralidade/principio-antropico$q$, 2::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, 2::smallint),
  ($q$p110$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, -2::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, 2::smallint),
  ($q$p120$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, -2::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, -2::smallint),
  ($q$p130$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, 2::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/cosmologia/finalidade/teleologia$q$, -2::smallint),
  ($q$p140$q$, $q$filosofia/metafisica/cosmologia/finalidade/mecanicismo$q$, 2::smallint)
  ) AS v(prop_key, group_slug, stance)
)
INSERT INTO public.quiz_ideology_stances (proposition_id, group_id, stance)
SELECT k.proposition_id, g.id, s.stance
FROM stance_src s
JOIN keyed k ON k.prop_key = s.prop_key
JOIN public.groups g ON g.slug = s.group_slug AND g.country_code = $q$br$q$;
