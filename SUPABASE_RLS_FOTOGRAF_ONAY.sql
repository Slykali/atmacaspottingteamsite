-- ============================================
-- FOTOGRAF ONAY SİSTEMİ İÇİN RLS POLİTİKALARI
-- ============================================
-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- Gallery Images için RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Mevcut policies'i temizle
DROP POLICY IF EXISTS "Allow public select gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow admin all gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow authenticated insert gallery_images" ON public.gallery_images;

-- 1. Public: Sadece onaylanmış fotoğrafları görebilir
CREATE POLICY "Allow public select approved gallery_images"
ON public.gallery_images
FOR SELECT
TO public
USING (status = 'approved');

-- 2. Authenticated: Herkes pending ekleyebilir (onay beklemeli)
CREATE POLICY "Allow authenticated insert gallery_images"
ON public.gallery_images
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Admin/Developer: Tüm işlemleri yapabilir (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin all gallery_images"
ON public.gallery_images
FOR ALL
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

-- ✅ TAMAMLANDI!
-- Artık:
-- - Normal kullanıcılar pending ekler
-- - Admin/Developer approved ekler veya onay verir
-- - Public sadece approved görür

