-- ============================================
-- MESAJLAŞMA SİSTEMİ - TAM KURULUM
-- ============================================
-- Bu SQL dosyası mesajlaşma sisteminin tüm bileşenlerini kurar
-- Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. MESSAGES TABLOSU OLUŞTUR
-- ============================================

-- Önce tablo varsa sütunları kontrol et ve eksikleri ekle
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

-- ============================================
-- 2. FOREIGN KEY CONSTRAINTS
-- ============================================

-- Sender ve Receiver foreign keys (profiles tablosuna)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Reply to foreign key (kendi tablosuna - self reference)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_reply_to_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_reply_to_id_fkey 
    FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 3. INDEX'LER (PERFORMANS İÇİN)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Composite index for conversation queries (both directions)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_both ON public.messages(
  LEAST(sender_id, receiver_id), 
  GREATEST(sender_id, receiver_id), 
  created_at DESC
);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- updated_at için trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ı oluştur (varsa sil ve yeniden oluştur)
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON public.messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) AKTİFLEŞTİR
-- ============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- 6.1. SELECT: Kullanıcılar kendi gönderdikleri veya aldıkları mesajları görebilir
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

-- 6.2. INSERT: Kullanıcılar mesaj gönderebilir (sadece kendi sender_id ile)
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 6.3. UPDATE: Kullanıcılar kendilerine gelen mesajları okuyabilir (read güncelleme)
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 6.4. DELETE: Kullanıcılar sadece kendi gönderdikleri mesajları silebilir
DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.messages;
CREATE POLICY "Users can delete their sent messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- ============================================
-- 7. REALTIME PUBLICATION (GERÇEK ZAMANLI MESAJLAŞMA)
-- ============================================

-- Realtime'ı aktifleştir (hata verirse zaten ekli demektir)
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
-- 8. HELPER FUNCTIONS (OPSIYONEL - İYİLEŞTİRME İÇİN)
-- ============================================

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

-- Conversation list fonksiyonu (son mesajları getirir)
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
-- 9. GRANT PERMISSIONS
-- ============================================

-- Authenticated kullanıcılara gerekli izinleri ver
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversations(UUID) TO authenticated;

-- ============================================
-- ✅ KURULUM TAMAMLANDI!
-- ============================================

-- ============================================
-- KONTROL SORGULARI
-- ============================================

-- Tablo yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- RLS aktif mi?
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages' 
AND schemaname = 'public';

-- Policies listesi
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

-- Index'ler
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'messages' 
AND schemaname = 'public'
ORDER BY indexname;

-- Realtime aktif mi?
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE tablename = 'messages';

-- Foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'messages';

-- ============================================
-- TEST VERİSİ EKLEME (OPSIYONEL)
-- ============================================
-- Aşağıdaki kodu sadece test için kullanın
-- Gerçek kullanıcı ID'lerinizi kullanın

/*
-- Örnek test mesajı (kendi user ID'lerinizi kullanın)
INSERT INTO public.messages (sender_id, receiver_id, message)
VALUES (
  'YOUR_USER_ID_1'::UUID,
  'YOUR_USER_ID_2'::UUID,
  'Merhaba! Bu bir test mesajıdır.'
);

-- Reply test mesajı
INSERT INTO public.messages (sender_id, receiver_id, message, reply_to_id)
SELECT 
  'YOUR_USER_ID_2'::UUID,
  'YOUR_USER_ID_1'::UUID,
  'Merhaba! Nasılsın?',
  id
FROM public.messages
WHERE sender_id = 'YOUR_USER_ID_1'::UUID
LIMIT 1;
*/

-- ============================================
-- SORUN GİDERME
-- ============================================

-- Eğer RLS sorunları yaşıyorsanız:
-- 1. Tüm policies'leri sil:
-- DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
-- DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.messages;

-- 2. Sonra bu dosyayı tekrar çalıştırın

-- Eğer foreign key hataları alıyorsanız:
-- 1. Profiles tablosunun var olduğundan emin olun
-- 2. Auth.users tablosu yerine profiles kullanıldığından emin olun

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Bu SQL dosyası idempotent'tir (birden fazla kez çalıştırılabilir)
-- 2. Tüm policies ve constraints IF NOT EXISTS kontrolü yapar
-- 3. Realtime için supabase_realtime publication'ı kullanır
-- 4. Helper functions SECURITY DEFINER olarak ayarlanmıştır (güvenlik için)
-- 5. reply_to_id self-referencing foreign key ile mesaj yanıtlama destekler
-- 6. DELETE policy sadece gönderen kullanıcının kendi mesajlarını silmesine izin verir

