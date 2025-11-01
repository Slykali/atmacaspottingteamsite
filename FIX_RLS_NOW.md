# 🚨 RLS HATASI ÇÖZÜMÜ - ADIM ADIM

## ⚠️ DİKKAT: Bu adımları TAM OLARAK takip edin!

---

## ✅ ADIM 1: Supabase Dashboard'a Gidin

1. Tarayıcıda şu adresi açın: **https://supabase.com/dashboard**
2. Projenize giriş yapın
3. Projenizi seçin (URL'deki ref: `jzolrxxewgmcoydiqrcw`)

---

## ✅ ADIM 2: SQL Editor'ı Açın

1. Sol menüden **"SQL Editor"** seçin
2. **"New query"** butonuna tıklayın (veya boş bir alan açın)

---

## ✅ ADIM 3: Bu SQL'i KOPYALAYIN ve YAPIŞTIRIN

```sql
-- ============================================
-- RLS FIX for suggestions table
-- ============================================

-- Adım 1: RLS'yi kesinlikle aktif et
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Adım 2: Eğer varsa TÜM eski INSERT policies'i sil
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "anon_insert_suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "public_suggestions_insert" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_insert_policy" ON public.suggestions;

-- Adım 3: Yeni policy oluştur (KESIN ÇALIŞACAK VERSIYON)
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Adım 4: Kontrol - Policy'nin oluşturulduğunu gör
SELECT 
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';
```

---

## ✅ ADIM 4: SQL'i ÇALIŞTIRIN

1. SQL'i kopyalayıp yapıştırdıktan sonra
2. **"RUN"** veya **"Ctrl+Enter"** veya **"Cmd+Enter"** tuşuna basın
3. **"Success"** veya **"Query executed successfully"** mesajını görmelisiniz

---

## ✅ ADIM 5: SONUCU KONTROL EDİN

SQL çalıştırdıktan sonra, en alttaki **SELECT** sorgusu size şunu göstermeli:

```
policyname: "Allow anonymous insert to suggestions"
roles: ["anon"]
cmd: "INSERT"
with_check: "true"
```

**Eğer bu görünüyorsa:** ✅ Policy başarıyla oluşturuldu!

---

## ✅ ADIM 6: FORM'U TEST EDİN

1. Tarayıcıda `/iletisim` sayfasına gidin
2. Formu doldurun:
   - Ad Soyad: Test
   - E-posta: test@test.com
   - Mesaj: Test mesajı
3. **"Mesaj Gönder"** butonuna tıklayın
4. **Yeşil başarı mesajı** görmelisiniz! ✅

---

## ❌ HALA HATA ALIYORSANIZ

### Kontrol 1: Policy var mı?

Supabase SQL Editor'da şu sorguyu çalıştırın:

```sql
SELECT * FROM pg_policies WHERE tablename = 'suggestions';
```

**Eğer hiçbir sonuç yoksa:**
- Policy oluşturulmamış demektir
- Yukarıdaki ADIM 3'ü tekrar çalıştırın

**Eğer sonuç varsa ama hata alıyorsanız:**
- Policy'nin `roles` kolonunda `anon` olup olmadığını kontrol edin
- Policy'nin `cmd` kolonunda `INSERT` olup olmadığını kontrol edin

### Kontrol 2: RLS aktif mi?

```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'suggestions' 
AND schemaname = 'public';
```

**Beklenen:** `rowsecurity = true` olmalı

**Eğer `false` ise:**
- Yukarıdaki ADIM 3'teki `ALTER TABLE` komutunu tekrar çalıştırın

### Kontrol 3: Browser Console

1. Tarayıcıda **F12** → **Console** sekmesi
2. Formu gönderin
3. Console'da görünen **tam hata mesajını** kopyalayın
4. Bana gönderin, beraber çözelim

---

## 🎯 KESIN ÇÖZÜM (TÜM POLİTİKALARI SİLİP YENİDEN OLUŞTUR)

Eğer hiçbir şey işe yaramıyorsa, şu SQL'i çalıştırın (DİKKAT: Mevcut policies'i siler):

```sql
-- TÜM policies'i sil
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'suggestions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.suggestions';
    END LOOP;
END $$;

-- RLS'yi aktif et
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Yeni policy oluştur
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Kontrol
SELECT * FROM pg_policies WHERE tablename = 'suggestions';
```

---

## 📞 HALA ÇÖZÜLMEDİYSE

1. Browser console'daki (F12) **tam hata mesajını** kopyalayın
2. Supabase'de şu sorgunun sonucunu paylaşın:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'suggestions';
   ```
3. Şu sorgunun sonucunu paylaşın:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'suggestions' AND schemaname = 'public';
   ```

Bu bilgilerle birlikte daha spesifik bir çözüm sunabilirim.

