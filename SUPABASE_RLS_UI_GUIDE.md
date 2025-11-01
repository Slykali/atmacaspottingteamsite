# 🎯 Supabase RLS Policy Oluşturma - Görsel Rehber

## YÖNTEM 1: Dashboard UI ile (En Kolay - Önerilen)

### Adım 1: Supabase Dashboard'a Gidin
1. Tarayıcıda: **https://supabase.com/dashboard**
2. Giriş yapın
3. Projenizi seçin

### Adım 2: Table Editor'ı Açın
1. Sol menüden **"Table Editor"** seçin
2. Tablolar listesinde **"suggestions"** tablosunu bulun
3. **"suggestions"** tablosuna tıklayın

### Adım 3: RLS'yi Aktifleştirin
1. Tablo sayfasının üst kısmında **"RLS enabled"** toggle'ını bulun
2. **Toggle'ı ON yapın** (yeşil olmalı)
3. Eğer toggle yoksa:
   - Tablo ayarlarında (Settings) bulabilirsiniz
   - Veya SQL Editor'da: `ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;`

### Adım 4: Policies Sekmesine Gidin
1. Tablo sayfasında **"Policies"** sekmesine tıklayın
2. **"New Policy"** butonuna tıklayın

### Adım 5: Policy Ayarlarını Yapın

**Policy Ayarları:**

1. **Policy name (Policy adı):**
   ```
   Allow anonymous insert to suggestions
   ```

2. **Allowed operation (İzin verilen işlem):**
   - `INSERT` seçin ✅

3. **Target roles (Hedef roller):**
   - `anon` seçin ✅
   - (Anonim kullanıcılar için)

4. **USING expression:**
   - Boş bırakın veya `true` yazın

5. **WITH CHECK expression:**
   ```
   true
   ```
   - Tam olarak `true` yazın (tırnak işareti YOK)

6. **Review** butonuna tıklayın

7. **Save** veya **Create Policy** butonuna tıklayın

### Adım 6: Kontrol Edin
1. Policies listesinde yeni policy'yi görmelisiniz
2. Policy şöyle görünmelidir:
   - **Name:** Allow anonymous insert to suggestions
   - **Operation:** INSERT
   - **Roles:** anon
   - **Status:** Active (veya Enabled)

### Adım 7: Test Edin
1. Tarayıcıda `/iletisim` sayfasına gidin
2. Formu doldurun ve gönderin
3. ✅ Başarı mesajı görmelisiniz!

---

## YÖNTEM 2: SQL Editor ile (Hızlı)

### Adım 1: SQL Editor'ı Açın
1. Sol menüden **"SQL Editor"** seçin
2. **"New query"** butonuna tıklayın

### Adım 2: SQL'i Yapıştırın

**⚠️ AŞAĞIDAKİ SQL'İ TAM OLARAK KOPYALAYIN:**

```sql
-- RLS'yi aktifleştir
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Eski policy'leri sil (varsa)
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "anon_insert_suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "public_suggestions_insert" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_insert_policy" ON public.suggestions;

-- Yeni policy oluştur
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Kontrol et
SELECT 
  policyname AS "Policy Adı",
  roles AS "Roller",
  cmd AS "Komut",
  with_check AS "With Check"
FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT';
```

### Adım 3: Çalıştırın
1. SQL'i yapıştırdıktan sonra
2. **"RUN"** butonuna tıklayın (veya **Ctrl+Enter** / **Cmd+Enter**)

### Adım 4: Sonucu Kontrol Edin
1. **"Success"** mesajını görmelisiniz
2. En alttaki SELECT sorgusu size şunu göstermeli:
   ```
   Policy Adı: "Allow anonymous insert to suggestions"
   Roller: ["anon"]
   Komut: "INSERT"
   With Check: "true"
   ```

### Adım 5: Test Edin
1. `/iletisim` sayfasına gidin
2. Formu gönderin
3. ✅ Başarı mesajı görmelisiniz!

---

## ❌ HATA ALIYORSANIZ

### Hata 1: "policy already exists"
**Çözüm:** Önce eski policy'yi silin:
```sql
DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;
```
Sonra yukarıdaki SQL'i tekrar çalıştırın.

### Hata 2: "relation does not exist"
**Çözüm:** Tablo adını kontrol edin:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%suggest%';
```

### Hata 3: "permission denied"
**Çözüm:** Admin yetkileriniz olmalı. Supabase proje sahibi olarak giriş yapın.

### Hata 4: Hala çalışmıyor
1. Browser console'u açın (F12)
2. Console sekmesinde tam hata mesajını kopyalayın
3. Network sekmesinde `suggestions` isteğini bulun
4. Response'u kontrol edin
5. Bana gönderin, beraber çözelim

---

## 🔍 DOĞRULAMA SORGULARI

### Policy var mı?
```sql
SELECT * FROM pg_policies WHERE tablename = 'suggestions';
```

### RLS aktif mi?
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'suggestions' AND schemaname = 'public';
```
**Beklenen:** `rowsecurity = true`

### INSERT policy var mı?
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'suggestions' 
AND cmd = 'INSERT'
AND 'anon' = ANY(roles);
```

---

## ✅ BAŞARI KRİTERLERİ

Policy başarıyla oluşturulduysa:
- ✅ Supabase Dashboard'da policy listesinde görünür
- ✅ `pg_policies` sorgusunda görünür
- ✅ Form gönderildiğinde başarı mesajı alırsınız
- ✅ Admin panelinde mesaj görünür
- ✅ Browser console'da hata yok

---

## 📞 HALA ÇÖZÜLMEDİYSE

Lütfen şu bilgileri paylaşın:

1. **Supabase'de policy var mı?**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'suggestions';
   ```
   (Sonucu paylaşın)

2. **RLS aktif mi?**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'suggestions' AND schemaname = 'public';
   ```
   (Sonucu paylaşın)

3. **Browser console'da (F12) tam hata mesajı nedir?**
   (Hata mesajını kopyalayın)

4. **Supabase Dashboard'da policy ekran görüntüsü**
   (Eğer varsa)

Bu bilgilerle birlikte kesin çözümü sunabilirim!

