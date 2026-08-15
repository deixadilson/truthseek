-- Soften desinformação proposition wording (quiz question 43).

UPDATE public.quiz_propositions qp
SET statement = 'O Estado/plataformas devem restringir conteúdos considerados desinformação.'
FROM public.issues i
JOIN public.groups hg
  ON hg.id = i.group_id
WHERE qp.issue_id = i.id
  AND i.slug = 'desinformacao'
  AND hg.slug = 'politica/ideologias'
  AND hg.country_code = 'br';
