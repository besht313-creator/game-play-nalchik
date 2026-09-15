-- Поля для окна с подробностями игры: жанр, число игроков, короткое описание
-- и языки озвучки/интерфейса. Все поля необязательные — карточка, у которой
-- они не заполнены, просто не показывает соответствующий блок.
--
-- Допустимые значения (players 1/2/4, языки ru/en) проверяются на уровне
-- приложения в games.functions.ts: писать в таблицу может только админка.
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS genre text,
  ADD COLUMN IF NOT EXISTS players smallint,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS voice_lang text,
  ADD COLUMN IF NOT EXISTS ui_lang text;
