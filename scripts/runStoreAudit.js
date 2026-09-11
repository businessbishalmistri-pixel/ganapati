import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = 'https://ftiivdzbimggyxbbkaji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWl2ZHpiaW1nZ3l4YmJrYWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQ2MDksImV4cCI6MjEwNDYxMDYwOX0.ybjdQubcyaathpa4fXhv5nr2otanhyvEbDpbLxeIqXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function fetchUrlStatus(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ statusCode: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function runStoreAudit() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║       GANAPATI STORE — AUTOMATED SYSTEM & BACKEND AUDIT SUITE        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const checklist = {
    supabaseConnection: false,
    storeSettingsFetch: false,
    storeSettingsUpdate: false,
    storageBucketUpload: false,
    storageCdnDelivery: false,
    productsCatalogSync: false,
  };

  const auditDetails = {};

  // 1. Supabase Store Settings Read
  console.log('▶ [TEST 1/5] Querying store_settings (id = "main_store")...');
  try {
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'main_store')
      .maybeSingle();

    if (error) {
      console.error('❌ Failed to fetch store_settings:', error.message);
    } else if (settings) {
      checklist.supabaseConnection = true;
      checklist.storeSettingsFetch = true;
      auditDetails.storeSettings = {
        name: settings.store_name,
        address: settings.store_address,
        phone: settings.whatsapp_number,
        hours: settings.store_hours,
        announcement: settings.announcement_text,
        banner: settings.banner_image_url || '(Not set / Default)',
        shipping: `Flat ₹${settings.flat_shipping_fee} | Free above ₹${settings.free_shipping_threshold}`,
        lastUpdated: settings.updated_at
      };
      console.log('  ✔ Connection verified');
      console.log('  ✔ Loaded store settings:', auditDetails.storeSettings);
    }
  } catch (err) {
    console.error('❌ store_settings exception:', err.message);
  }

  // 2. Supabase Store Settings Update & Persistence Test
  console.log('\n▶ [TEST 2/5] Testing real-time write to store_settings...');
  try {
    const testTime = new Date().toISOString();
    const { data: updatedRows, error: updateErr } = await supabase
      .from('store_settings')
      .update({ updated_at: testTime })
      .eq('id', 'main_store')
      .select();

    if (updateErr) {
      console.error('❌ store_settings update failed:', updateErr.message);
    } else if (Array.isArray(updatedRows) && updatedRows.length > 0) {
      checklist.storeSettingsUpdate = true;
      console.log('  ✔ Write test passed: updated_at timestamp persisted to database (' + updatedRows[0].updated_at + ')');
    }
  } catch (err) {
    console.error('❌ Write test exception:', err.message);
  }

  // 3. Storage Bucket Upload Test
  console.log('\n▶ [TEST 3/5] Testing direct image upload to Supabase Storage ("product-images")...');
  const testStorageKey = `banners/audit_check_${Date.now()}.webp`;
  const dummyBuffer = Buffer.from('RIFF....WEBPVP8 ...'); // Simulated binary image content
  let uploadedPublicUrl = null;

  try {
    const { data: uploadRes, error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(testStorageKey, dummyBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadErr) {
      console.error('❌ Storage upload failed:', uploadErr.message);
    } else {
      checklist.storageBucketUpload = true;
      console.log('  ✔ Direct upload to "product-images" successful');

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(testStorageKey);

      uploadedPublicUrl = urlData?.publicUrl;
      console.log('  ✔ Generated CDN URL:', uploadedPublicUrl);
    }
  } catch (err) {
    console.error('❌ Storage test exception:', err.message);
  }

  // 4. Storage Public CDN HTTP Reachability Test
  console.log('\n▶ [TEST 4/5] Testing HTTPS CDN retrieval for uploaded asset...');
  if (uploadedPublicUrl) {
    try {
      const httpRes = await fetchUrlStatus(uploadedPublicUrl);
      if (httpRes.statusCode === 200) {
        checklist.storageCdnDelivery = true;
        console.log(`  ✔ Asset delivered over HTTPS with HTTP ${httpRes.statusCode} (${httpRes.contentType})`);
      } else {
        console.warn(`  ⚠️ Asset status: ${httpRes.statusCode || httpRes.error}`);
      }

      // Cleanup
      await supabase.storage.from('product-images').remove([testStorageKey]);
      console.log('  ✔ Test asset safely removed from storage bucket');
    } catch (err) {
      console.error('❌ CDN check exception:', err.message);
    }
  }

  // 5. Products Inventory Catalog Test
  console.log('\n▶ [TEST 5/5] Checking live Products Catalog and schema columns...');
  try {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, selling_price, mrp, stock_quantity, stock, category')
      .order('created_at', { ascending: false })
      .limit(6);

    if (prodErr) {
      console.error('❌ Products query failed:', prodErr.message);
    } else if (Array.isArray(products)) {
      checklist.productsCatalogSync = true;
      console.log(`  ✔ Successfully fetched ${products.length} products from Supabase:`);
      products.forEach((p, idx) => {
        const effectivePrice = p.selling_price || p.price || 0;
        const effectiveStock = p.stock_quantity ?? p.stock ?? 'N/A';
        console.log(`     ${idx + 1}. [${p.category || 'General'}] ${p.name || 'Untitled'} - ₹${effectivePrice} (Stock: ${effectiveStock})`);
      });
    }
  } catch (err) {
    console.error('❌ Products catalog exception:', err.message);
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('                    AUDIT RESULT SUMMARY MATRIX                       ');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(`• Supabase Database Connection : ${checklist.supabaseConnection ? '🟢 PASSED' : '🔴 FAILED'}`);
  console.log(`• Store Settings Retrieval     : ${checklist.storeSettingsFetch ? '🟢 PASSED' : '🔴 FAILED'}`);
  console.log(`• Store Settings Persistence   : ${checklist.storeSettingsUpdate ? '🟢 PASSED' : '🔴 FAILED'}`);
  console.log(`• Supabase Storage Upload      : ${checklist.storageBucketUpload ? '🟢 PASSED' : '🔴 FAILED'}`);
  console.log(`• Storage Public CDN Delivery  : ${checklist.storageCdnDelivery ? '🟢 PASSED' : '🔴 FAILED'}`);
  console.log(`• Products Catalog Sync        : ${checklist.productsCatalogSync ? '🟢 PASSED' : '🔴 FAILED'}`);
  console.log('──────────────────────────────────────────────────────────────────────');

  const allPassed = Object.values(checklist).every(Boolean);
  if (allPassed) {
    console.log('✅ ALL SYSTEMS 100% OPERATIONAL & VERIFIED!');
  } else {
    console.log('⚠️ Some components require attention. See logs above.');
  }
}

runStoreAudit();
