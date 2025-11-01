# 🎯 RLS HATASI - KESIN ÇÖZÜM PLANI

## ⚠️ SORUN
Supabase'de `suggestions` tablosuna INSERT policy yok veya yanlış yapılandırılmış.

---

## 📋 ADIM ADIM ÇÖZÜM PLANI

### ✅ ADIM 1: Durumu Kontrol Et

**Supabase SQL Editor'da şu sorguları çalıştırın:**

```sql
-- 1. RLS aktif mi?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'suggestions' 
AND schemaname = 'public';
```

**Beklenen:** `rowsecurity = true` olmalı

```sql
-- 2. Hangi policies var?
SELECT 
  policyname,
  roles,
  cmd,
  with_check,
  qual
FROM pg_policies 
WHERE tablename = 'suggestions';
```

**Sonuçu not edin:**
- Policy var mı?
- Varsa hangi roller için?
- INSERT policy var mı?

---

### ✅ ADIM 2: Mevcut Policies'i Temizle

**SQL Editor'da şu SQL'i çalıştırın:**

```sql
-- TÜM policies'i sil (güvenli - IF EXISTS kullanıyoruz)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'suggestions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.suggestions';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;
```

**Sonuç:** Tüm policies silinmeli, "Dropped policy: ..." mesajları görmelisiniz.

---

### ✅ ADIM 3: RLS'yi Aktifleştir

```sql
-- RLS'yi kesinlikle aktif et
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Kontrol et
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'suggestions' 
AND schemaname = 'public';
```

**Beklenen:** `rowsecurity = true`

---

### ✅ ADIM 4: YENİ Policy Oluştur (Kesin Çalışan Versiyon)

```sql
-- Anonim kullanıcılar için INSERT policy
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Kontrol - Policy oluşturuldu mu?
SELECT 
  policyname AS "Policy Adı",
  roles AS "Roller",
  cmd AS "Komut",
  with_check AS "With Check"
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';
```

**Beklenen Sonuç:**
```
Policy Adı: "Allow anonymous insert to suggestions"
Roller: ["anon"] veya {anon}
Komut: "INSERT"
With Check: "true"
```

---

### ✅ ADIM 5: Test Et

1. Browser'da `/iletisim` sayfasına gidin
2. Formu doldurun ve gönderin
3. **Başarı mesajı görmelisiniz!**

---

## ❌ HALA ÇALIŞMIYORSA

### Alternatif 1: Policy Formatını Değiştir

```sql
-- Önce sil
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

-- Farklı format dene
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
USING (true)
WITH CHECK (true);
```

### Alternatif 2: public role için de ekle

```sql
-- public role için de ekle
CREATE POLICY "Allow public insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);
```

---

## 🔍 DETAYLI KONTROL

### Browser Console Kontrolü (F12)

1. Console sekmesine gidin
2. Formu gönderin
3. Hata mesajını tam olarak kopyalayın
4. Network sekmesinde `suggestions` isteğini bulun
5. Response'u kontrol edin

### Supabase Logs Kontrolü

1. Supabase Dashboard → **Logs** → **API Logs**
2. Son INSERT isteklerini kontrol edin
3. Hata mesajlarını not edin

---

## 📞 SONUÇ RAPORU PAYLAŞIN

Şunları paylaşın:

1. **ADIM 1 sonucu:**
   - RLS aktif mi? (true/false)
   - Kaç policy var?

2. **ADIM 2 sonucu:**
   - Kaç policy silindi?

3. **ADIM 4 sonucu:**
   - Policy oluşturuldu mu?
   - SELECT sorgusunun sonucu nedir?

4. **Browser Console'da ne görüyorsunuz?**
   - Tam hata mesajını paylaşın

Bu bilgilerle kesin çözümü bulabiliriz!

