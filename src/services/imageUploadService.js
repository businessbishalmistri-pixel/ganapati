import { supabase } from './supabase';

/**
 * imageUploadService.js
 * Handles direct uploading of compressed image files to Supabase Storage.
 * Auto-detects active buckets and returns the permanent Supabase public CDN URL.
 */
export async function uploadProductImageToSupabase(file) {
  if (!file) throw new Error('No image file provided');

  const ext = file.name.split('.').pop() || 'webp';
  const cleanBase = (file.name.split('.')[0] || 'img')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 15);
  const fileName = `gp_${Date.now()}_${cleanBase}.${ext}`;
  const filePath = `products/${fileName}`;

  // Candidate public buckets in Supabase
  const candidateBuckets = ['products', 'product-images', 'public', 'images', 'media', 'storefront'];

  let publicUrl = null;
  let lastError = null;

  for (const bucket of candidateBuckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: true,
          contentType: file.type || 'image/webp'
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          publicUrl = publicData.publicUrl;
          break;
        }
      } else if (error) {
        lastError = error;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!publicUrl) {
    // If standard folder upload failed, try root of first available bucket
    for (const bucket of candidateBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '31536000',
            upsert: true,
            contentType: file.type || 'image/webp'
          });

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) {
            publicUrl = publicData.publicUrl;
            break;
          }
        }
      } catch (e) {
        lastError = e;
      }
    }
  }

  if (!publicUrl) {
    throw new Error(lastError?.message || 'Unable to upload to Supabase Storage. Please ensure public storage bucket is configured.');
  }

  return publicUrl;
}
