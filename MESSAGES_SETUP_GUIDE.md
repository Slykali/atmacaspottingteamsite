# 📨 Mesajlaşma Sistemi Kurulum Rehberi

## 🚀 Hızlı Kurulum

1. **Supabase Dashboard'a gidin**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'ı açın**
   - Sol menüden "SQL Editor" seçin
   - "New query" butonuna tıklayın

3. **SQL dosyasını çalıştırın**
   - `MESSAGES_COMPLETE_SETUP.sql` dosyasının içeriğini kopyalayın
   - SQL Editor'a yapıştırın
   - "Run" butonuna tıklayın

4. **Kontrol edin**
   - SQL dosyasının sonundaki kontrol sorgularını çalıştırın
   - Her şeyin doğru kurulduğundan emin olun

## 📋 Dosya İçeriği

`MESSAGES_COMPLETE_SETUP.sql` dosyası şunları içerir:

### ✅ Tablo Oluşturma
- `messages` tablosu
- Tüm gerekli sütunlar (id, sender_id, receiver_id, message, read, reply_to_id, created_at, updated_at)

### ✅ Foreign Keys
- `sender_id` → `profiles.id`
- `receiver_id` → `profiles.id`
- `reply_to_id` → `messages.id` (self-reference)

### ✅ Index'ler
- Sender/Receiver index'leri
- Created_at index'i
- Conversation index'leri
- Read status index'i

### ✅ Row Level Security (RLS)
- SELECT: Kullanıcılar kendi mesajlarını görebilir
- INSERT: Kullanıcılar mesaj gönderebilir
- UPDATE: Kullanıcılar mesajları okuyabilir (read güncelleme)
- DELETE: Kullanıcılar kendi mesajlarını silebilir

### ✅ Realtime
- Supabase Realtime publication'a eklenir
- Gerçek zamanlı mesajlaşma için

### ✅ Helper Functions
- `get_unread_count()`: Okunmamış mesaj sayısı
- `get_conversations()`: Konuşma listesi

## 🔧 Özellikler

### Mesaj Gönderme
- Kullanıcılar birbirine mesaj gönderebilir
- Mesajlar otomatik olarak `created_at` ile işaretlenir

### Mesaj Yanıtlama
- `reply_to_id` ile mesajlara yanıt verilebilir
- Self-referencing foreign key ile güvenli

### Mesaj Silme
- Kullanıcılar sadece kendi gönderdikleri mesajları silebilir
- RLS policy ile korunur

### Okunma Durumu
- `read` boolean field ile mesaj okunma durumu takip edilir
- Alıcı mesajı okuduğunda `read = true` olur

### Gerçek Zamanlı Güncellemeler
- Supabase Realtime ile anlık mesaj bildirimleri
- Yeni mesajlar otomatik olarak görünür

## 🐛 Sorun Giderme

### RLS Hataları
Eğer "permission denied" hatası alıyorsanız:

```sql
-- Tüm policies'leri kontrol edin
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- Eğer policies yoksa, SQL dosyasını tekrar çalıştırın
```

### Foreign Key Hataları
Eğer foreign key hatası alıyorsanız:

```sql
-- Profiles tablosunun var olduğunu kontrol edin
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Foreign key'leri kontrol edin
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'messages' 
AND constraint_type = 'FOREIGN KEY';
```

### Realtime Çalışmıyor
Eğer gerçek zamanlı güncellemeler çalışmıyorsa:

```sql
-- Realtime publication'ı kontrol edin
SELECT * FROM pg_publication_tables WHERE tablename = 'messages';

-- Eğer yoksa manuel ekleyin
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### Tablo Zaten Var
SQL dosyası idempotent'tir (birden fazla kez çalıştırılabilir). 
Eğer tablo zaten varsa, sadece eksik sütunlar ve policies eklenir.

## 📊 Kontrol Sorguları

### Tablo Yapısı
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages';
```

### RLS Durumu
```sql
SELECT tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';
```

### Policies
```sql
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'messages';
```

### Test Mesajı
```sql
-- Kendi user ID'lerinizi kullanın
INSERT INTO public.messages (sender_id, receiver_id, message)
VALUES (
  'USER_ID_1'::UUID,
  'USER_ID_2'::UUID,
  'Test mesajı'
);
```

## 🔒 Güvenlik

- ✅ RLS aktif
- ✅ Kullanıcılar sadece kendi mesajlarını görebilir
- ✅ Kullanıcılar sadece kendi mesajlarını silebilir
- ✅ Foreign key constraints ile veri bütünlüğü
- ✅ Helper functions SECURITY DEFINER ile korunur

## 📝 Notlar

1. **Profiles Tablosu Gerekli**: Messages tablosu `profiles` tablosuna bağlıdır
2. **Auth Required**: Tüm işlemler için authenticated kullanıcı gerekir
3. **Idempotent**: SQL dosyası birden fazla kez çalıştırılabilir
4. **Self-Reference**: `reply_to_id` kendi tablosuna referans verir

## 🎯 Sonraki Adımlar

1. SQL dosyasını çalıştırın
2. Kontrol sorgularını çalıştırın
3. Test mesajı gönderin
4. Frontend'de mesajlaşma özelliğini test edin

## 💡 İpuçları

- İlk kurulumdan sonra types.ts dosyasını yeniden generate edin
- Realtime subscription'ları test edin
- RLS policies'lerin doğru çalıştığından emin olun
- Index'lerin performansı artırdığını kontrol edin

---

**Sorun mu yaşıyorsunuz?** SQL dosyasının sonundaki sorun giderme bölümüne bakın!

