/**
 * imageUploadService.js
 * Uploads compressed image files directly to Supabase Storage or returns persistent optimized WebP Data URI.
 */
import { supabase } from './supabase';

const BUCKET_NAME = 'product-images';

/**
 * Uploads an image file/blob to Supabase Storage, with fallback to persistent WebP Data URL
 * @param {File|Blob} fileOrBlob 
 * @param {string} customFileName 
 * @param {string} fallbackDataUrl 
 * @returns {Promise<string>} publicUrl or base64 dataUrl
 */
export async function uploadImageToSupabase(fileOrBlob, customFileName = '', fallbackDataUrl = '') {
  try {
    if (fileOrBlob) {
      const fileExt = fileOrBlob.type === 'image/webp' ? 'webp' : (fileOrBlob.name?.split('.').pop() || 'webp');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 7);
      
      let filePath = '';
      if (customFileName.startsWith('banners/') || customFileName.includes('banner')) {
        const cleanName = customFileName.replace(/[^a-zA-Z0-9_-]/g, '_');
        filePath = `banners/${cleanName}_${timestamp}.${fileExt}`;
      } else if (customFileName) {
        const cleanName = customFileName.replace(/[^a-zA-Z0-9_-]/g, '_');
        filePath = `products/${cleanName}_${timestamp}.${fileExt}`;
      } else {
        filePath = `products/prod_${timestamp}_${randomStr}.${fileExt}`;
      }

      // 1. Upload to 'product-images' bucket
      const uploadResult = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileOrBlob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: fileOrBlob.type || 'image/webp'
        });

      if (!uploadResult.error) {
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn('Upload to product-images storage warning:', uploadResult.error);
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload notice:', err);
  }

  // 2. Persistent fallback if bucket is unreachable
  if (fallbackDataUrl) {
    return fallbackDataUrl;
  }

  return '';
}
