ALTER TABLE public.service_times
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS recurring boolean NOT NULL DEFAULT true;