-- Remove unnecessary parentheses from universidades quiz proposition (question 27).

UPDATE public.quiz_propositions qp
SET statement = 'Ensino superior público gratuito ou fortemente subsidiado deve ser ampliado e priorizado.'
FROM public.issues i
JOIN public.groups hg
  ON hg.id = i.group_id
WHERE qp.issue_id = i.id
  AND i.slug = 'universidades'
  AND hg.slug = 'politica/ideologias'
  AND hg.country_code = 'br';
