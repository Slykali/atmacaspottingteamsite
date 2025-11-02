-- ============================================
-- UÇAKTAN UÇAĞA MESAJLAŞMA TABLOSU
-- ============================================
-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- Messages tablosu oluştur
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key constraints ekle (profiles tablosuna)
-- Not: Auth.users yerine profiles kullanıyoruz çünkü RLS daha kolay
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

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- updated_at için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON public.messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS'yi aktifleştir
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Kullanıcılar kendi gönderdikleri mesajları görebilir
CREATE POLICY "Users can view their sent messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id);

-- 2. Kullanıcılar kendilerine gelen mesajları görebilir
CREATE POLICY "Users can view their received messages"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = receiver_id);

-- 3. Kullanıcılar mesaj gönderebilir
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- 4. Kullanıcılar kendilerine gelen mesajları okuyabilir (read güncelleme)
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 5. Public (anonim) hiçbir şey yapamaz
-- (Yukarıdaki policies zaten authenticated için, otomatik olarak anon'a izin vermez)

-- 5. Realtime'ı aktifleştir (gerçek zamanlı mesajlaşma için)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ✅ TAMAMLANDI!

-- Kontrol için:
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages' 
AND schemaname = 'public';

SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'messages';

-- Realtime kontrolü:
SELECT * FROM pg_publication_tables WHERE tablename = 'messages';

