-- Cosmogênese: premissas necessárias (eixo divine_action).
-- Teísmo cosmológico exige criador pessoal distinto do mundo — NÃO intervenção/milagres
-- (deísmo cabe; intervenção é tese extra, não necessária).

UPDATE public.premises AS p
SET
  name = v.name,
  description = v.description
FROM (VALUES
  (
    'filosofia/metafisica/cosmologia/cosmogenese/naturalismo',
    'divine_action',
    'Não há criador pessoal do cosmos',
    'A ordem natural não depende de um agente divino consciente.'
  ),
  (
    'filosofia/metafisica/cosmologia/cosmogenese/teismo',
    'divine_action',
    'O criador é distinto do universo',
    'Há diferença entre criador e criação; Deus não se identifica com o mundo.'
  ),
  (
    'filosofia/metafisica/cosmologia/cosmogenese/panteismo',
    'divine_action',
    'Não há criador externo separado da criação',
    'O sagrado não opera como um agente de fora do todo; permeia ou se identifica com o real.'
  )
) AS v(slug, axis_key, name, description)
JOIN public.groups g
  ON g.slug = v.slug
 AND g.country_code = 'br'
WHERE p.group_id = g.id
  AND p.axis_key = v.axis_key;
