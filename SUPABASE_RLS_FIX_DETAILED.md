# Supabase RLS Politikası Kurulumu - Detaylı Rehber

## 🚨 HATA MESAJI
```
Erişim izni hatası: Lütfen Supabase RLS politikalarını kontrol edin. 
Anonim kullanıcıların suggestions tablosuna INSERT yapma izni olmalı.
```

## 📋 ADIM ADIM ÇÖZÜM

### YÖNTEM 1: SQL Editor ile (ÖNERİLEN - En Hızlı)

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenizi seçin (örn: `jzolrxxewgmcoydiqrcw`)

2. **SQL Editor'ı açın:**
   - Sol menüden **SQL Editor** seçin
   - **New query** butonuna tıklayın

3. **Aşağıdaki SQL'i kopyalayıp yapıştırın ve çalıştırın:**

```sql
-- ============================================
-- RLS Policy Fix for suggestions table
-- ============================================

-- 1. Mevcut politikaları kontrol et
SELECT * FROM pg_policies WHERE tablename = 'suggestions';

-- 2. RLS'yi aktifleştir
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- 3. Eğer varsa eski policy'yi silin
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

-- 4. Anonim kullanıcılar için INSERT policy oluştur
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Policy'nin oluşturulduğunu kontrol et
SELECT * FROM pg_policies WHERE tablename = 'suggestions';
```

4. **Run** veya **Ctrl+Enter** ile çalıştırın
5. **Success** mesajını görmelisiniz

### YÖNTEM 2: Dashboard UI ile

1. **Table Editor:**
   - Sol menüden **Table Editor** seçin
   - `suggestions` tablosunu bulun ve tıklayın

2. **RLS'yi aktifleştirin:**
   - Tablonun üst kısmında **RLS enabled** toggle'ını **ON** yapın
   - Eğer yoksa, tablo ayarlarında bulun

3. **Policies sekmesine gidin:**
   - Tablo detaylarında **Policies** sekmesini seçin
   - **New Policy** butonuna tıklayın

4. **Policy ayarlarını yapın:**
   - **Policy name:** `Allow anonymous insert to suggestions`
   - **Allowed operation:** `INSERT` seçin
   - **Target roles:** `anon` (anonim kullanıcılar) seçin
   - **USING expression:** `true` yazın
   - **WITH CHECK expression:** `true` yazın

5. **Review** ve **Save** butonuna tıklayın

### YÖNTEM 3: Authentication → Policies

1. **Authentication:**
   - Sol menüden **Authentication** seçin
   - **Policies** sekmesine gidin
   - `suggestions` tablosunu bulun

2. **Yeni policy ekleyin:**
   - Yukarıdaki ayarları kullanın

## ✅ KONTROL ADIMLARI

### 1. Policy'nin Oluşturulduğunu Kontrol Edin

SQL Editor'da şu sorguyu çalıştırın:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'suggestions';
```

**Beklenen Sonuç:**
- En az bir policy görmelisiniz
- `policyname` = `Allow anonymous insert to suggestions`
- `roles` = `{anon}`
- `cmd` = `INSERT`

### 2. RLS'nin Aktif Olduğunu Kontrol Edin

```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'suggestions' 
AND schemaname = 'public';
```

**Beklenen Sonuç:**
- `rowsecurity` = `true` olmalı

### 3. Test Edin

1. Tarayıcıda `/iletisim` sayfasına gidin
2. Formu doldurun:
   - Ad Soyad: Test
   - E-posta: test@example.com
   - Mesaj: Test mesajı
3. **Mesaj Gönder** butonuna tıklayın
4. **Browser Console'u açın (F12)**
5. Başarılı olursa:
   - ✅ Yeşil toast mesajı görünür
   - ✅ Console'da "Contact form submitted successfully" mesajı görünür
   - ✅ Admin panelinde mesaj görünür

## 🔧 SORUN GİDERME

### Sorun 1: "policy already exists" hatası
```sql
-- Eski policy'yi silin
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

-- Yeni policy oluşturun
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

### Sorun 2: RLS zaten aktif ama policy çalışmıyor
```sql
-- Policy'yi yeniden oluşturun
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

### Sorun 3: Hala hata alıyorum
1. Browser console'u açın (F12)
2. Network sekmesine gidin
3. Formu gönderin
4. `suggestions` API çağrısını bulun
5. Response'u kontrol edin
6. Hata mesajını not edin

## 📝 NOTLAR

- `anon` role'ü: Giriş yapmamış (anonim) kullanıcılar için
- `authenticated` role'ü: Giriş yapmış kullanıcılar için
- `WITH CHECK (true)`: Herkesin INSERT yapabilmesi anlamına gelir
- RLS aktif olduğunda, policy olmadan INSERT yapılamaz

## 🎯 HIZLI ÇÖZÜM (Kopyala-Yapıştır)

Supabase SQL Editor'da çalıştırın:

```sql
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

Bu kadar! Şimdi formu test edin. 🚀

