import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ftiivdzbimggyxbbkaji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWl2ZHpiaW1nZ3l4YmJrYWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQ2MDksImV4cCI6MjEwNDYxMDYwOX0.ybjdQubcyaathpa4fXhv5nr2otanhyvEbDpbLxeIqXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectSchema() {
  console.log('--- Inspecting Products table ---');
  const { data: prods, error: prodErr } = await supabase.from('products').select('*').limit(1);
  if (prodErr) {
    console.error('Products error:', prodErr);
  } else {
    console.log('Products columns:', prods.length > 0 ? Object.keys(prods[0]) : 'No rows');
  }

  console.log('\n--- Inspecting store_settings update ---');
  const testIso = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from('store_settings')
    .update({ updated_at: testIso })
    .eq('id', 'main_store')
    .select();
  
  if (updateErr) {
    console.error('Update error:', updateErr);
  } else {
    console.log('Update success:', updated);
  }

  console.log('\n--- Inspecting all tables in public schema ---');
  // Check known tables
  const tables = ['store_settings', 'products', 'categories', 'orders', 'banners', 'admins'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table '${t}': Not found or error (${error.message})`);
    } else {
      console.log(`Table '${t}': Found (${count} rows)`);
    }
  }
}

inspectSchema();
