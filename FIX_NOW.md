# 🚨 RLS HATASI - HEMEN ÇÖZÜM

## ⚠️ Bu hatayı alıyorsunuz çünkü Supabase'de RLS politikası yok.

---

## ✅ ÇÖZÜM (2 DAKİKA)

### 1️⃣ Supabase'e Gidin
- https://supabase.com/dashboard
- Projenizi seçin

### 2️⃣ SQL Editor'ı Açın
- Sol menüden **"SQL Editor"** seçin
- Sağ üstte **"New query"** tıklayın

### 3️⃣ Bu SQL'i KOPYALAYIN:

```sql
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);
```

### 4️⃣ YAPIŞTIRIN ve ÇALIŞTIRIN
- SQL'i yukarıdaki kod alanına yapıştırın
- **"RUN"** butonuna tıklayın (veya `Ctrl+Enter`)
- **"Success"** mesajını görmelisiniz

### 5️⃣ TEST EDİN
- `/iletisim` sayfasına gidin
- Formu gönderin
- ✅ **Başarı mesajı görmelisiniz!**

---

## ❌ HALA ÇALIŞMIYORSA

### Kontrol 1: Policy var mı?

Supabase SQL Editor'da şu sorguyu çalıştırın:

```sql
SELECT * FROM pg_policies WHERE tablename = 'suggestions';
```

**Eğer boşsa:** Policy oluşturulmamış demektir.

**Eğer sonuç varsa:** Paylaşın, beraber bakalım.

---

### Kontrol 2: SQL hata veriyor mu?

SQL'i çalıştırdığınızda **hata mesajı** görüyor musunuz?

**Eğer görüyorsanız:** Tam hata mesajını paylaşın.

**Eğer "Success" görüyorsanız:** Policy oluşturulmuş demektir.

---

### Kontrol 3: Browser Console

1. Tarayıcıda **F12** basın
2. **Console** sekmesine gidin
3. Formu gönderin
4. **Tam hata mesajını** kopyalayın
5. Paylaşın

---

## 📞 YARDIM İÇİN PAYLAŞIN:

1. SQL'i çalıştırdıktan sonra **ne gördünüz?** (Success mi, hata mı?)
2. Policy kontrol sorgusunun **sonucu nedir?**
3. Browser console'daki **hata mesajı nedir?**

Bu bilgilerle kesin çözümü sunabilirim!

