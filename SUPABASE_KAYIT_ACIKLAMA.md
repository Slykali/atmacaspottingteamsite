# 📋 SUPABASE KAYIT SQL KOMUTLARI - AÇIKLAMA

## 🚀 HIZLI BAŞLANGIÇ

### Yöntem 1: Sadece RLS Politikaları (Önerilen)

**Dosya:** `SUPABASE_HIZLI_KAYIT.sql`

1. Supabase Dashboard → SQL Editor
2. `SUPABASE_HIZLI_KAYIT.sql` içindeki SQL'i çalıştırın
3. Admin panelinden kayıt ekleyin:
   - Admin Panel → Galeri → Yeni Resim
   - Admin Panel → Ekip Üyeleri → Yeni Üye

✅ **Bu yöntem daha güvenli ve kolay!**

---

### Yöntem 2: Manuel SQL ile Kayıt

**Dosya:** `SUPABASE_KAYIT_SQL_KOMPLE.sql`

1. Önce RLS politikalarını çalıştırın
2. Sonra örnek kayıtları düzenleyin
3. Fotoğraf URL'lerini ekleyin
4. Çalıştırın

---

## 📝 ADIM ADIM AÇIKLAMA

### ADIM 1: RLS Politikalarını Oluşturun

RLS (Row Level Security) politikaları, Supabase'de hangi kullanıcıların hangi işlemleri yapabileceğini belirler.

**Çalıştırılacak:**
- `SUPABASE_HIZLI_KAYIT.sql` (en kolay)

**Ne yapar:**
- Suggestions: Anonim kullanıcılar form gönderebilir
- Gallery Images: Public görüntüleyebilir, Admin ekleyebilir
- Team Members: Public görüntüleyebilir, Admin yönetebilir

---

### ADIM 2: Fotoğrafları Yükleyin

**Seçenek A: Admin Panelden (Önerilen)**
1. Admin Panel → Galeri
2. "Yeni Resim" butonuna tıklayın
3. Fotoğrafı seçin ve bilgileri doldurun
4. Kaydet

**Seçenek B: Supabase Storage**
1. Supabase Dashboard → Storage
2. `gallery` bucket'ına fotoğraf yükleyin
3. Public URL'i kopyalayın
4. SQL'de kullanın

---

### ADIM 3: Ekip Üyelerini Ekleyin

**Seçenek A: Admin Panelden (Önerilen)**
1. Admin Panel → Ekip Üyeleri
2. "Yeni Üye" butonuna tıklayın
3. Bilgileri doldurun
4. Kaydet

**Seçenek B: SQL ile**
1. `SUPABASE_KAYIT_SQL_KOMPLE.sql` içindeki örnekleri düzenleyin
2. SQL Editor'da çalıştırın

---

## 🔧 SQL DEĞİŞKENLERİ

### Team Members için:
```sql
INSERT INTO public.team_members (name, role, bio, instagram, photo, created_at)
VALUES 
  ('Ad Soyad', 'Rol', 'Biyografi', '@instagram', 'photo_url', NOW());
```

**Alanlar:**
- `name`: Ad Soyad (zorunlu)
- `role`: Rol (örn: "Aktif Spotter")
- `bio`: Biyografi (zorunlu)
- `instagram`: Instagram hesabı (@ile başlar)
- `photo`: Fotoğraf URL'i (Supabase Storage)
- `created_at`: Otomatik (NOW())

---

### Gallery Images için:
```sql
INSERT INTO public.gallery_images (
  src, alt, tags, location, date, photographer, status, likes_count, views
)
VALUES 
  (
    'https://...supabase.co/storage/v1/object/public/gallery/dosya.jpg',
    'Açıklama',
    ARRAY['tag1', 'tag2'],
    'Lokasyon',
    '2024-01-15',
    'Fotoğrafçı',
    'approved',
    0,
    0
  );
```

**Alanlar:**
- `src`: Fotoğraf URL'i (Supabase Storage)
- `alt`: Açıklama
- `tags`: Etiketler (ARRAY)
- `location`: Lokasyon
- `date`: Tarih (YYYY-MM-DD)
- `photographer`: Fotoğrafçı
- `status`: 'approved' (onaylı)
- `likes_count`: 0 (başlangıç)
- `views`: 0 (başlangıç)

---

## ✅ KONTROL SORGULARI

### Policies kontrolü:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('suggestions', 'gallery_images', 'team_members');
```

### Kayıt kontrolü:
```sql
-- Team Members sayısı
SELECT COUNT(*) FROM public.team_members;

-- Gallery Images sayısı
SELECT COUNT(*) FROM public.gallery_images WHERE status = 'approved';
```

---

## 🎯 ÖNERİLEN YÖNTEM

**EN KOLAY:**
1. `SUPABASE_HIZLI_KAYIT.sql` çalıştırın
2. Admin panelinden kayıt ekleyin
3. ✅ Tamam!

**Neden?**
- Daha güvenli
- Fotoğraflar otomatik yüklenir
- Hata yapma riski azalır
- Görsel arayüz kullanılır

---

## 📞 SORUN GİDERME

### RLS hatası alıyorsanız:
- RLS politikalarını çalıştırdığınızdan emin olun
- `SUPABASE_HIZLI_KAYIT.sql` içindeki tüm komutları çalıştırın

### Fotoğraf yüklenmiyor:
- Supabase Storage → `gallery` bucket'ı var mı kontrol edin
- Bucket public mi kontrol edin
- Admin panelinden yüklemeyi deneyin

### Kayıt eklenmiyor:
- Browser console'u açın (F12)
- Hata mesajlarını kontrol edin
- SQL hatalarını Supabase dashboard'da kontrol edin

---

## 🚀 HEMEN BAŞLA!

1. **`SUPABASE_HIZLI_KAYIT.sql`** dosyasını açın
2. SQL'i kopyalayın
3. Supabase Dashboard → SQL Editor → Yapıştırın
4. **RUN** butonuna tıklayın
5. ✅ Başarı mesajını görün
6. Admin panelinden kayıt ekleyin!

