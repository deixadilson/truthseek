
INSERT INTO public.premise_oppositions (premise_id_a, premise_id_b)
SELECT DISTINCT LEAST(p1.id, p2.id), GREATEST(p1.id, p2.id)
FROM public.premises p1
JOIN public.premises p2
  ON p1.axis_key IS NOT NULL
 AND p1.axis_key = p2.axis_key
 AND p1.id < p2.id
JOIN public.groups g1 ON g1.id = p1.group_id
JOIN public.groups g2 ON g2.id = p2.group_id
JOIN public.group_oppositions go
  ON go.group_id_a = LEAST(g1.id, g2.id)
 AND go.group_id_b = GREATEST(g1.id, g2.id)
ON CONFLICT DO NOTHING;

INSERT INTO public.premise_oppositions (premise_id_a, premise_id_b)
SELECT DISTINCT LEAST(p1.id, p2.id), GREATEST(p1.id, p2.id)
FROM public.premises p1
JOIN public.premises p2
  ON p1.axis_key IS NOT NULL
 AND p1.axis_key = p2.axis_key
 AND p1.id < p2.id
JOIN public.groups g1 ON g1.id = p1.group_id
JOIN public.groups g2 ON g2.id = p2.group_id
WHERE g1.parent_group_id IS NOT NULL
  AND g1.parent_group_id = g2.parent_group_id
  AND g1.slug LIKE 'saude/dietas/%'
  AND g2.slug LIKE 'saude/dietas/%'
ON CONFLICT DO NOTHING;
