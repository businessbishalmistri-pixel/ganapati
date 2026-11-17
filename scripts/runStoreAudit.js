import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = 'https://ftiivdzbimggyxbbkaji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWl2ZHpiaW1nZ3l4YmJrYWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQ2MDksImV4cCI6MjEwNDYxMDYwOX0.ybjdQubcyaathpa4fXhv5nr2otanhyvEbDpbLxeIqXI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin credentials for the write tests come only from the environment.
// Never hardcode them here.
const ADMIN_EMAIL = process.env.SUPABASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD;

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
  console.log('║       GANAPATI STORE - AUTOMATED SYSTEM & BACKEND AUDIT SUITE        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  console.log('NOTE: this audit WRITES to the live database. Every test row it creates');
  console.log('is clearly marked AUDIT TEST and deleted again in the same run.\n');

  // Checklist values: true = passed, false = failed, null = skipped.
  const checklist = {
    supabaseConnection: false,
    storeSettingsFetch: false,
    storeSettingsUpdate: false,
    storageBucketUpload: false,
    storageCdnDelivery: false,
    productsCatalogSync: false,
    productCrud: false,
    categoryCrud: false,
    ordersInsert: false,
  };

  const auditDetails = {};

  // 1. Supabase Store Settings Read
  console.log('▶ [TEST 1/8] Querying store_settings (id = "main_store")...');
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

  // Admin sign-in for the write tests (tests 2-4 and 6-8).
  let adminSignedIn = false;
  console.log('\n▶ Signing in as admin for the write tests...');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('  ⚠️ SUPABASE_ADMIN_EMAIL / SUPABASE_ADMIN_PASSWORD are not set.');
    console.log('  ⚠️ Write tests will be skipped. Set both variables to run them.');
  } else {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      if (signInError) {
        console.error('  ❌ Admin sign-in failed:', signInError.message);
        console.log('  ⚠️ Write tests will be skipped.');
      } else {
        adminSignedIn = true;
        console.log('  ✔ Signed in as admin');
      }
    } catch (err) {
      console.error('  ❌ Admin sign-in exception:', err.message);
      console.log('  ⚠️ Write tests will be skipped.');
    }
  }

  // 2. Supabase Store Settings Update & Persistence Test
  console.log('\n▶ [TEST 2/8] Testing real-time write to store_settings...');
  if (!adminSignedIn) {
    checklist.storeSettingsUpdate = null;
    console.log('  ⚠️ Skipped: admin sign-in required for write tests.');
  } else {
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
  }

  // 3. Storage Bucket Upload Test
  console.log('\n▶ [TEST 3/8] Testing direct image upload to Supabase Storage ("product-images")...');
  const testStorageKey = `banners/audit_check_${Date.now()}.webp`;
  const dummyBuffer = Buffer.from('RIFF....WEBPVP8 ...'); // Simulated binary image content
  let uploadedPublicUrl = null;

  if (!adminSignedIn) {
    checklist.storageBucketUpload = null;
    console.log('  ⚠️ Skipped: admin sign-in required for write tests.');
  } else {
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
  }

  // 4. Storage Public CDN HTTP Reachability Test
  console.log('\n▶ [TEST 4/8] Testing HTTPS CDN retrieval for uploaded asset...');
  if (!uploadedPublicUrl) {
    checklist.storageCdnDelivery = null;
    console.log('  ⚠️ Skipped: no asset was uploaded in TEST 3.');
  } else {
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
  console.log('\n▶ [TEST 5/8] Checking live Products Catalog and schema columns...');
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

  // 6. Product Insert / Update / Delete Test (test row, cleaned up in this run)
  console.log('\n▶ [TEST 6/8] Testing product insert, update and delete...');
  if (!adminSignedIn) {
    checklist.productCrud = null;
    console.log('  ⚠️ Skipped: admin sign-in required for write tests.');
  } else {
    const testProductId = `audit_prod_${Date.now()}`;
    try {
      const { error: insertErr } = await supabase.from('products').insert([{
        id: testProductId,
        name: 'AUDIT TEST PRODUCT - DELETE ME',
        title: 'AUDIT TEST PRODUCT - DELETE ME',
        category: 'Audit Test',
        selling_price: 1,
        price: 1,
        mrp: 1,
        stock: 0,
        stock_quantity: 0,
        status: 'draft'
      }]);
      if (insertErr) throw new Error('insert failed: ' + insertErr.message);
      console.log('  ✔ Test product inserted');

      const { error: updateErr } = await supabase
        .from('products')
        .update({ selling_price: 2, price: 2 })
        .eq('id', testProductId);
      if (updateErr) throw new Error('update failed: ' + updateErr.message);
      console.log('  ✔ Test product updated');

      const { error: deleteErr } = await supabase.from('products').delete().eq('id', testProductId);
      if (deleteErr) throw new Error('delete failed: ' + deleteErr.message);
      console.log('  ✔ Test product deleted');
      checklist.productCrud = true;
    } catch (err) {
      console.error('❌ Product CRUD test failed:', err.message);
      // Best-effort cleanup of the test row
      await supabase.from('products').delete().eq('id', testProductId);
    }
  }

  // 7. Category Upsert / Delete Test (test row, cleaned up in this run)
  console.log('\n▶ [TEST 7/8] Testing category upsert and delete...');
  if (!adminSignedIn) {
    checklist.categoryCrud = null;
    console.log('  ⚠️ Skipped: admin sign-in required for write tests.');
  } else {
    const testCategoryId = `audit_cat_${Date.now()}`;
    try {
      const { error: upsertErr } = await supabase.from('categories').upsert([{
        id: testCategoryId,
        name: 'AUDIT TEST CATEGORY - DELETE ME',
        slug: 'audit-test-category',
        icon: 'Package'
      }], { onConflict: 'id' });
      if (upsertErr) throw new Error('upsert failed: ' + upsertErr.message);
      console.log('  ✔ Test category upserted');

      const { error: deleteErr } = await supabase.from('categories').delete().eq('id', testCategoryId);
      if (deleteErr) throw new Error('delete failed: ' + deleteErr.message);
      console.log('  ✔ Test category deleted');
      checklist.categoryCrud = true;
    } catch (err) {
      console.error('❌ Category CRUD test failed:', err.message);
      // Best-effort cleanup of the test row
      await supabase.from('categories').delete().eq('id', testCategoryId);
    }
  }

  // 8. Orders Insert Test (test row, cleaned up in this run)
  console.log('\n▶ [TEST 8/8] Testing order insert into "orders"...');
  if (!adminSignedIn) {
    checklist.ordersInsert = null;
    console.log('  ⚠️ Skipped: admin sign-in required for write tests.');
  } else {
    const testOrderId = `AUDIT-${Date.now()}`;
    try {
      const { error: insertErr } = await supabase.from('orders').insert([{
        order_id: testOrderId,
        customer_name: 'AUDIT TEST - DELETE ME',
        customer_phone: '0000000000',
        items: [],
        total_amount: 0,
        status: 'cancelled'
      }]);
      if (insertErr) throw new Error('insert failed: ' + insertErr.message);
      console.log('  ✔ Test order inserted');

      const { error: deleteErr } = await supabase.from('orders').delete().eq('order_id', testOrderId);
      if (deleteErr) throw new Error('delete failed: ' + deleteErr.message);
      console.log('  ✔ Test order deleted');
      checklist.ordersInsert = true;
    } catch (err) {
      console.error('❌ Orders insert test failed:', err.message);
      // Best-effort cleanup of the test row
      await supabase.from('orders').delete().eq('order_id', testOrderId);
    }
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('                    AUDIT RESULT SUMMARY MATRIX                       ');
  console.log('══════════════════════════════════════════════════════════════════════');
  const statusOf = (v) => (v === true ? '🟢 PASSED' : v === null ? '🟡 SKIPPED' : '🔴 FAILED');
  console.log(`• Supabase Database Connection : ${statusOf(checklist.supabaseConnection)}`);
  console.log(`• Store Settings Retrieval     : ${statusOf(checklist.storeSettingsFetch)}`);
  console.log(`• Store Settings Persistence   : ${statusOf(checklist.storeSettingsUpdate)}`);
  console.log(`• Supabase Storage Upload      : ${statusOf(checklist.storageBucketUpload)}`);
  console.log(`• Storage Public CDN Delivery  : ${statusOf(checklist.storageCdnDelivery)}`);
  console.log(`• Products Catalog Sync        : ${statusOf(checklist.productsCatalogSync)}`);
  console.log(`• Product Insert/Update/Delete : ${statusOf(checklist.productCrud)}`);
  console.log(`• Category Upsert/Delete       : ${statusOf(checklist.categoryCrud)}`);
  console.log(`• Orders Insert                : ${statusOf(checklist.ordersInsert)}`);
  console.log('──────────────────────────────────────────────────────────────────────');

  const failed = Object.values(checklist).some((v) => v === false);
  const skipped = Object.values(checklist).some((v) => v === null);
  if (!failed && !skipped) {
    console.log('✅ ALL SYSTEMS 100% OPERATIONAL & VERIFIED!');
  } else if (!failed && skipped) {
    console.log('✅ All ran tests passed. Some write tests were skipped: set');
    console.log('   SUPABASE_ADMIN_EMAIL and SUPABASE_ADMIN_PASSWORD to run them.');
  } else {
    console.log('⚠️ Some components require attention. See logs above.');
  }
}

runStoreAudit();
