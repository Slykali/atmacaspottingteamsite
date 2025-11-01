# Supabase RLS (Row Level Security) Politikası Kurulumu

İletişim formunun çalışması için Supabase'de `suggestions` tablosuna RLS politikası eklemeniz gerekiyor.

## Sorun
Anonim kullanıcılar (formu dolduran herkes) `suggestions` tablosuna INSERT yapabilmeli.

## Çözüm

### 1. Supabase Dashboard'a Gidin
- https://supabase.com/dashboard adresine gidin
- Projenizi seçin

### 2. Table Editor'a Gidin
- Sol menüden **Table Editor** seçin
- `suggestions` tablosunu bulun

### 3. RLS Politikası Ekleyin
- `suggestions` tablosuna tıklayın
- **Policies** sekmesine gidin
- **New Policy** butonuna tıklayın

### 4. Policy Oluşturun

**Policy Adı:** `Allow anonymous insert to suggestions`

**Policy Type:** `INSERT`

**Allowed Operation:** `INSERT`

**Target Roles:** `anon` (anonim kullanıcılar için)

**Policy Definition:**
```sql
true
```

veya SQL Editor'da direkt olarak:

```sql
-- Anonim kullanıcıların suggestions tablosuna INSERT yapabilmesi için
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

### 5. RLS'yi Aktifleştirin (Eğer değilse)
- `suggestions` tablosunda **RLS** toggle'ını **ON** yapın

### 6. Test Edin
- İletişim formunu doldurup gönderin
- Browser console'u açın (F12) ve hata mesajlarını kontrol edin
- Başarılı olursa toast mesajı görünecek

## Alternatif: SQL Editor Kullanarak

1. Supabase Dashboard → **SQL Editor**
2. Yeni bir query oluşturun
3. Aşağıdaki SQL'i çalıştırın:

```sql
-- RLS'yi aktifleştir (eğer değilse)
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcılar için INSERT policy
CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
```

## Kontrol Etme

Policy'nin doğru çalışıp çalışmadığını kontrol etmek için:

1. Browser console'u açın (F12)
2. Formu gönderin
3. Console'da hata mesajı varsa not edin
4. Başarılı olursa "Contact form submitted successfully" mesajı görünür

## Notlar

- `anon` role'ü anonim (giriş yapmamış) kullanıcılar için kullanılır
- `authenticated` role'ü giriş yapmış kullanıcılar için kullanılır
- `WITH CHECK (true)` herkesin INSERT yapabilmesi anlamına gelir

