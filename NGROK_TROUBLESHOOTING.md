# Ngrok Blocked Request Sorunu - Çözüm Kılavuzu

## Problem
ngrok ile localhost'u public'e açtığınızda Supabase'den "blocked request" hatası alıyorsunuz.

## Çözümler

### 1. Supabase Dashboard'da Allowed Origins (CORS) Ayarları

Supabase Dashboard'da ngrok URL'nizi eklemeniz gerekiyor:

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**
3. **Settings** (Ayarlar) → **API** bölümüne gidin
4. **Allowed Origins** kısmına ngrok URL'nizi ekleyin:
   ```
   https://your-ngrok-url.ngrok.io
   ```
   Örnek:
   ```
   https://abc123.ngrok-free.app
   ```
5. **Save** butonuna tıklayın
6. Tarayıcıyı yenileyin ve tekrar deneyin

### 2. Ngrok URL Formatı

Ngrok URL'nizin formatı önemli:
- ✅ Doğru: `https://abc123.ngrok-free.app`
- ❌ Yanlış: `http://localhost:8080` (ngrok URL değil)

### 3. Supabase Auth Settings

Auth ayarlarında da site URL'lerini kontrol edin:

1. **Settings** → **Authentication** → **URL Configuration**
2. **Site URL** kısmına ngrok URL'nizi ekleyin
3. **Redirect URLs** kısmına da ekleyin:
   ```
   https://your-ngrok-url.ngrok.io/**
   ```

### 4. Environment Variables (Opsiyonel)

Eğer farklı ortamlar için farklı Supabase projeleri kullanıyorsanız:

`.env.local` dosyası oluşturun:
```
VITE_SUPABASE_URL=https://jzolrxxewgmcoydiqrcw.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### 5. Browser Console Kontrolü

Tarayıcı console'unda (F12) şu hataları kontrol edin:
- CORS errors
- Network failed
- 401/403 errors

### 6. Ngrok Header Ekleme

Ngrok'un bazı sürümleri header eklemenizi isteyebilir. Eğer öyleyse:

Ngrok'u şu şekilde başlatın:
```bash
ngrok http 8080 --host-header="localhost:8080"
```

### 7. Supabase RLS (Row Level Security)

Eğer hala çalışmıyorsa, Supabase'deki RLS politikalarını kontrol edin:

1. **Database** → **Policies**
2. Her tablo için politikaları kontrol edin
3. Public access için `anon` role'üne izin verin (geçici test için)

## Hızlı Kontrol Listesi

- [ ] Supabase Dashboard → Settings → API → Allowed Origins'e ngrok URL eklendi mi?
- [ ] Settings → Authentication → Site URL'e ngrok URL eklendi mi?
- [ ] Redirect URLs'e ngrok URL eklendi mi?
- [ ] Ngrok URL doğru mu? (https:// ile başlamalı)
- [ ] Browser console'da hata var mı?
- [ ] Supabase API key doğru mu?

## Alternatif Çözümler

### Geçici Olarak RLS'i Devre Dışı Bırakma (Sadece Development İçin!)

⚠️ **UYARI**: Bu sadece development/test için kullanılmalı!

1. Supabase Dashboard → **Database** → **Tables**
2. İlgili tabloyu seçin (örn: `gallery_images`)
3. **Policies** sekmesine gidin
4. Geçici olarak RLS'i disable edebilirsiniz (sadece test için!)

### Localhost Kullanma

Ngrok yerine doğrudan localhost kullanabilirsiniz:
- Local development için: `http://localhost:8080`
- Supabase zaten localhost'a izin veriyor

## Destek

Hala çalışmıyorsa:
1. Browser console'daki hataları kontrol edin
2. Network tab'ında request/response'ları inceleyin
3. Supabase Dashboard'daki error logs'u kontrol edin

