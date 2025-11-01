# Fotoğraf Ekleme Notu

## Supabase RLS (Row Level Security) Hatası

Script ile fotoğraf yükleme şu anda çalışmıyor çünkü Supabase'de Row Level Security (RLS) aktif.

## Çözüm: Admin Panelinden Ekleme

1. Admin paneline giriş yapın (`/admin`)
2. "Galeri" bölümüne gidin
3. "Yeni Fotoğraf Ekle" butonuna tıklayın
4. `src/assets/gallery/` klasöründeki fotoğrafları seçin
5. Fotoğraf bilgilerini doldurun:
   - Alt metin (açıklama)
   - Etiketler (virgülle ayırın)
   - Konum
   - Tarih
   - Fotoğrafçı adı
6. Kaydedin

## Alternatif: Service Role Key Kullanarak

Script'i service role key ile çalışacak şekilde güncelleyebiliriz. Bu için Supabase dashboard'dan service role key alın ve script'e ekleyin.

