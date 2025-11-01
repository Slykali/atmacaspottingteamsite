-- ============================================
-- SUPABASE KAYIT İÇİN RLS POLICY OLUŞTURMA
-- ============================================
-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- 1. RLS'yi aktifleştir
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- 2. Eski policy'leri sil (varsa)
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "anon_insert_suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "public_suggestions_insert" ON public.suggestions;

-- 3. Anonim kullanıcılar için INSERT policy oluştur
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Kontrol - Policy oluşturuldu mu?
SELECT 
  policyname AS "Policy Adı",
  roles AS "Roller",
  cmd AS "Komut"
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';

-- ✅ BAŞARILI MESAJI GÖRECEKSİNİZ!

