-- ============================================
-- Supabase RLS Policy Fix for suggestions table
-- ============================================
-- Bu SQL komutunu Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- 1. Önce RLS'nin aktif olduğundan emin olun
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- 2. Eğer varsa eski policy'yi silin (opsiyonel)
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

-- 3. Anonim kullanıcılar için INSERT policy oluşturun
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Kontrol için: Policy'nin oluşturulduğunu kontrol edin
SELECT * FROM pg_policies WHERE tablename = 'suggestions';

