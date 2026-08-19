UPDATE public.events
SET category = CASE
  WHEN category IN ('bible_study', 'youth_meetings') THEN 'youth_bible_study'
  WHEN category IN ('feasts', 'fasts') THEN 'feasts_fasts'
  ELSE category
END
WHERE category IN ('bible_study', 'youth_meetings', 'feasts', 'fasts');