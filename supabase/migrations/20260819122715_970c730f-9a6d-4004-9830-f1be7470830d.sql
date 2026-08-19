ALTER TABLE public.spotlight_posts ADD COLUMN IF NOT EXISTS scheduled_for date;

DROP POLICY IF EXISTS "Public can view published posts" ON public.spotlight_posts;
CREATE POLICY "Public can view published posts" ON public.spotlight_posts
FOR SELECT TO anon, authenticated
USING (published AND (scheduled_for IS NULL OR scheduled_for <= CURRENT_DATE));