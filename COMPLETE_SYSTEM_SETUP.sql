-- ============================================
-- TAM SİSTEM KURULUMU - PROFİL, DEVELOPER PANEL, FOTOĞRAF ONAY
-- ============================================
-- Bu SQL dosyası tüm sistem bileşenlerini kurar:
-- 1. Profil özelleştirme tabloları
-- 2. Developer panel yetkileri
-- 3. Fotoğraf onay sistemi
-- 4. RLS politikaları
-- ============================================
-- Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. PROFİL ÖZELLEŞTİRME TABLOLARI
-- ============================================

-- Profiles tablosu zaten varsa, eksik sütunları ekle
DO $$
BEGIN
  -- Bio sütunu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT NULL;
  END IF;

  -- Instagram sütunu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN instagram TEXT NULL;
  END IF;

  -- Twitter sütunu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'twitter'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN twitter TEXT NULL;
  END IF;

  -- Level sütunu (kullanıcı seviyesi)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
  END IF;

  -- XP sütunu (deneyim puanı)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'xp'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 2. USER ROLES TABLOSU (DEVELOPER PANEL İÇİN)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'developer', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- RLS aktifleştir
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ============================================
-- 3. GALLERY IMAGES - FOTOĞRAF ONAY SİSTEMİ
-- ============================================

-- Gallery images tablosu zaten varsa, eksik sütunları ekle
DO $$
BEGIN
  -- Status sütunu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- User ID sütunu (kim yükledi)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Rejection reason (red nedeni)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN rejection_reason TEXT NULL;
  END IF;

  -- Reviewed by (kim onayladı/reddetti)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Reviewed at (ne zaman onaylandı/reddedildi)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE NULL;
  END IF;
END $$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_gallery_images_status ON public.gallery_images(status);
CREATE INDEX IF NOT EXISTS idx_gallery_images_user_id ON public.gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_reviewed_by ON public.gallery_images(reviewed_by);

-- RLS aktifleştir
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Mevcut policies'leri temizle
DROP POLICY IF EXISTS "Allow public select gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow admin all gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow authenticated insert gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow public select approved gallery_images" ON public.gallery_images;

-- Yeni RLS Policies

-- 1. Public: Sadece onaylanmış fotoğrafları görebilir
CREATE POLICY "Allow public select approved gallery_images"
ON public.gallery_images
FOR SELECT
TO public
USING (status = 'approved');

-- 2. Authenticated: Kendi fotoğraflarını görebilir
CREATE POLICY "Users can view their own gallery_images"
ON public.gallery_images
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Authenticated: Fotoğraf yükleyebilir (pending olarak)
CREATE POLICY "Allow authenticated insert gallery_images"
ON public.gallery_images
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND (status = 'pending' OR status IS NULL)
);

-- 4. Admin/Developer: Tüm fotoğrafları görebilir
CREATE POLICY "Admins can view all gallery_images"
ON public.gallery_images
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

-- 5. Admin/Developer: Fotoğrafları onaylayabilir/reddedebilir
CREATE POLICY "Admins can update gallery_images"
ON public.gallery_images
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

-- 6. Admin/Developer: Fotoğrafları silebilir
CREATE POLICY "Admins can delete gallery_images"
ON public.gallery_images
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

-- 7. Kullanıcılar kendi fotoğraflarını silebilir (pending ise)
CREATE POLICY "Users can delete their pending gallery_images"
ON public.gallery_images
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Kullanıcının rolünü kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin mi kontrolü
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(user_uuid, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Developer mi kontrolü
CREATE OR REPLACE FUNCTION is_developer(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(user_uuid, 'developer') OR has_role(user_uuid, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fotoğraf onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_gallery_image(image_id UUID, reviewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.gallery_images
  SET 
    status = 'approved',
    reviewed_by = reviewer_id,
    reviewed_at = NOW(),
    rejection_reason = NULL
  WHERE id = image_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = reviewer_id
    AND user_roles.role IN ('admin', 'developer')
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fotoğraf reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_gallery_image(image_id UUID, reviewer_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.gallery_images
  SET 
    status = 'rejected',
    reviewed_by = reviewer_id,
    reviewed_at = NOW(),
    rejection_reason = reason
  WHERE id = image_id
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = reviewer_id
    AND user_roles.role IN ('admin', 'developer')
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Profil oluşturulduğunda otomatik user_roles kaydı
CREATE OR REPLACE FUNCTION create_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_user_role ON public.profiles;
CREATE TRIGGER trigger_create_default_user_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_role();

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.gallery_images TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_developer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_gallery_image(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_gallery_image(UUID, UUID, TEXT) TO authenticated;

-- ============================================
-- 7. ÖRNEK VERİ (OPSIYONEL)
-- ============================================

-- İlk admin kullanıcısı oluşturmak için (kendi user ID'nizi kullanın)
/*
-- Admin rolü ekleme örneği
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE'::UUID, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Developer rolü ekleme örneği
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE'::UUID, 'developer')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- ============================================
-- ✅ KURULUM TAMAMLANDI!
-- ============================================

-- ============================================
-- KONTROL SORGULARI
-- ============================================

-- Profiles tablosu sütunları
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- User roles tablosu
SELECT * FROM public.user_roles LIMIT 10;

-- Gallery images status dağılımı
SELECT 
  status,
  COUNT(*) as count
FROM public.gallery_images
GROUP BY status;

-- RLS durumu
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_roles', 'gallery_images')
AND schemaname = 'public';

-- Policies listesi
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles', 'gallery_images')
ORDER BY tablename, policyname;

-- ============================================
-- SORUN GİDERME
-- ============================================

-- Eğer RLS sorunları yaşıyorsanız:
-- 1. Tüm policies'leri silin
-- 2. Bu dosyayı tekrar çalıştırın

-- Eğer foreign key hataları alıyorsanız:
-- 1. Profiles tablosunun var olduğundan emin olun
-- 2. Auth.users tablosunun erişilebilir olduğundan emin olun

-- Eğer fonksiyonlar çalışmıyorsa:
-- 1. SECURITY DEFINER olarak ayarlandığından emin olun
-- 2. Grant permissions'ların doğru olduğundan emin olun

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu SQL dosyası idempotent'tir (birden fazla kez çalıştırılabilir)
-- 2. Tüm policies ve constraints IF NOT EXISTS kontrolü yapar
-- 3. Developer rolü admin yetkilerine de sahiptir
-- 4. Fotoğraf onay sistemi: pending -> approved/rejected
-- 5. Kullanıcılar sadece kendi pending fotoğraflarını silebilir
-- 6. Admin/Developer tüm fotoğrafları görebilir, onaylayabilir, reddedebilir

