# 📸 Fotoğraf Ekleme Kılavuzu

## Kod ile Fotoğraf Ekleme

### Adımlar:

1. **Fotoğrafları `src/assets/` klasörüne koyun**
   - Örnek: `gallery-1.jpg`, `gallery-2.jpg`, vb.

2. **`upload-photos-to-supabase.js` dosyasını açın**

3. **Fotoğraf bilgilerini `photoInfo` objesine ekleyin:**
   ```javascript
   const photoInfo = {
     'gallery-1.jpg': {
       alt: 'Fotoğraf açıklaması',
       tags: ['Etiket1', 'Etiket2', 'Etiket3'],
       location: 'Havalimanı adı',
       date: '2024-01-15', // YYYY-MM-DD formatında
       photographer: 'Fotoğrafçı adı'
     },
     'gallery-2.jpg': {
       // ... diğer fotoğraflar
     }
   };
   ```

4. **Script'i çalıştırın:**
   ```bash
   npm run upload-photos
   ```
   veya
   ```bash
   node upload-photos-to-supabase.js
   ```

### Örnek:

```javascript
const photoInfo = {
  'gallery-1.jpg': {
    alt: 'Boeing 737 kalkış anı',
    tags: ['Boeing 737', 'Kalkış', 'İstanbul', 'Day'],
    location: 'İstanbul Havalimanı',
    date: '2024-01-15',
    photographer: 'Ahmet Yılmaz'
  },
  'my-photo.jpg': {
    alt: 'Airbus A320 iniş',
    tags: ['Airbus A320', 'İniş', 'Ankara'],
    location: 'Ankara Esenboğa',
    date: '2024-02-20',
    photographer: 'Mehmet Demir'
  }
};
```

### Önemli Notlar:

- ✅ Fotoğraflar `src/assets/` klasöründe olmalı
- ✅ Dosya adı `photoInfo` objesinde tanımlı olmalı
- ✅ Fotoğraflar otomatik olarak `approved` (onaylı) durumunda eklenir
- ✅ Script sadece `gallery-*.jpg` dosyalarını yükler (değiştirilebilir)

### Tüm Fotoğrafları Yüklemek İçin:

Script içindeki bu kısmı değiştirin:
```javascript
// gallery-X.jpg hariç diğer fotoğrafları atla
if (!filename.startsWith('gallery-') && filename !== 'hero-aircraft.jpg') {
  console.log(`⏭️  Atlandı: ${filename}`);
  skipped++;
  continue;
}
```

Bu kısmı silin veya yorum satırı yapın ki tüm fotoğrafları yüklesin.

