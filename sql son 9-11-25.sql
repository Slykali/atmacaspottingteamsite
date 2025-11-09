-- ============================================
-- TAM SİSTEM KURULUMU - 9 KASIM 2025
-- ============================================
-- Bu SQL dosyası bugün yapılan TÜM değişiklikleri içerir:
-- 1. Mesajlaşma Sistemi (reply özelliği ile)
-- 2. Profil Özelleştirme
-- 3. Developer Panel Yetkileri
-- 4. Fotoğraf Onay Sistemi
-- 5. RLS Politikaları
-- 6. Helper Fonksiyonlar
-- ============================================
-- Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. MESAJLAŞMA SİSTEMİ (MESSAGES TABLOSU)
-- ============================================

-- Messages tablosu oluştur veya eksik sütunları ekle
DO $$
BEGIN
  -- Tablo yoksa oluştur
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    CREATE TABLE public.messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sender_id UUID NOT NULL,
      receiver_id UUID NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT false,
      reply_to_id UUID NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Tablo varsa eksik sütunları ekle
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'reply_to_id'
    ) THEN
      ALTER TABLE public.messages ADD COLUMN reply_to_id UUID NULL;
    END IF;
  END IF;
END $$;

-- Foreign Key Constraints
DO $$
BEGIN
  -- Sender foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Receiver foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Reply to foreign key (self-reference)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_reply_to_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_reply_to_id_fkey 
    FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_both ON public.messages(
  LEAST(sender_id, receiver_id), 
  GREATEST(sender_id, receiver_id), 
  created_at DESC
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON public.messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS aktifleştir
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;
CREATE POLICY "Users can view their sent messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;
CREATE POLICY "Users can view their received messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.messages;
CREATE POLICY "Users can delete their sent messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table messages already in supabase_realtime publication';
  END;
END $$;

-- ============================================
-- 2. PROFİL ÖZELLEŞTİRME
-- ============================================

-- Profiles tablosuna eksik sütunları ekle
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

  -- Level sütunu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1;
  END IF;

  -- XP sütunu
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
-- 3. USER ROLES TABLOSU (DEVELOPER PANEL İÇİN)
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
-- 4. GALLERY IMAGES - FOTOĞRAF ONAY SİSTEMİ
-- ============================================

-- Gallery images tablosuna eksik sütunları ekle
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

  -- User ID sütunu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Rejection reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN rejection_reason TEXT NULL;
  END IF;

  -- Reviewed by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_images' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Reviewed at
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
DROP POLICY IF EXISTS "Users can view their own gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can view all gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can update gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Admins can delete gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Users can delete their pending gallery_images" ON public.gallery_images;

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
-- 5. HELPER FUNCTIONS
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

-- Unread message count fonksiyonu
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.messages
    WHERE receiver_id = user_uuid
    AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversation list fonksiyonu
CREATE OR REPLACE FUNCTION get_conversations(user_uuid UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    SELECT DISTINCT
      CASE 
        WHEN m.sender_id = user_uuid THEN m.receiver_id
        ELSE m.sender_id
      END AS partner_id
    FROM public.messages m
    WHERE m.sender_id = user_uuid OR m.receiver_id = user_uuid
  ),
  last_messages AS (
    SELECT DISTINCT ON (cp.partner_id)
      cp.partner_id,
      m.message,
      m.created_at,
      m.read
    FROM conversation_partners cp
    LEFT JOIN LATERAL (
      SELECT message, created_at, read
      FROM public.messages
      WHERE (sender_id = user_uuid AND receiver_id = cp.partner_id)
         OR (sender_id = cp.partner_id AND receiver_id = user_uuid)
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
    ORDER BY cp.partner_id, m.created_at DESC NULLS LAST
  )
  SELECT 
    cp.partner_id,
    p.full_name::TEXT,
    p.avatar_url::TEXT,
    lm.message::TEXT,
    lm.created_at,
    COALESCE((
      SELECT COUNT(*)
      FROM public.messages
      WHERE sender_id = cp.partner_id
      AND receiver_id = user_uuid
      AND read = false
    ), 0)::BIGINT
  FROM conversation_partners cp
  LEFT JOIN public.profiles p ON p.id = cp.partner_id
  LEFT JOIN last_messages lm ON lm.partner_id = cp.partner_id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS
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
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.gallery_images TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_developer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_gallery_image(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_gallery_image(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversations(UUID) TO authenticated;

-- ============================================
-- ✅ KURULUM TAMAMLANDI!
-- ============================================

-- ============================================
-- KONTROL SORGULARI
-- ============================================

-- Messages tablosu kontrolü
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- Profiles sütunları kontrolü
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('bio', 'instagram', 'twitter', 'level', 'xp')
ORDER BY ordinal_position;

-- User roles kontrolü
SELECT COUNT(*) as total_roles FROM public.user_roles;

-- Gallery images status kontrolü
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
WHERE tablename IN ('messages', 'user_roles', 'gallery_images', 'profiles')
AND schemaname = 'public';

-- Policies listesi
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('messages', 'user_roles', 'gallery_images')
ORDER BY tablename, policyname;

-- Index'ler
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('messages', 'user_roles', 'gallery_images')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Fonksiyonlar
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'has_role',
  'is_admin',
  'is_developer',
  'approve_gallery_image',
  'reject_gallery_image',
  'get_unread_count',
  'get_conversations',
  'update_updated_at_column',
  'create_default_user_role'
)
ORDER BY routine_name;

-- ============================================
-- ÖRNEK VERİ EKLEME (OPSIYONEL)
-- ============================================

-- İlk admin kullanıcısı oluşturmak için:
-- 1. Kendi user ID'nizi alın (auth.users tablosundan)
-- 2. Aşağıdaki komutu çalıştırın:

/*
-- Admin rolü ekleme
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE'::UUID, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Developer rolü ekleme
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE'::UUID, 'developer')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- ============================================
-- SORUN GİDERME
-- ============================================

-- Eğer RLS sorunları yaşıyorsanız:
-- 1. Tüm policies'leri silin (DROP POLICY komutları)
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
-- 5. Mesajlaşma sistemi reply özelliği ile çalışır
-- 6. Profil özelleştirme: bio, instagram, twitter, level, xp
-- 7. Kullanıcılar sadece kendi pending fotoğraflarını silebilir
-- 8. Admin/Developer tüm fotoğrafları görebilir, onaylayabilir, reddedebilir

-- ============================================
-- ÖZET
-- ============================================
-- ✅ Messages tablosu (reply_to_id ile)
-- ✅ Profil özelleştirme sütunları
-- ✅ User roles tablosu
-- ✅ Gallery images fotoğraf onay sistemi
-- ✅ RLS politikaları
-- ✅ Helper fonksiyonlar
-- ✅ Triggers
-- ✅ Index'ler
-- ✅ Realtime support

