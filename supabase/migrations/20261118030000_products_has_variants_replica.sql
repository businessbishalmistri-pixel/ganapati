-- Products: record whether a product has variants, and send the full old row
-- on deletes so the realtime channel can report which product was removed.

ALTER TABLE public.products ADD COLUMN has_variants boolean NOT NULL DEFAULT false;

ALTER TABLE public.products REPLICA IDENTITY FULL;
