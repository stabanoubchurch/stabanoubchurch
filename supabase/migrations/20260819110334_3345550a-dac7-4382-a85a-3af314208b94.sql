ALTER TABLE public.events ADD CONSTRAINT events_category_check
  CHECK (category = ANY (ARRAY[
    'liturgies'::text,
    'youth_bible_study'::text,
    'sunday_school'::text,
    'other_services'::text,
    'feasts_fasts'::text,
    'church_events'::text
  ]));