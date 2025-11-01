-- ============================================
-- RLS TAM ÇÖZÜM - TÜM ADIMLAR
-- Bu SQL'i Supabase SQL Editor'da ÇALIŞTIRIN
-- ============================================

BEGIN;

-- ADIM 1: Mevcut policies'i temizle
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'suggestions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.suggestions';
        RAISE NOTICE 'Silindi: %', r.policyname;
    END LOOP;
END $$;

-- ADIM 2: RLS'yi aktifleştir
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- ADIM 3: Anonim kullanıcılar için INSERT policy oluştur
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- ADIM 4: Kontrol - Policy oluşturuldu mu?
SELECT 
  policyname AS "✅ Policy Adı",
  roles AS "✅ Roller",
  cmd AS "✅ Komut",
  with_check AS "✅ With Check"
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';

COMMIT;

-- ============================================
-- SONUÇ: Yukarıdaki SELECT sorgusu size 
-- policy'nin başarıyla oluşturulduğunu gösterecek
-- ============================================

