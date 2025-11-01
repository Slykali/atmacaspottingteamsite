// Script to upload local photos to Supabase
// Usage: node upload-photos-to-supabase.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';

const SUPABASE_URL = "https://jzolrxxewgmcoydiqrcw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6b2xyeHhld2dtY295ZGlxcmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzgyNDksImV4cCI6MjA3NzMxNDI0OX0.aV9Qw-SjOn9AP5gMvqDY_9EsloP02YUA9x44C8txpu4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Fotoğraf bilgilerini buraya ekleyin
// Her fotoğraf için: dosya adı, alt metin, etiketler, konum, tarih, fotoğrafçı
const photoInfo = {
  'gallery-1.jpg': {
    alt: 'AJET AİRBUS A321 Sabiha-Antalya iniş',
    tags: ['AJET', 'Airbus A321', 'İniş', 'Sabiha', 'Antalya'],
    location: 'Antalya Havalimanı',
    date: '2024-01-15',
    photographer: 'Atmaca Spotting Team'
  },
  'gallery-2.jpg': {
    alt: 'THY 737 MAX İstanbul Havalimanı-Antalya iniş',
    tags: ['THY', 'Boeing 737 MAX', 'İniş', 'İstanbul Havalimanı', 'Antalya'],
    location: 'Antalya Havalimanı',
    date: '2024-02-20',
    photographer: 'Atmaca Spotting Team'
  },
  'gallery-3.jpg': {
    alt: 'Airbus A330 Londra-Antalya park alanı',
    tags: ['Airbus A330', 'Park', 'Londra', 'Antalya'],
    location: 'Antalya Havalimanı',
    date: '2024-03-10',
    photographer: 'Atmaca Spotting Team'
  },
  'gallery-4.jpg': {
    alt: 'IRAERO SU100 Moskova-Antalya iniş',
    tags: ['IRAERO', 'SU100', 'İniş', 'Moskova', 'Antalya'],
    location: 'Antalya Havalimanı',
    date: '2024-04-05',
    photographer: 'Atmaca Spotting Team'
  },
  'gallery-5.jpg': {
    alt: 'Plane spotting',
    tags: ['Boeing 787', 'Kapı', 'İzmir'],
    location: 'İzmir Adnan Menderes',
    date: '2024-05-12',
    photographer: 'Atmaca Spotting Team'
  },
  'gallery-6.jpg': {
    alt: 'Aviation photography',
    tags: ['Embraer E190', 'Apron', 'Trabzon'],
    location: 'Trabzon Havalimanı',
    date: '2024-06-18',
    photographer: 'Atmaca Spotting Team'
  }
};

async function uploadPhotos() {
  console.log('🚀 Fotoğraf yükleme başlıyor...\n');
  
  const photosDir = './src/assets/gallery';
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  try {
    const files = readdirSync(photosDir);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    console.log(`📸 ${imageFiles.length} fotoğraf bulundu\n`);
    
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const filename of imageFiles) {
      // .gitkeep gibi dosyaları atla
      if (filename.startsWith('.') || filename === '.gitkeep') {
        continue;
      }
      
      const filePath = join(photosDir, filename);
      const info = photoInfo[filename];
      
      // Bilgi yoksa varsayılan bilgilerle ekle
      const photoData = info || {
        alt: `Fotoğraf: ${basename(filename, extname(filename))}`,
        tags: ['Havacılık', 'Spotting'],
        location: null,
        date: new Date().toISOString().split('T')[0],
        photographer: 'Atmaca Spotting Team'
      };
      
      try {
        console.log(`📤 Yükleniyor: ${filename}...`);
        
        // Dosyayı oku
        const fileBuffer = readFileSync(filePath);
        const fileExt = extname(filename);
        const randomName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
        const storagePath = `gallery/${randomName}`;
        
        // Supabase Storage'a yükle
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(storagePath, fileBuffer, {
            contentType: `image/${fileExt.slice(1)}`,
            upsert: false
          });
        
        if (uploadError) {
          console.error(`❌ Yükleme hatası (${filename}):`, uploadError.message);
          errors++;
          continue;
        }
        
        // Public URL al
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(storagePath);
        
        // Veritabanına kaydet
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert([{
            src: publicUrl,
            alt: photoData.alt,
            tags: photoData.tags,
            location: photoData.location || null,
            date: photoData.date || null,
            photographer: photoData.photographer || null,
            status: 'approved',
            likes_count: 0,
            views: 0
          }]);
        
        if (dbError) {
          console.error(`❌ Veritabanı hatası (${filename}):`, dbError.message);
          errors++;
        } else {
          console.log(`✅ Başarılı: ${filename} -> ${photoData.alt}`);
          uploaded++;
        }
        
        // Rate limiting için küçük bekleme
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Hata (${filename}):`, error.message);
        errors++;
      }
    }
    
    console.log('\n🎉 Yükleme tamamlandı!');
    console.log(`✅ Başarıyla yüklendi: ${uploaded} fotoğraf`);
    console.log(`⏭️  Atlandı: ${skipped} fotoğraf`);
    if (errors > 0) {
      console.log(`❌ Hata: ${errors} fotoğraf`);
    }
    
  } catch (error) {
    console.error('❌ Klasör okuma hatası:', error.message);
  }
}

uploadPhotos().catch(console.error);

