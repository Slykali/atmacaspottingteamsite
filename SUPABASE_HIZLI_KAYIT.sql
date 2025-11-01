-- ============================================
-- HIZLI KAYIT SQL - Sadece RLS Politikaları
-- ============================================
-- Bu SQL'i önce çalıştırın, sonra admin panelinden kayıt ekleyin
-- ============================================

-- Suggestions için RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions FOR INSERT TO anon WITH CHECK (true);

-- Gallery Images için RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Gallery: Public okuma
DROP POLICY IF EXISTS "Allow public select gallery_images" ON public.gallery_images;
CREATE POLICY "Allow public select gallery_images"
ON public.gallery_images FOR SELECT TO public USING (status = 'approved');

-- Gallery: Admin işlemler
DROP POLICY IF EXISTS "Allow admin all gallery_images" ON public.gallery_images;
CREATE POLICY "Allow admin all gallery_images"
ON public.gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Team Members için RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team Members: Public okuma
DROP POLICY IF EXISTS "Allow public select team_members" ON public.team_members;
CREATE POLICY "Allow public select team_members"
ON public.team_members FOR SELECT TO public USING (true);

-- Team Members: Admin işlemler
DROP POLICY IF EXISTS "Allow admin all team_members" ON public.team_members;
CREATE POLICY "Allow admin all team_members"
ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ✅ TAMAMLANDI! Artık admin panelinden kayıt ekleyebilirsiniz!

