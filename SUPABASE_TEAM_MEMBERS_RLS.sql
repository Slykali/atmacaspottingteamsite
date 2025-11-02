-- ============================================
-- TEAM MEMBERS RLS POLİTİKALARI
-- ============================================
-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- Team Members tablosu için RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- TÜM mevcut policies'i temizle (hatayı önlemek için)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'team_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.team_members';
        RAISE NOTICE 'Silindi: %', r.policyname;
    END LOOP;
END $$;

-- 1. Public: Herkes team_members'i görebilir (liste için)
CREATE POLICY "Allow public select team_members"
ON public.team_members
FOR SELECT
TO public
USING (true);

-- 2. Authenticated: INSERT yapabilir (admin panelinden)
CREATE POLICY "Allow authenticated insert team_members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Admin/Developer: UPDATE yapabilir
CREATE POLICY "Allow admin update team_members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

-- 4. Admin/Developer: DELETE yapabilir
CREATE POLICY "Allow admin delete team_members"
ON public.team_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

-- ✅ TAMAMLANDI!
-- Kontrol için:
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'team_members';

-- ✅ TAMAMLANDI!
-- Artık:
-- - Public (herkes) team_members'i görebilir
-- - Authenticated kullanıcılar INSERT yapabilir (admin panelinden)
-- - Admin/Developer UPDATE ve DELETE yapabilir

