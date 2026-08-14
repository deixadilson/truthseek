INSERT INTO public.issues (group_id, parent_issue_id, name, slug, sort_order)
SELECT g.id, NULL, v.name, v.slug, v.sort_order
FROM public.groups g
JOIN (VALUES
  ('tamanho-do-estado', 'Tamanho do Estado', 10),
  ('saude', 'Saúde', 20),
  ('educacao', 'Educação', 30),
  ('seguranca', 'Segurança', 40),
  ('drogas', 'Drogas', 50),
  ('habitacao', 'Habitação', 60),
  ('saneamento', 'Saneamento', 70),
  ('transporte', 'Transporte', 75),
  ('cultura', 'Cultura', 80),
  ('fronteiras', 'Fronteiras', 90),
  ('imigracao', 'Imigração', 100),
  ('geopolitica', 'Geopolítica', 110),
  ('legislacao', 'Legislação', 120),
  ('eleicoes', 'Eleições', 125),
  ('justica', 'Justiça', 130),
  ('lgbtq', 'LGBTQ+', 140),
  ('armamento', 'Armamento', 150),
  ('ambientalismo', 'Ambientalismo', 160),
  ('energia', 'Energia', 165),
  ('defesa', 'Defesa', 170),
  ('acoes-afirmativas', 'Ações afirmativas', 180),
  ('welfare', 'Welfare', 190),
  ('previdencia', 'Previdência', 195),
  ('liberdade-economica', 'Liberdade econômica', 200),
  ('nacionalismo', 'Nacionalismo', 210),
  ('racismo', 'Racismo', 220),
  ('povos-originarios', 'Povos originários', 225),
  ('liberdade-religiosa', 'Liberdade religiosa', 230),
  ('liberdade-de-expressao', 'Liberdade de expressão', 240),
  ('privacidade', 'Privacidade', 245),
  ('propriedade-privada', 'Propriedade Privada', 250),
  ('propriedade-intelectual', 'Propriedade intelectual', 260),
  ('agronegocio', 'Agronegócio', 270),
  ('trabalhismo', 'Trabalhismo', 280)
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
  ('saude', 'aborto', 'Aborto', 10),
  ('saude', 'eutanasia', 'Eutanásia', 20),
  ('saude', 'sistema-publico-de-saude', 'Sistema Público de Saúde', 30),
  ('saude', 'vacinas', 'Vacinas', 40),
  ('educacao', 'homeschooling', 'Homeschooling', 10),
  ('educacao', 'universidades', 'Universidades', 20),
  ('seguranca', 'crime-organizado', 'Crime organizado', 10),
  ('lgbtq', 'linguagem-neutra', 'Linguagem neutra', 10),
  ('lgbtq', 'casamento-homoafetivo', 'Casamento homoafetivo', 20),
  ('lgbtq', 'adocao-lgbtq', 'Adoção por casais LGBTQ+', 30),
  ('lgbtq', 'mulheres-trans-esportes', 'Mulheres trans nos esportes', 40),
  ('lgbtq', 'banheiro-lgbtq', 'Banheiro LGBTQ+', 50),
  ('justica', 'sistema-prisional', 'Sistema prisional', 10),
  ('justica', 'pena-de-morte', 'Pena de morte', 20),
  ('ambientalismo', 'mudancas-climaticas', 'Mudanças climáticas', 10),
  ('acoes-afirmativas', 'cotas-raciais', 'Cotas raciais', 10),
  ('liberdade-economica', 'protecionismo', 'Protecionismo', 10),
  ('liberdade-economica', 'regulacoes', 'Regulações', 20),
  ('liberdade-economica', 'impostos', 'Impostos', 30),
  ('nacionalismo', 'soberania', 'Soberania', 10),
  ('liberdade-religiosa', 'laicidade-do-estado', 'Laicidade do estado', 10),
  ('liberdade-de-expressao', 'desinformacao', 'Desinformação', 10),
  ('liberdade-de-expressao', 'crimes-contra-a-honra', 'Crimes contra a honra', 20),
  ('propriedade-privada', 'reforma-agraria', 'Reforma agrária', 10),
  ('propriedade-intelectual', 'patentes', 'Patentes', 10),
  ('propriedade-intelectual', 'pirataria', 'Pirataria', 20)
) AS v(parent_slug, slug, name, sort_order)
  ON parent.slug = v.parent_slug
WHERE g.slug = 'politica/ideologias'
  AND g.country_code = 'br'
ON CONFLICT DO NOTHING;
