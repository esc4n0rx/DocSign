ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS password TEXT;

UPDATE public.usuarios
  SET password = '$scrypt$10$6d91d04840bc39ee61b22f3cc0a79860$52d22fa7f3892e3610ff8d27168f436fb06156f6a4dd961964f69c3cf9f6bcf0'
  WHERE password IS NULL;

ALTER TABLE public.usuarios
  ALTER COLUMN password SET NOT NULL;
