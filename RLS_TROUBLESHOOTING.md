# RLS Sorun Giderme Rehberi

## 🔍 Adım 1: Browser Console'u Kontrol Edin

1. Tarayıcıda sayfayı açın
2. **F12** tuşuna basın (Developer Tools)
3. **Console** sekmesine gidin
4. Formu gönderin
5. Console'da görünen **tam hata mesajını** not edin

Şunları arayın:
- Error code (örn: `42501`, `PGRST301`)
- Error message
- Error details
- Error hint

## 🔍 Adım 2: Supabase Dashboard'da Kontrol Edin

### 2.1 SQL Editor ile Policy Kontrolü

1. Supabase Dashboard → **SQL Editor**
2. Şu sorguyu çalıştırın:

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
- En az bir policy görünmeli
- `policyname` = `Allow anonymous insert to suggestions` veya benzeri
- `roles` = `{anon}` veya `anon` içermeli
- `cmd` = `INSERT`

**Eğer hiçbir policy yoksa:**
- Yukarıdaki SQL'i çalıştırın ve sonucu not edin

### 2.2 RLS Durumunu Kontrol Edin

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

### 2.3 Mevcut Politikaları Listeleyin

```sql
-- Tüm policies
SELECT * FROM pg_policies WHERE tablename = 'suggestions';

-- Sadece INSERT policies
SELECT * FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';
```

## 🔧 Adım 3: Policy'yi Yeniden Oluşturun

Eğer policy varsa ama çalışmıyorsa:

```sql
-- Önce tüm INSERT policies'i silin
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "anon_insert_suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "public_suggestions_insert" ON public.suggestions;

-- Yeniden oluşturun
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

## 🔧 Adım 4: Alternatif Policy Formatları

### Format 1: USING ve WITH CHECK ayrı
```sql
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
USING (true)
WITH CHECK (true);
```

### Format 2: USING olmadan
```sql
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

### Format 3: PERMISSIVE açıkça belirtilmiş
```sql
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);
```

## 🔧 Adım 5: RLS'yi Geçici Olarak Kapat (TEST İÇİN)

⚠️ **DİKKAT:** Bu sadece test için! Production'da kullanmayın!

```sql
ALTER TABLE public.suggestions DISABLE ROW LEVEL SECURITY;
```

Eğer bu çalışırsa, sorun kesinlikle RLS policy'de.

## 🔍 Adım 6: Network Tab'ını Kontrol Edin

1. Browser → **F12** → **Network** sekmesi
2. Formu gönderin
3. `suggestions` veya `rest/v1/suggestions` isteğini bulun
4. **Response** sekmesine bakın
5. Tam hata mesajını not edin

## 🎯 Hızlı Test SQL'i

Supabase SQL Editor'da bu sorguyu çalıştırın:

```sql
-- Tümünü bir arada çalıştırın
BEGIN;

-- RLS'yi aktifleştir
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Tüm eski INSERT policies'i sil
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "anon_insert_suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "public_suggestions_insert" ON public.suggestions;

-- Yeni policy oluştur
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Kontrol et
SELECT 
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';

COMMIT;
```

## 📋 Sorun Devam Ederse

1. Browser console'daki **tam hata mesajını** kopyalayın
2. Supabase dashboard'da **policies listesinin ekran görüntüsünü** alın
3. Şu sorgunun sonucunu paylaşın:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'suggestions';
   ```

## ✅ Doğrulama

Form başarılı olduğunda:
- ✅ Yeşil toast mesajı görünür
- ✅ Browser console'da "Contact form submitted successfully" mesajı görünür
- ✅ Admin panelinde (`/admin/suggestions`) mesaj görünür

