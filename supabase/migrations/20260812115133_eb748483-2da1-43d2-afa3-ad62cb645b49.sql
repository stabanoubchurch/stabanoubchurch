INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN ('20veronia03@gmail.com', 'veronia.abdelseed@cqumail.com')
ON CONFLICT (user_id, role) DO NOTHING;