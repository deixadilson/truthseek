-- Seed MetaGrupo TruthSeek Network as an open platform forum.

INSERT INTO public.taxons (name, level, parent_id, category_id)
SELECT 'TruthSeek Network', 0, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM public.taxons
  WHERE name = 'TruthSeek Network'
    AND parent_id IS NULL
);

INSERT INTO public.groups (
  name,
  slug,
  country_code,
  description,
  flag_path,
  is_open,
  hidden,
  has_subgroups,
  level,
  parent_group_id,
  category_group_id,
  taxon_id
)
SELECT
  'TruthSeek Network',
  'truthseek',
  'br',
  'Fórum da plataforma para discutir o funcionamento da rede, demandas, melhorias, regras de negócio, termos de serviço e apelação de moderação.',
  'truthseek.svg',
  true,
  false,
  false,
  0,
  NULL,
  NULL,
  t.id
FROM public.taxons t
WHERE t.name = 'TruthSeek Network'
  AND t.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.slug = 'truthseek'
      AND g.country_code = 'br'
  );
