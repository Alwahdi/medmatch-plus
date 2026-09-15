DROP INDEX IF EXISTS public.facilities_user_id_key;
ALTER TABLE public.facilities ADD CONSTRAINT facilities_user_id_key UNIQUE (user_id);