# Atmaca Spotting Team Web Sitesi

Atmaca Spotting Team'in resmi web sitesi. Havacılık fotoğrafçılığı topluluğu için tasarlanmış modern, responsive ve SEO uyumlu web uygulaması.

## 🚀 Özellikler

- **Modern Tasarım**: Havacılık temalı, profesyonel ve etkileyici UI
- **Responsive**: Mobil, tablet ve masaüstü uyumlu
- **SEO Optimize**: Meta etiketleri, Open Graph desteği
- **İçerik Yönetimi**: JSON dosyaları üzerinden kolay içerik düzenleme
- **Galeri Sistemi**: Lightbox özellikli fotoğraf galerisi
- **Duyuru Sistemi**: Blog benzeri duyuru ve haber sistemi
- **Başvuru Formu**: Yeni üye başvuru formu
- **İletişim**: İletişim formu ve sosyal medya entegrasyonu

## 📁 Proje Yapısı

```
atmaca-spotting/
├── content/               # İçerik yönetimi için JSON dosyaları
│   ├── site.json         # Site bilgileri, sosyal linkler
│   ├── announcements.json # Duyurular
│   ├── members.json      # Aktif üyeler
│   └── gallery.json      # Galeri fotoğrafları
├── src/
│   ├── assets/           # Görseller
│   ├── components/       # React bileşenleri
│   ├── pages/            # Sayfa bileşenleri
│   └── ...
└── ...
```

## 🛠️ Kurulum

### Gereksinimler

- Node.js 18+ ve npm

### Adımlar

1. Repoyu klonlayın:
```bash
git clone <REPO_URL>
cd <PROJECT_NAME>
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Uygulama http://localhost:8080 adresinde çalışacaktır.

## 📝 İçerik Güncelleme

### Site Bilgileri

`content/site.json` dosyasını düzenleyin:

```json
{
  "siteName": "Atmaca Spotting Team",
  "slogan": "Göklerde iz peşinde",
  "email": "info@atmacaspotting.com",
  "social": {
    "instagram": "https://instagram.com/atmacaspotting",
    "twitter": "https://twitter.com/atmacaspotting",
    "youtube": "https://youtube.com/@atmacaspotting"
  }
}
```

### Duyuru Ekleme

`content/announcements.json` dosyasına yeni duyuru ekleyin:

```json
{
  "title": "Duyuru Başlığı",
  "slug": "duyuru-url-slug",
  "date": "2025-12-31",
  "excerpt": "Kısa özet...",
  "content": "Tam içerik metni..."
}
```

**Önemli:** `slug` değeri URL'de kullanılır ve benzersiz olmalıdır.

### Galeri Fotoğrafı Ekleme

1. Fotoğrafı `src/assets/` klasörüne kaydedin
2. `content/gallery.json` dosyasını güncelleyin:

```json
{
  "src": "/src/assets/yeni-fotograf.jpg",
  "alt": "Fotoğraf açıklaması",
  "tags": ["A320", "Gündüz", "İniş"]
}
```

### Üye Ekleme

`content/members.json` dosyasına yeni üye ekleyin:

```json
{
  "name": "Ad Soyad",
  "role": "Rol/Görev",
  "bio": "Kısa biyografi...",
  "photo": "/placeholder.svg",
  "social": {
    "instagram": "@kullanici_adi"
  }
}
```

## 🎨 Tasarım Sistemi

Renkler ve stiller `src/index.css` ve `tailwind.config.ts` dosyalarında tanımlanmıştır:

### Ana Renkler

- **Primary**: Koyu lacivert (#0A1A2F) - hsl(210, 65%, 11%)
- **Accent**: Mavi (#1E90FF) - hsl(210, 100%, 56%)
- **Background**: Açık gri (#F5F7FB) - hsl(215, 33%, 97%)

### Özelleştirme

`src/index.css` dosyasındaki CSS değişkenlerini düzenleyerek renkleri değiştirebilirsiniz:

```css
:root {
  --primary: 210 65% 11%;
  --accent: 210 100% 56%;
  /* ... */
}
```

## 📤 Deployment

### Vercel (Önerilen)

1. GitHub'a push edin
2. [Vercel](https://vercel.com) hesabınızla giriş yapın
3. Repo'yu import edin
4. Deploy butonuna tıklayın

### Netlify

1. GitHub'a push edin
2. [Netlify](https://netlify.com) hesabınızla giriş yapın
3. "New site from Git" seçin
4. Repo'yu seçin ve deploy edin

**Build Ayarları:**
- Build Command: `npm run build`
- Publish Directory: `dist`

## 🔧 Geliştirme

### Yeni Sayfa Ekleme

1. `src/pages/` altında yeni sayfa bileşeni oluşturun
2. `src/App.tsx` dosyasına route ekleyin:

```tsx
import YeniSayfa from "./pages/YeniSayfa";

// Routes içine:
<Route path="/yeni-sayfa" element={<YeniSayfa />} />
```

3. Navigation'a eklemek için `src/components/Navbar.tsx` dosyasını güncelleyin

### Yeni Bileşen Ekleme

1. `src/components/` altında yeni bileşen dosyası oluşturun
2. TypeScript ve React best practices kullanın
3. Design system'den renk ve stilleri kullanın

## 📋 Form Entegrasyonu

Formlar şu anda mock endpoint kullanıyor. Gerçek entegrasyon için:

### Netlify Forms

1. Form etiketine `netlify` attribute ekleyin:

```tsx
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  {/* form alanları */}
</form>
```

### Formspree

1. [Formspree](https://formspree.io) hesabı oluşturun
2. Form endpoint URL'ini alın
3. Form submit fonksiyonunu güncelleyin:

```tsx
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/YeniOzellik`)
3. Commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Push edin (`git push origin feature/YeniOzellik`)
5. Pull Request açın

## 📄 Lisans

Bu proje Atmaca Spotting Team için geliştirilmiştir.

## 💬 Destek

Sorularınız için:
- E-posta: info@atmacaspotting.com
- Instagram: [@atmacaspotting](https://instagram.com/atmacaspotting)

---

**Atmaca Spotting Team** - Havacılık fotoğrafçılığı topluluğu 🛩️
