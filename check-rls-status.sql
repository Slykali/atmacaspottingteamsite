-- ============================================
-- RLS DURUMU KONTROLÜ
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- ============================================

-- 1. RLS aktif mi?
SELECT 
  tablename,
  rowsecurity AS "RLS Aktif mi?"
FROM pg_tables 
WHERE tablename = 'suggestions' 
AND schemaname = 'public';

-- 2. Mevcut policies neler?
SELECT 
  policyname AS "Policy Adı",
  roles AS "Roller",
  cmd AS "Komut (INSERT/SELECT/DELETE)",
  with_check AS "With Check",
  qual AS "Using"
FROM pg_policies 
WHERE tablename = 'suggestions';

-- 3. INSERT policy var mı?
SELECT 
  policyname AS "Policy Adı",
  roles AS "Roller",
  cmd AS "Komut"
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';

-- 4. anon role için INSERT policy var mı?
SELECT 
  policyname AS "Policy Adı",
  roles AS "Roller",
  cmd AS "Komut",
  with_check AS "With Check"
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT'
AND 'anon' = ANY(roles);

