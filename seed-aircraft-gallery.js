// Seed Supabase database with aircraft photos
// Usage: node seed-aircraft-gallery.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = "https://jzolrxxewgmcoydiqrcw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6b2xyeHhld2dtY295ZGlxcmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzgyNDksImV4cCI6MjA3NzMxNDI0OX0.aV9Qw-SjOn9AP5gMvqDY_9EsloP02YUA9x44C8txpu4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedGallery() {
  console.log('🚀 Starting aircraft gallery seeding...');
  
  // Read photos data from file
  const photosData = JSON.parse(readFileSync('aircraft-photos-data.json', 'utf8'));
  
  console.log(`📸 Found ${photosData.length} aircraft photos to import`);
  
  // Process in batches to avoid overwhelming the database
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < photosData.length; i += BATCH_SIZE) {
    const batch = photosData.slice(i, i + BATCH_SIZE);
    
    // Prepare batch data for database
    const batchData = batch.map(photo => ({
      src: photo.src,
      alt: photo.alt,
      tags: photo.tags,
      location: photo.location,
      date: photo.date,
      photographer: photo.photographer,
      status: 'approved',
      likes_count: Math.floor(Math.random() * 100),
      views: Math.floor(Math.random() * 500),
    }));
    
    try {
      const { error } = await supabase
        .from('gallery_images')
        .insert(batchData);
      
      if (error) {
        console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(photosData.length / BATCH_SIZE)} (${inserted}/${photosData.length} photos)`);
      }
    } catch (err) {
      console.error(`❌ Exception inserting batch:`, err);
      errors += batch.length;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Seeding completed!');
  console.log(`✅ Successfully inserted: ${inserted} photos`);
  if (errors > 0) {
    console.log(`❌ Failed to insert: ${errors} photos`);
  }
}

seedGallery().catch(console.error);

