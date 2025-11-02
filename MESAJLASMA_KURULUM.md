# ✈️ Uçaktan Uçağa Mesajlaşma Sistemi - Kurulum Rehberi

## 🎯 Özellikler

- ✅ Küçük, floating chat widget (sağ alt köşede)
- ✅ Uçak ikonu ile havacılık teması
- ✅ Gerçek zamanlı mesajlaşma (Supabase Realtime)
- ✅ Okunmamış mesaj sayacı
- ✅ Kullanıcı seçimi ve mesaj geçmişi
- ✅ Profil fotoğrafları ve isimler

---

## 📋 KURULUM ADIMLARI

### 1. Supabase'de Tablo Oluşturun

**Supabase Dashboard → SQL Editor**

`SUPABASE_MESSAGES_TABLE.sql` dosyasındaki SQL'i çalıştırın:

```sql
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

-- Foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey') THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_fkey') THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- updated_at trigger
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

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their sent messages"
ON public.messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their received messages"
ON public.messages FOR SELECT TO authenticated
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);
```

### 2. Supabase Realtime'ı Aktifleştirin

**Supabase Dashboard → Database → Replication**

- `messages` tablosunu bulun
- Replication'ı **ON** yapın

VEYA SQL ile:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

---

## ✅ KONTROL

### Tablo oluşturuldu mu?
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'messages';
```

### Policies var mı?
```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### Realtime aktif mi?
```sql
SELECT * FROM pg_publication_tables WHERE tablename = 'messages';
```

---

## 🎨 KULLANIM

### Kullanıcılar için:
1. Sağ alt köşedeki **uçak ikonu** butonuna tıklayın
2. Mesajlaşmak istediğiniz kullanıcıyı seçin
3. Mesajınızı yazın ve gönderin
4. Mesajlar gerçek zamanlı olarak görünür

### Özellikler:
- ✅ Okunmamış mesaj sayacı (kırmızı badge)
- ✅ Gerçek zamanlı mesajlaşma
- ✅ Mesaj geçmişi
- ✅ Kullanıcı listesi
- ✅ Minimize/maksimize
- ✅ Otomatik scroll (en son mesaja)

---

## 🐛 SORUN GİDERME

### Mesajlar görünmüyor:
1. Console'u kontrol edin (F12)
2. RLS politikalarını kontrol edin
3. Kullanıcının giriş yaptığından emin olun

### Realtime çalışmıyor:
1. Supabase Dashboard → Database → Replication
2. `messages` tablosunda Replication'ı kontrol edin
3. Publication'ı kontrol edin: `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`

### Foreign key hatası:
- `profiles` tablosunda kullanıcıların olup olmadığını kontrol edin
- Mesaj gönderirken `sender_id` ve `receiver_id` geçerli UUID olmalı

---

## 📝 NOTLAR

- Widget sadece giriş yapmış kullanıcılara gösterilir
- Mesajlar 100 adet ile sınırlıdır (performans için)
- Okunmamış mesajlar otomatik olarak işaretlenir
- Mesajlar gerçek zamanlı olarak güncellenir

---

## 🚀 HAZIR!

Artık sitenizde küçük bir mesajlaşma sistemi var! ✈️

