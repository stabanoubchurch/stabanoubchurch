CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Admins can view roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- PRIESTS
CREATE TABLE public.priests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  photo_url text,
  email text,
  phone text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.priests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.priests TO authenticated;
GRANT ALL ON public.priests TO service_role;
ALTER TABLE public.priests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published priests" ON public.priests FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "Admins manage priests" ON public.priests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER priests_updated_at BEFORE UPDATE ON public.priests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published events" ON public.events FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX events_date_idx ON public.events (event_date);

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published services" ON public.services FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SERVICE TIMES
CREATE TABLE public.service_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL DEFAULT 0,
  start_time time NOT NULL,
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_times TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_times TO authenticated;
GRANT ALL ON public.service_times TO service_role;
ALTER TABLE public.service_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view times of published services" ON public.service_times FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.published));
CREATE POLICY "Admins manage service times" ON public.service_times FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SPOTLIGHT POSTS
CREATE TABLE public.spotlight_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  image_url text,
  service_name text,
  posted_on date NOT NULL DEFAULT current_date,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.spotlight_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spotlight_posts TO authenticated;
GRANT ALL ON public.spotlight_posts TO service_role;
ALTER TABLE public.spotlight_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published posts" ON public.spotlight_posts FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "Admins manage posts" ON public.spotlight_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER spotlight_posts_updated_at BEFORE UPDATE ON public.spotlight_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SPOTLIGHT REACTIONS
CREATE TABLE public.spotlight_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.spotlight_posts(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('heart', 'thumbsup')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.spotlight_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.spotlight_reactions TO authenticated;
GRANT ALL ON public.spotlight_reactions TO service_role;
ALTER TABLE public.spotlight_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON public.spotlight_reactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can react to published posts" ON public.spotlight_reactions FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.spotlight_posts p WHERE p.id = post_id AND p.published));
CREATE POLICY "Anyone can remove a reaction" ON public.spotlight_reactions FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX spotlight_reactions_post_idx ON public.spotlight_reactions (post_id);