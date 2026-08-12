ALTER TABLE public.events
  ADD COLUMN recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN repeat_until date;