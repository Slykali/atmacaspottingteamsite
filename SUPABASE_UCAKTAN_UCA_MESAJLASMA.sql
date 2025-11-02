-- ============================================
-- UÇAKTAN UÇAĞA MESAJLAŞMA SİSTEMİ
-- ============================================
-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- 1. Messages tablosu oluştur
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Foreign key constraints ekle (profiles tablosuna)
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
END $$;

-- 3. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id);

-- 4. updated_at için trigger
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

-- 5. RLS'yi aktifleştir
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies oluştur

-- 6.1. Kullanıcılar kendi gönderdikleri mesajları görebilir
DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;
CREATE POLICY "Users can view their sent messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

-- 6.2. Kullanıcılar kendilerine gelen mesajları görebilir
DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;
CREATE POLICY "Users can view their received messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = receiver_id);

-- 6.3. Kullanıcılar mesaj gönderebilir
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 6.4. Kullanıcılar kendilerine gelen mesajları okuyabilir (read güncelleme)
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 7. Realtime'ı aktifleştir (gerçek zamanlı mesajlaşma için)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ✅ TAMAMLANDI!

-- ============================================
-- KONTROL SORGULARI
-- ============================================

-- Tablo oluşturuldu mu?
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages' 
AND schemaname = 'public';

-- Policies var mı?
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'messages';

-- Realtime aktif mi?
SELECT * FROM pg_publication_tables WHERE tablename = 'messages';

-- Index'ler var mı?
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'messages' 
AND schemaname = 'public';

