-- Rename Poderes do estado -> Tamanho do Estado
UPDATE public.issues i
SET name = 'Tamanho do Estado',
    slug = 'tamanho-do-estado'
FROM public.groups g
WHERE i.group_id = g.id
  AND g.slug = 'politica/ideologias'
  AND g.country_code = 'br'
  AND i.slug = 'poderes-do-estado';

-- Move Cotas raciais under Ações afirmativas
UPDATE public.issues i
SET parent_issue_id = parent.id,
    sort_order = 10
FROM public.groups g
JOIN public.issues parent
  ON parent.group_id = g.id
 AND parent.slug = 'acoes-afirmativas'
WHERE i.group_id = g.id
  AND g.slug = 'politica/ideologias'
  AND g.country_code = 'br'
  AND i.slug = 'cotas-raciais';

INSERT INTO public.issues (group_id, parent_issue_id, name, slug, sort_order)
SELECT g.id, NULL, v.name, v.slug, v.sort_order
FROM public.groups g
JOIN (VALUES
  ('transporte', 'Transporte', 75),
  ('eleicoes', 'Eleições', 125),
  ('energia', 'Energia', 165),
  ('previdencia', 'Previdência', 195),
  ('povos-originarios', 'Povos originários', 225),
  ('privacidade', 'Privacidade', 245)
) AS v(slug, name, sort_order) ON TRUE
WHERE g.slug = 'politica/ideologias'
  AND g.country_code = 'br'
ON CONFLICT DO NOTHING;

INSERT INTO public.issues (group_id, parent_issue_id, name, slug, sort_order)
SELECT g.id, parent.id, v.name, v.slug, v.sort_order
FROM public.groups g
JOIN public.issues parent
  ON parent.group_id = g.id
JOIN (VALUES
  ('saude', 'sistema-publico-de-saude', 'Sistema Público de Saúde', 30),
  ('saude', 'vacinas', 'Vacinas', 40),
  ('educacao', 'homeschooling', 'Homeschooling', 10),
  ('educacao', 'universidades', 'Universidades', 20),
  ('justica', 'sistema-prisional', 'Sistema prisional', 10),
  ('justica', 'pena-de-morte', 'Pena de morte', 20),
  ('liberdade-economica', 'impostos', 'Impostos', 30),
  ('liberdade-de-expressao', 'desinformacao', 'Desinformação', 10),
  ('liberdade-de-expressao', 'crimes-contra-a-honra', 'Crimes contra a honra', 20)
) AS v(parent_slug, slug, name, sort_order)
  ON parent.slug = v.parent_slug
WHERE g.slug = 'politica/ideologias'
  AND g.country_code = 'br'
ON CONFLICT DO NOTHING;
