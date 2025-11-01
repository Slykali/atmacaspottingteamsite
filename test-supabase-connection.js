// Supabase bağlantısını ve RLS politikalarını test etmek için
// Node.js ile çalıştırın: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = "https://jzolrxxewgmcoydiqrcw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6b2xyeHhld2dtY295ZGlxcmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzgyNDksImV4cCI6MjA3NzMxNDI0OX0.aV9Qw-SjOn9AP5gMvqDY_9EsloP02YUA9x44C8txpu4";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testConnection() {
  console.log('🧪 Supabase bağlantısı test ediliyor...\n');

  // 1. RLS politikalarını kontrol et
  console.log('1️⃣ RLS Politikalarını Kontrol Ediliyor...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `SELECT * FROM pg_policies WHERE tablename = 'suggestions';`
    });
    console.log('Policy kontrolü:', { data, error });
  } catch (err) {
    console.log('⚠️ RLS policy kontrolü için exec_sql fonksiyonu bulunamadı (normal)');
  }

  // 2. Test INSERT yap
  console.log('\n2️⃣ Test INSERT Yapılıyor...');
  const testData = {
    name: 'Test Kullanıcı',
    email: 'test@example.com',
    suggestion: 'Bu bir test mesajıdır',
    announcement_id: null
  };

  const { data: insertData, error: insertError } = await supabase
    .from('suggestions')
    .insert([testData])
    .select();

  if (insertError) {
    console.error('❌ INSERT HATASI:', insertError);
    console.error('Hata Kodu:', insertError.code);
    console.error('Hata Mesajı:', insertError.message);
    console.error('Hata Detayları:', insertError.details);
    console.error('Hata İpucu:', insertError.hint);
    
    if (insertError.code === '42501' || insertError.message.includes('permission denied')) {
      console.log('\n🔧 ÇÖZÜM:');
      console.log('Supabase Dashboard -> SQL Editor\'da şu SQL\'i çalıştırın:');
      console.log(`
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
      `);
    }
  } else {
    console.log('✅ INSERT BAŞARILI!', insertData);
    
    // Test verisini sil
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.log('⚠️ Test verisi silinemedi (normal, admin gerekebilir)');
      } else {
        console.log('✅ Test verisi temizlendi');
      }
    }
  }

  // 3. Tabloyu kontrol et
  console.log('\n3️⃣ Tablo Yapısı Kontrol Ediliyor...');
  const { data: tableData, error: tableError } = await supabase
    .from('suggestions')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Tablo okuma hatası:', tableError);
  } else {
    console.log('✅ Tablo okunabiliyor');
  }
}

testConnection().catch(console.error);

