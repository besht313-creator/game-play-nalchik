
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text,
  stickers text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.games TO anon, authenticated;
GRANT ALL ON public.games TO service_role;

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are publicly viewable"
  ON public.games FOR SELECT
  USING (true);

CREATE INDEX games_position_idx ON public.games (position);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER games_set_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
