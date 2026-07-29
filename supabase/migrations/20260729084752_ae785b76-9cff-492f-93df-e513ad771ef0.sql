DROP POLICY "Anyone can react to published posts" ON public.spotlight_reactions;
DROP POLICY "Anyone can remove a reaction" ON public.spotlight_reactions;
REVOKE INSERT, DELETE ON public.spotlight_reactions FROM anon;
REVOKE INSERT, DELETE ON public.spotlight_reactions FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;