-- Allow users to read their own votes so the UI can show active like/dislike state.
CREATE POLICY "Allow authenticated users to read their own votes"
ON public.votes
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
