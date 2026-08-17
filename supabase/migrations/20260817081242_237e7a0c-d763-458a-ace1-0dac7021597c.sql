ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other_services';

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE public.events ADD CONSTRAINT events_category_check CHECK (
  category IN ('liturgies','bible_study','sunday_school','youth_meetings','other_services','church_events','feasts','fasts')
);