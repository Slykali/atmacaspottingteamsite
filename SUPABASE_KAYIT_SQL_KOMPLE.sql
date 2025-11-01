-- ============================================
-- SUPABASE KAYIT SQL KOMUTLARI - KOMPLE
-- ============================================
-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. RLS POLİTİKALARI (ÖNCE BUNU ÇALIŞTIRIN)
-- ============================================

-- Suggestions tablosu için RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Gallery Images tablosu için RLS (Admin ve public için)
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Gallery Images: Public okuma
DROP POLICY IF EXISTS "Allow public select gallery_images" ON public.gallery_images;
CREATE POLICY "Allow public select gallery_images"
ON public.gallery_images
AS PERMISSIVE
FOR SELECT
TO public
USING (status = 'approved');

-- Gallery Images: Admin INSERT
DROP POLICY IF EXISTS "Allow admin insert gallery_images" ON public.gallery_images;
CREATE POLICY "Allow admin insert gallery_images"
ON public.gallery_images
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Gallery Images: Admin UPDATE/DELETE
DROP POLICY IF EXISTS "Allow admin update gallery_images" ON public.gallery_images;
CREATE POLICY "Allow admin update gallery_images"
ON public.gallery_images
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete gallery_images" ON public.gallery_images;
CREATE POLICY "Allow admin delete gallery_images"
ON public.gallery_images
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- Team Members tablosu için RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team Members: Public okuma
DROP POLICY IF EXISTS "Allow public select team_members" ON public.team_members;
CREATE POLICY "Allow public select team_members"
ON public.team_members
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Team Members: Admin INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Allow admin insert team_members" ON public.team_members;
CREATE POLICY "Allow admin insert team_members"
ON public.team_members
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update team_members" ON public.team_members;
CREATE POLICY "Allow admin update team_members"
ON public.team_members
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delete team_members" ON public.team_members;
CREATE POLICY "Allow admin delete team_members"
ON public.team_members
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 2. ÖRNEK TEAM MEMBERS (Aktif Spotterlar)
-- ============================================
-- NOT: Photo URL'lerini Supabase Storage'a yükledikten sonra ekleyin

INSERT INTO public.team_members (name, role, bio, instagram, photo, created_at)
VALUES 
  ('Örnek Spotter 1', 'Aktif Spotter', 'Havacılık tutkunu, Antalya havalimanında aktif spotting yapıyor.', '@ornek1', NULL, NOW()),
  ('Örnek Spotter 2', 'Aktif Spotter', 'Uçak fotoğrafları çekmeyi seven, İstanbul merkezli spotter.', '@ornek2', NULL, NOW()),
  ('Örnek Spotter 3', 'Aktif Spotter', 'Özel havacılık fotoğrafları ile tanınan aktif üye.', '@ornek3', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. ÖRNEK GALLERY IMAGES (Fotoğraflar)
-- ============================================
-- NOT: src URL'lerini Supabase Storage'a yükledikten sonra ekleyin
-- Fotoğrafları önce Supabase Storage -> gallery bucket'ına yükleyin
-- Sonra public URL'lerini buraya ekleyin

INSERT INTO public.gallery_images (
  src, 
  alt, 
  tags, 
  location, 
  date, 
  photographer, 
  status, 
  likes_count, 
  views,
  created_at
)
VALUES 
  (
    'https://jzolrxxewgmcoydiqrcw.supabase.co/storage/v1/object/public/gallery/gallery-1.jpg',
    'AJET AİRBUS A321 Sabiha-Antalya iniş',
    ARRAY['AJET', 'Airbus A321', 'İniş', 'Sabiha', 'Antalya'],
    'Antalya Havalimanı',
    '2024-01-15',
    'Atmaca Spotting Team',
    'approved',
    0,
    0,
    NOW()
  ),
  (
    'https://jzolrxxewgmcoydiqrcw.supabase.co/storage/v1/object/public/gallery/gallery-2.jpg',
    'THY 737 MAX İstanbul Havalimanı-Antalya iniş',
    ARRAY['THY', 'Boeing 737 MAX', 'İniş', 'İstanbul Havalimanı', 'Antalya'],
    'Antalya Havalimanı',
    '2024-02-20',
    'Atmaca Spotting Team',
    'approved',
    0,
    0,
    NOW()
  ),
  (
    'https://jzolrxxewgmcoydiqrcw.supabase.co/storage/v1/object/public/gallery/gallery-3.jpg',
    'Airbus A330 Londra-Antalya park alanı',
    ARRAY['Airbus A330', 'Park', 'Londra', 'Antalya'],
    'Antalya Havalimanı',
    '2024-03-10',
    'Atmaca Spotting Team',
    'approved',
    0,
    0,
    NOW()
  ),
  (
    'https://jzolrxxewgmcoydiqrcw.supabase.co/storage/v1/object/public/gallery/gallery-4.jpg',
    'IRAERO SU100 Moskova-Antalya iniş',
    ARRAY['IRAERO', 'SU100', 'İniş', 'Moskova', 'Antalya'],
    'Antalya Havalimanı',
    '2024-04-05',
    'Atmaca Spotting Team',
    'approved',
    0,
    0,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. KONTROL SORGULARI
-- ============================================

-- Policies kontrolü
SELECT 'Policies kontrolü' AS "Kontrol";
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('suggestions', 'gallery_images', 'team_members')
ORDER BY tablename, cmd;

-- Team Members kontrolü
SELECT 'Team Members Sayısı' AS "Kontrol", COUNT(*) AS "Toplam" FROM public.team_members;

-- Gallery Images kontrolü
SELECT 'Gallery Images Sayısı' AS "Kontrol", COUNT(*) AS "Toplam" FROM public.gallery_images;

-- ============================================
-- ✅ TAMAMLANDI!
-- ============================================

